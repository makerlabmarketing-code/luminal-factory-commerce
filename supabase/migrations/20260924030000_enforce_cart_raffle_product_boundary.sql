-- Enforce the business boundary that artisan keycaps are raffle-only.
-- Cart remains reserved for cart-eligible non-keycap objects such as toys / 3D models.
-- Runtime flags remain default-off.

create or replace function private.reject_artisan_keycap_cart_item()
returns trigger
language plpgsql
security invoker
set search_path = ''
as $$
begin
  if new.product_id is not null
    and exists (
      select 1
      from public.products as products
      where products.id = new.product_id
        and products.product_type = 'artisan_keycap'
    )
  then
    raise exception 'artisan keycaps are not cart eligible'
      using errcode = '23514';
  end if;

  return new;
end;
$$;

revoke execute on function private.reject_artisan_keycap_cart_item()
  from public, anon, authenticated;
grant execute on function private.reject_artisan_keycap_cart_item()
  to service_role;

drop trigger if exists cart_items_reject_artisan_keycap on public.cart_items;

create trigger cart_items_reject_artisan_keycap
before insert or update of product_id on public.cart_items
for each row
execute function private.reject_artisan_keycap_cart_item();

create or replace function private.verified_customer_cart_document(
  p_cart_id uuid,
  p_now timestamptz
)
returns jsonb
language sql
stable
security invoker
set search_path = ''
as $$
  with evaluated as (
    select items.product_id,
           items.variant_id,
           items.requested_quantity,
           items.created_at,
           items.id,
           exists (
             select 1
             from public.products as products
             where products.id = items.product_id
               and products.status = 'published'
               and products.published_at is not null
               and products.published_at <= p_now
               and products.product_type <> 'artisan_keycap'
               and (
                 items.variant_id is null
                 or exists (
                   select 1
                   from public.product_variants as variants
                   where variants.id = items.variant_id
                     and variants.product_id = products.id
                     and variants.is_active
                 )
               )
           ) as is_available
    from public.cart_items as items
    where items.cart_id = p_cart_id
  ), ranked as (
    select evaluated.*,
           count(*) filter (where evaluated.is_available) over (
             order by evaluated.created_at, evaluated.id
             rows between unbounded preceding and current row
           ) as available_position
    from evaluated
  ), line_summary as (
    select coalesce(
             jsonb_agg(
               jsonb_build_object(
                 'productId', ranked.product_id,
                 'variantId', ranked.variant_id,
                 'requestedQuantity', ranked.requested_quantity
               )
               order by ranked.created_at, ranked.id
             ) filter (
               where ranked.is_available
                 and ranked.available_position <= 50
             ),
             '[]'::jsonb
           ) as lines,
           count(*) filter (
             where not ranked.is_available
                or ranked.available_position > 50
           )::integer as unavailable_line_count
    from ranked
  )
  select jsonb_build_object(
    'state', 'cart',
    'currency', carts.currency,
    'expiresAt', carts.expires_at,
    'lines', line_summary.lines,
    'unavailableLineCount', line_summary.unavailable_line_count
  )
  from public.carts as carts
  cross join line_summary
  where carts.id = p_cart_id;
$$;

revoke execute on function private.verified_customer_cart_document(uuid, timestamptz)
  from public, anon, authenticated;
grant execute on function private.verified_customer_cart_document(uuid, timestamptz)
  to service_role;

create or replace function public.set_verified_customer_cart_line(
  p_auth_user_id uuid,
  p_verified_email text,
  p_product_id uuid,
  p_variant_id uuid,
  p_requested_quantity integer
)
returns jsonb
language plpgsql
security invoker
set search_path = ''
set statement_timeout = '5s'
set lock_timeout = '2s'
as $$
declare
  v_now timestamptz := statement_timestamp();
  v_customer_id uuid;
  v_cart_id uuid;
  v_cart_expires_at timestamptz;
  v_line_id uuid;
  v_line_product_id uuid;
