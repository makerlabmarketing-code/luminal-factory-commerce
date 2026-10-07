-- DRAFT ONLY: production approval required. No rows changed by installation.
begin;
create or replace function public.manage_catalog_product(
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
      and exists (select 1 from public.products where id = p_target_id and status = 'draft')
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
    where id = p_target_id and (
      status = 'draft'
      or (status in ('published', 'archived')
        and slug = p_product->>'slug'
        and product_type = p_product->>'product_type'
        and release_type = p_product->>'release_type')
    )
    returning * into v_product;

    if not found then
      raise exception 'product missing or protected fields changed' using errcode = 'P0002';
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


commit;
