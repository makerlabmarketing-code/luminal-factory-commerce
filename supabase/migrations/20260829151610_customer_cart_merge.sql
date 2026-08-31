-- Phase 6 Slice B: verified customer linking and atomic guest-cart merge.
-- Runtime remains default-off. This migration does not grant browser access,
-- reserve inventory, create orders/payments or write raffle/ERP state.

create table private.customer_cart_merge_receipts (
  guest_token_hash bytea primary key,
  auth_user_id uuid not null references auth.users(id) on delete cascade,
  customer_id uuid not null references public.customers(id) on delete cascade,
  cart_id uuid not null references public.carts(id) on delete cascade,
  unavailable_line_count integer not null default 0
    check (unavailable_line_count >= 0),
  capped_line_count integer not null default 0
    check (capped_line_count >= 0),
  created_at timestamptz not null default statement_timestamp(),
  expires_at timestamptz not null,
  constraint customer_cart_merge_receipts_hash_length_check
    check (octet_length(guest_token_hash) = 32),
  constraint customer_cart_merge_receipts_expiry_check
    check (expires_at > created_at)
);

create index customer_cart_merge_receipts_expiry_idx
  on private.customer_cart_merge_receipts(expires_at);

alter table private.customer_cart_merge_receipts enable row level security;

-- No policy is intentional. The receipt is server-only idempotency evidence.
revoke all on table private.customer_cart_merge_receipts
  from public, anon, authenticated;
grant select, insert, delete on table private.customer_cart_merge_receipts
  to service_role;

-- Every cart-line insert/update takes the parent cart lock. This closes the
-- race where a line could otherwise be written after merge captured its input
-- but before the guest cart was marked converted.
create function private.lock_active_cart_for_line_write()
returns trigger
language plpgsql
security invoker
set search_path = ''
as $$
declare
  v_status text;
begin
  select carts.status
  into v_status
  from public.carts as carts
  where carts.id = new.cart_id
  for update;

  if not found or v_status <> 'active' then
    raise exception 'cart is unavailable for line mutation' using errcode = '23514';
  end if;

  return new;
end;
$$;

revoke execute on function private.lock_active_cart_for_line_write()
  from public, anon, authenticated;
grant execute on function private.lock_active_cart_for_line_write()
  to service_role;

create trigger cart_items_lock_active_cart_before_write
before insert or update of cart_id, product_id, variant_id, requested_quantity
on public.cart_items
for each row execute function private.lock_active_cart_for_line_write();

create function public.merge_verified_customer_guest_cart(
  p_auth_user_id uuid,
  p_verified_email text,
  p_guest_token_hash text
)
returns table (
  merge_state text,
  unavailable_line_count integer,
  capped_line_count integer
)
language plpgsql
security invoker
set search_path = ''
set statement_timeout = '5s'
set lock_timeout = '2s'
as $$
declare
  v_now timestamptz := statement_timestamp();
  v_hash bytea;
  v_receipt_auth_user_id uuid;
  v_receipt_unavailable integer;
  v_receipt_capped integer;
  v_guest_cart_id uuid;
  v_guest_currency character(3);
  v_customer_id uuid;
  v_customer_cart_id uuid;
  v_target_line_id uuid;
  v_target_product_id uuid;
  v_target_quantity integer;
  v_combined_quantity integer;
  v_unavailable integer := 0;
  v_capped integer := 0;
  v_guest_line record;
