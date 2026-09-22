-- Approved implementation scope under RAFFLE-ERP-SCHEMA-01.
-- Adds idempotent Commerce Admin mutations for Product and Raffle management.
-- No product or raffle rows are created by this migration.

alter table private.commerce_admin_idempotency_receipts
  drop constraint if exists commerce_admin_idempotency_operation_check;

alter table private.commerce_admin_idempotency_receipts
  add constraint commerce_admin_idempotency_operation_check
  check (operation in (
    'create_draft',
    'update_draft',
    'publish',
    'unpublish',
    'product_create_draft',
    'product_update_draft',
    'product_publish',
    'product_archive',
    'raffle_create_draft',
    'raffle_update_draft',
    'raffle_publish',
    'raffle_unpublish'
  ));

create function public.manage_catalog_product(
  p_operation_id uuid,
  p_client_id text,
  p_action text,
  p_target_id uuid,
  p_request_fingerprint text,
  p_product jsonb
)
returns jsonb
language plpgsql
security invoker
set search_path = ''
set statement_timeout = '5s'
set lock_timeout = '2s'
as $$
declare
  v_operation text := 'product_' || p_action;
  v_claimed boolean := false;
  v_existing private.commerce_admin_idempotency_receipts%rowtype;
  v_product public.products%rowtype;
begin
  if p_action not in ('create_draft', 'update_draft', 'publish', 'archive') then
    raise exception 'invalid product management action' using errcode = '22023';
  end if;

  insert into private.commerce_admin_idempotency_receipts (
    client_id, operation_id, operation, request_fingerprint
  ) values (
    p_client_id, p_operation_id, v_operation, p_request_fingerprint
  )
  on conflict (client_id, operation_id) do nothing
  returning true into v_claimed;

  if not coalesce(v_claimed, false) then
    select * into v_existing
    from private.commerce_admin_idempotency_receipts
    where client_id = p_client_id and operation_id = p_operation_id;

    if not found or v_existing.operation <> v_operation or v_existing.request_fingerprint <> p_request_fingerprint then
      raise exception 'operation id was already used for a different request' using errcode = '22023';
    end if;
    if v_existing.result_json is null then
      raise exception 'operation is already in progress' using errcode = '55P03';
    end if;
    return v_existing.result_json;
  end if;

  if p_action in ('create_draft', 'update_draft') and p_product is null then
    raise exception 'product payload is required' using errcode = '22023';
  end if;

  if p_action = 'create_draft' then
    if p_product->>'product_type' = 'artisan_keycap'
      and p_product->>'release_type' <> 'informational'
    then
      raise exception 'artisan keycaps must use informational product release type and sell through Raffle'
        using errcode = '22023';
    end if;

    insert into public.products (
      slug, name, description, product_type, release_type, status, published_at
    ) values (
      p_product->>'slug',
      p_product->>'name',
      nullif(p_product->>'description', ''),
      p_product->>'product_type',
      p_product->>'release_type',
      'draft',
      null
    )
    returning * into v_product;

  elsif p_action = 'update_draft' then
    if p_product->>'product_type' = 'artisan_keycap'
      and p_product->>'release_type' <> 'informational'
    then
      raise exception 'artisan keycaps must use informational product release type and sell through Raffle'
        using errcode = '22023';
    end if;

    update public.products
    set slug = p_product->>'slug',
        name = p_product->>'name',
        description = nullif(p_product->>'description', ''),
        product_type = p_product->>'product_type',
        release_type = p_product->>'release_type'
    where id = p_target_id and status = 'draft'
    returning * into v_product;

    if not found then
      raise exception 'product draft not found' using errcode = 'P0002';
    end if;

  elsif p_action = 'publish' then
    update public.products
    set status = 'published',
        published_at = coalesce(published_at, statement_timestamp())
    where id = p_target_id and status in ('draft', 'published')
    returning * into v_product;

    if not found then
      raise exception 'product not found' using errcode = 'P0002';
    end if;

  else
    update public.products
    set status = 'archived'
    where id = p_target_id and status <> 'archived'
    returning * into v_product;

    if not found then
      select * into v_product from public.products where id = p_target_id;
      if not found then raise exception 'product not found' using errcode = 'P0002'; end if;
    end if;
  end if;

  update private.commerce_admin_idempotency_receipts
  set result_json = to_jsonb(v_product)
  where client_id = p_client_id and operation_id = p_operation_id;

  return to_jsonb(v_product);
end;
$$;

revoke execute on function public.manage_catalog_product(uuid, text, text, uuid, text, jsonb)
  from public, anon, authenticated;
grant execute on function public.manage_catalog_product(uuid, text, text, uuid, text, jsonb)
  to service_role;

create function public.manage_raffle(
  p_operation_id uuid,
  p_client_id text,
  p_action text,
  p_target_id uuid,
  p_request_fingerprint text,
  p_raffle jsonb
)
returns jsonb
language plpgsql
security invoker
set search_path = ''
set statement_timeout = '5s'
set lock_timeout = '2s'
as $$
declare
  v_operation text := 'raffle_' || p_action;
  v_claimed boolean := false;
  v_existing private.commerce_admin_idempotency_receipts%rowtype;
  v_raffle public.raffles%rowtype;
  v_status text;
  v_is_test boolean;