begin
  if p_auth_user_id is null
    or p_verified_email is null
    or p_verified_email <> lower(btrim(p_verified_email))
    or length(p_verified_email) > 254
    or p_verified_email !~ '^[^[:space:]@]+@[^[:space:]@]+$'
    or p_product_id is null
    or p_requested_quantity is null
    or p_requested_quantity < 1
    or p_requested_quantity > 99
  then
    raise exception 'invalid verified customer cart input' using errcode = '22023';
  end if;

  if not exists (
    select 1
    from public.products as products
    where products.id = p_product_id
      and products.status = 'published'
      and products.published_at is not null
      and products.published_at <= v_now
      and products.product_type <> 'artisan_keycap'
      and (
        p_variant_id is null
        or exists (
          select 1
          from public.product_variants as variants
          where variants.id = p_variant_id
            and variants.product_id = products.id
            and variants.is_active
        )
      )
  ) then
    return jsonb_build_object('state', 'catalog_selection_unavailable');
  end if;

  perform pg_catalog.pg_advisory_xact_lock(
    pg_catalog.hashtextextended('customer-cart-merge-auth:' || p_auth_user_id::text, 0)
  );

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
      return jsonb_build_object('state', 'identity_conflict');
    end if;

    insert into public.customers (auth_user_id, email)
    values (p_auth_user_id, p_verified_email)
    on conflict do nothing;

    select customers.id
    into v_customer_id
    from public.customers as customers
    where customers.auth_user_id = p_auth_user_id;

    if not found then
      return jsonb_build_object('state', 'identity_conflict');
    end if;
  end if;

  select carts.id, carts.expires_at
  into v_cart_id, v_cart_expires_at
  from public.carts as carts
  where carts.customer_id = v_customer_id
    and carts.status = 'active'
  for update;

  if found and v_cart_expires_at <= v_now then
    update public.carts
    set status = 'expired',
        updated_at = v_now,
        last_activity_at = v_now
    where id = v_cart_id;
    v_cart_id := null;
  end if;

  if v_cart_id is null then
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
      'USD',
      v_now + interval '30 days',
      v_now,
      v_now,
      v_now
    )
    returning id into v_cart_id;
  end if;

  if p_variant_id is null then
    select items.id, items.product_id
    into v_line_id, v_line_product_id
    from public.cart_items as items
    where items.cart_id = v_cart_id
      and items.product_id = p_product_id
      and items.variant_id is null
    for update;
  else
    select items.id, items.product_id
    into v_line_id, v_line_product_id
    from public.cart_items as items
    where items.cart_id = v_cart_id
      and items.variant_id = p_variant_id
    for update;
  end if;

  if found then
    if v_line_product_id <> p_product_id then
      raise exception 'customer cart contains an invalid variant selection'
        using errcode = '23514';
    end if;

    update public.cart_items
    set requested_quantity = p_requested_quantity,
        updated_at = v_now
    where id = v_line_id;
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
      v_cart_id,
      p_product_id,
      p_variant_id,
      p_requested_quantity,
      v_now,
      v_now
    );
  end if;

  update public.carts
  set last_activity_at = v_now,
      expires_at = v_now + interval '30 days',
      updated_at = v_now
  where id = v_cart_id;

  return private.verified_customer_cart_document(v_cart_id, v_now);
end;
$$;

revoke execute on function public.set_verified_customer_cart_line(uuid, text, uuid, uuid, integer)
  from public, anon, authenticated;
grant execute on function public.set_verified_customer_cart_line(uuid, text, uuid, uuid, integer)
  to service_role;


-- Revalidate the guest-to-customer merge against the same cart product-type
-- boundary. Existing lines that later become artisan keycaps are counted as
-- unavailable and skipped instead of failing the whole merge.
CREATE OR REPLACE FUNCTION public.merge_verified_customer_guest_cart(p_auth_user_id uuid, p_verified_email text, p_guest_token_hash text)
 RETURNS TABLE(merge_state text, unavailable_line_count integer, capped_line_count integer)
 LANGUAGE plpgsql
 SET search_path TO ''
 SET statement_timeout TO '5s'
 SET lock_timeout TO '2s'
AS $function$
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
          and products.product_type <> 'artisan_keycap'
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
$function$


revoke execute on function public.merge_verified_customer_guest_cart(uuid, text, text)
  from public, anon, authenticated;
grant execute on function public.merge_verified_customer_guest_cart(uuid, text, text)
  to service_role;