begin
  if p_auth_user_id is null
    or p_verified_email is null
    or p_verified_email <> lower(btrim(p_verified_email))
    or length(p_verified_email) > 254
    or p_verified_email !~ '^[^[:space:]@]+@[^[:space:]@]+$'
    or p_guest_token_hash is null
    or length(p_guest_token_hash) <> 66
    or left(p_guest_token_hash, 2) <> E'\\x'
    or substring(p_guest_token_hash from 3) !~ '^[0-9a-f]{64}$'
  then
    raise exception 'invalid customer cart merge input' using errcode = '22023';
  end if;

  v_hash := decode(substring(p_guest_token_hash from 3), 'hex');

  -- Merge callers always take identity then credential advisory locks. The
  -- fixed order serializes same-subject and replay races without deadlocks.
  perform pg_catalog.pg_advisory_xact_lock(
    pg_catalog.hashtextextended('customer-cart-merge-auth:' || p_auth_user_id::text, 0)
  );
  perform pg_catalog.pg_advisory_xact_lock(
    pg_catalog.hashtextextended('customer-cart-merge-token:' || p_guest_token_hash, 0)
  );

  select receipts.auth_user_id,
         receipts.unavailable_line_count,
         receipts.capped_line_count
  into v_receipt_auth_user_id, v_receipt_unavailable, v_receipt_capped
  from private.customer_cart_merge_receipts as receipts
  where receipts.guest_token_hash = v_hash;

  if found then
    if v_receipt_auth_user_id = p_auth_user_id then
      return query select 'merged'::text, v_receipt_unavailable, v_receipt_capped;
    else
      return query select 'cart_unavailable'::text, 0, 0;
    end if;
    return;
  end if;

  -- The nested block rolls back any customer/cart created by this invocation
  -- when revalidation finds the guest credential unavailable or conflicted.
  begin
    select carts.id, carts.currency
    into v_guest_cart_id, v_guest_currency
    from public.carts as carts
    where carts.guest_token_hash = v_hash
      and carts.customer_id is null
      and carts.status = 'active'
      and carts.expires_at > v_now;

    if not found then
      raise exception 'guest cart unavailable' using errcode = 'P0002';
    end if;

    select customers.id
    into v_customer_id
    from public.customers as customers
    where customers.auth_user_id = p_auth_user_id;

    if not found then
      if exists (
        select 1
        from public.customers as customers
        where lower(btrim(customers.email)) = p_verified_email
          and customers.auth_user_id is distinct from p_auth_user_id
      ) then
        raise exception 'customer identity conflict' using errcode = 'P0003';
      end if;

      insert into public.customers (auth_user_id, email)
      values (p_auth_user_id, p_verified_email)
      on conflict do nothing;

      select customers.id
      into v_customer_id
      from public.customers as customers
      where customers.auth_user_id = p_auth_user_id;

      if not found then
        raise exception 'customer identity conflict' using errcode = 'P0003';
      end if;
    end if;

    select carts.id
    into v_customer_cart_id
    from public.carts as carts
    where carts.customer_id = v_customer_id
      and carts.status = 'active';

    if not found then
      begin
        insert into public.carts (
          customer_id,
          guest_token_hash,
          status,
          currency,
          expires_at,
          last_activity_at,
          created_at,
          updated_at
        )
        values (
          v_customer_id,
          null,
          'active',
          v_guest_currency,
          v_now + interval '30 days',
          v_now,
          v_now,
          v_now
        )
        returning id into v_customer_cart_id;
      exception
        when unique_violation then
          select carts.id
          into v_customer_cart_id
          from public.carts as carts
          where carts.customer_id = v_customer_id
            and carts.status = 'active';

          if not found then
            raise;
          end if;
      end;
    end if;

    -- Lock both cart rows in UUID order. Cart-line writes now acquire the same
    -- parent lock through the trigger above, so the captured line set is stable.
    perform carts.id
    from public.carts as carts
    where carts.id in (v_guest_cart_id, v_customer_cart_id)
    order by carts.id
    for update;

    select carts.currency
    into v_guest_currency
    from public.carts as carts
    where carts.id = v_guest_cart_id
      and carts.guest_token_hash = v_hash
      and carts.customer_id is null
      and carts.status = 'active'
      and carts.expires_at > v_now;

    if not found then
      raise exception 'guest cart unavailable' using errcode = 'P0002';
    end if;

    for v_guest_line in
      select items.id,
             items.product_id,
             items.variant_id,
             items.requested_quantity
      from public.cart_items as items
      where items.cart_id = v_guest_cart_id
      order by items.id
      for update
    loop
      if not exists (
        select 1
        from public.products as products
        where products.id = v_guest_line.product_id
          and products.status = 'published'
          and products.published_at is not null
          and products.published_at <= v_now
          and (
            v_guest_line.variant_id is null
            or exists (
              select 1
              from public.product_variants as variants
              where variants.id = v_guest_line.variant_id
                and variants.product_id = products.id
                and variants.is_active
            )
          )
      ) then
        v_unavailable := v_unavailable + 1;
        continue;
      end if;

      v_target_line_id := null;
      v_target_product_id := null;
      v_target_quantity := null;

      if v_guest_line.variant_id is null then
        select items.id, items.product_id, items.requested_quantity
        into v_target_line_id, v_target_product_id, v_target_quantity
        from public.cart_items as items
        where items.cart_id = v_customer_cart_id
          and items.product_id = v_guest_line.product_id
          and items.variant_id is null
        for update;
      else
        select items.id, items.product_id, items.requested_quantity
        into v_target_line_id, v_target_product_id, v_target_quantity
        from public.cart_items as items
        where items.cart_id = v_customer_cart_id
          and items.variant_id = v_guest_line.variant_id
        for update;
      end if;

      if found then
        if v_target_product_id <> v_guest_line.product_id then
          raise exception 'customer cart contains an invalid variant selection'
            using errcode = '23514';
        end if;

        v_combined_quantity := v_target_quantity + v_guest_line.requested_quantity;
        if v_combined_quantity > 99 then
          v_capped := v_capped + 1;
        end if;

        update public.cart_items
        set requested_quantity = least(v_combined_quantity, 99),
            updated_at = v_now
        where id = v_target_line_id;
      else
        insert into public.cart_items (
          cart_id,
          product_id,
          variant_id,
          requested_quantity,
          created_at,
          updated_at
        )
        values (
          v_customer_cart_id,
          v_guest_line.product_id,
          v_guest_line.variant_id,
          v_guest_line.requested_quantity,
          v_now,
          v_now
        );
      end if;
    end loop;

    delete from public.cart_items
    where cart_id = v_guest_cart_id;

    update public.carts
    set status = 'converted',
        guest_token_hash = null,
        updated_at = v_now,
        last_activity_at = v_now
    where id = v_guest_cart_id;

    update public.carts
    set updated_at = v_now,
        last_activity_at = v_now,
        expires_at = greatest(expires_at, v_now + interval '30 days')
    where id = v_customer_cart_id;

    insert into private.customer_cart_merge_receipts (
      guest_token_hash,
      auth_user_id,
      customer_id,
      cart_id,
      unavailable_line_count,
      capped_line_count,
      created_at,
      expires_at
    )
    values (
      v_hash,
      p_auth_user_id,
      v_customer_id,
      v_customer_cart_id,
      v_unavailable,
      v_capped,
      v_now,
      v_now + interval '37 days'
    );

    return query select 'merged'::text, v_unavailable, v_capped;
    return;
  exception
    when sqlstate 'P0002' then
      return query select 'cart_unavailable'::text, 0, 0;
      return;
    when sqlstate 'P0003' then
      return query select 'identity_conflict'::text, 0, 0;
      return;
  end;
end;
$$;

revoke execute on function public.merge_verified_customer_guest_cart(uuid, text, text)
  from public, anon, authenticated;
grant execute on function public.merge_verified_customer_guest_cart(uuid, text, text)
  to service_role;

select cron.schedule(
  'commerce-customer-cart-merge-receipt-cleanup',
  '29 * * * *',
  $cleanup$
    delete from private.customer_cart_merge_receipts
    where expires_at <= statement_timestamp();
  $cleanup$
);