begin
  if p_action not in ('create_draft', 'update_draft', 'publish', 'unpublish') then
    raise exception 'invalid raffle management action' using errcode = '22023';
  end if;

  insert into private.commerce_admin_idempotency_receipts (
    client_id, operation_id, operation, request_fingerprint
  ) values (
    p_client_id, p_operation_id, v_operation, p_request_fingerprint
  )
  on conflict (client_id, operation_id) do nothing
  returning true into v_claimed;

  if not coalesce(v_claimed, false) then
    select * into v_existing
    from private.commerce_admin_idempotency_receipts
    where client_id = p_client_id and operation_id = p_operation_id;

    if not found or v_existing.operation <> v_operation or v_existing.request_fingerprint <> p_request_fingerprint then
      raise exception 'operation id was already used for a different request' using errcode = '22023';
    end if;
    if v_existing.result_json is null then
      raise exception 'operation is already in progress' using errcode = '55P03';
    end if;
    return v_existing.result_json;
  end if;

  if p_action in ('create_draft', 'update_draft') and p_raffle is null then
    raise exception 'raffle payload is required' using errcode = '22023';
  end if;

  if p_action in ('create_draft', 'update_draft') then
    v_status := coalesce(nullif(p_raffle->>'status', ''), 'DRAFT');
    v_is_test := coalesce((p_raffle->>'is_test')::boolean, false);

    if v_is_test then
      if v_status not in ('DRAFT', 'SCHEDULED', 'OPEN', 'CLOSED') then
        raise exception 'invalid test raffle state' using errcode = '22023';
      end if;
    elsif v_status not in ('DRAFT', 'SCHEDULED') then
      raise exception 'live raffle drafts may only be DRAFT or SCHEDULED' using errcode = '22023';
    end if;
  end if;

  if p_action = 'create_draft' then
    insert into public.raffles (
      slug, product_id, variant_id, title, summary, rules_summary, status,
      rules_version, opens_at, closes_at, is_published, published_at, is_test
    ) values (
      p_raffle->>'slug',
      nullif(p_raffle->>'product_id', '')::uuid,
      nullif(p_raffle->>'variant_id', '')::uuid,
      p_raffle->>'title',
      nullif(p_raffle->>'summary', ''),
      nullif(p_raffle->>'rules_summary', ''),
      v_status,
      p_raffle->>'rules_version',
      nullif(p_raffle->>'opens_at', '')::timestamptz,
      nullif(p_raffle->>'closes_at', '')::timestamptz,
      false,
      null,
      v_is_test
    )
    returning * into v_raffle;

  elsif p_action = 'update_draft' then
    if exists (
      select 1 from public.raffle_entries where raffle_id = p_target_id
    ) then
      raise exception 'raffle with entries cannot be edited through draft update'
        using errcode = '22023';
    end if;

    update public.raffles
    set slug = p_raffle->>'slug',
        product_id = nullif(p_raffle->>'product_id', '')::uuid,
        variant_id = nullif(p_raffle->>'variant_id', '')::uuid,
        title = p_raffle->>'title',
        summary = nullif(p_raffle->>'summary', ''),
        rules_summary = nullif(p_raffle->>'rules_summary', ''),
        status = v_status,
        rules_version = p_raffle->>'rules_version',
        opens_at = nullif(p_raffle->>'opens_at', '')::timestamptz,
        closes_at = nullif(p_raffle->>'closes_at', '')::timestamptz,
        is_test = v_is_test
    where id = p_target_id
      and status in ('DRAFT', 'SCHEDULED', 'OPEN', 'CLOSED')
    returning * into v_raffle;

    if not found then
      raise exception 'raffle draft not found' using errcode = 'P0002';
    end if;

  elsif p_action = 'publish' then
    update public.raffles
    set is_published = true,
        published_at = coalesce(published_at, statement_timestamp())
    where id = p_target_id
      and product_id is not null
      and opens_at is not null
      and closes_at is not null
      and closes_at > opens_at
      and status in ('SCHEDULED', 'OPEN')
    returning * into v_raffle;

    if not found then
      raise exception 'raffle is not publishable' using errcode = '22023';
    end if;

  else
    if exists (
      select 1 from public.raffle_entries where raffle_id = p_target_id
    ) then
      raise exception 'raffle with entries cannot be unpublished'
        using errcode = '22023';
    end if;

    update public.raffles
    set is_published = false,
        published_at = null
    where id = p_target_id
    returning * into v_raffle;

    if not found then
      raise exception 'raffle not found' using errcode = 'P0002';
    end if;
  end if;

  update private.commerce_admin_idempotency_receipts
  set result_json = to_jsonb(v_raffle)
  where client_id = p_client_id and operation_id = p_operation_id;

  return to_jsonb(v_raffle);
end;
$$;

revoke execute on function public.manage_raffle(uuid, text, text, uuid, text, jsonb)
  from public, anon, authenticated;
grant execute on function public.manage_raffle(uuid, text, text, uuid, text, jsonb)
  to service_role;
