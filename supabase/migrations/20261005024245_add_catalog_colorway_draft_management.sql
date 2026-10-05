-- Draft package: not in migrations and not approved for live execution.
-- No backfill, no public read/write grant changes, no live activation.
begin;
create unique index product_variants_colorway_slug_uidx
  on public.product_variants(product_id, (attributes->>'colorway_slug'))
  where attributes ? 'colorway_slug';
alter table private.commerce_admin_idempotency_receipts
  drop constraint commerce_admin_idempotency_operation_check;
alter table private.commerce_admin_idempotency_receipts
  add constraint commerce_admin_idempotency_operation_check check (operation in (
    'create_draft','update_draft','publish','unpublish',
    'product_create_draft','product_update_draft','product_publish','product_archive',
    'raffle_create_draft','raffle_update_draft','raffle_publish','raffle_unpublish',
    'raffle_winner_select','raffle_winner_confirm','raffle_winner_confirm_payment',
    'raffle_winner_start_fulfillment','raffle_winner_complete','raffle_winner_cancel',
    'raffle_winner_reallocate','raffle_result_publish',
    'colorway_create_draft','colorway_update_draft'
  ));
create function public.manage_catalog_colorway(
  p_operation_id uuid, p_client_id text, p_action text, p_product_id uuid,
  p_target_id uuid, p_request_fingerprint text, p_colorway jsonb
) returns jsonb language plpgsql security invoker set search_path = ''
set statement_timeout = '5s' set lock_timeout = '2s' as $$
declare
  v_operation text := 'colorway_' || p_action;
  v_claimed boolean := false;
  v_existing private.commerce_admin_idempotency_receipts%rowtype;
  v_product public.products%rowtype;
  v_variant public.product_variants%rowtype;
  v_result jsonb;
begin
  if p_action is null or p_action not in ('create_draft','update_draft') or p_operation_id is null
    or p_product_id is null or coalesce(p_client_id,'') = ''
    or coalesce(p_request_fingerprint,'') = '' or p_colorway is null
    or jsonb_typeof(p_colorway) <> 'object'
    or (p_colorway - array['name','slug','description']) <> '{}'::jsonb
    or jsonb_typeof(p_colorway->'name') is distinct from 'string'
    or jsonb_typeof(p_colorway->'slug') is distinct from 'string'
    or length(trim(p_colorway->>'name')) not between 1 and 160
    or length(p_colorway->>'slug') not between 1 and 120
    or p_colorway->>'slug' !~ '^[a-z0-9]+(-[a-z0-9]+)*$'
    or (p_colorway ? 'description' and jsonb_typeof(p_colorway->'description') not in ('string','null'))
    or length(coalesce(p_colorway->>'description','')) > 5000 then
    raise exception 'invalid colorway payload' using errcode = '22023';
  end if;
  insert into private.commerce_admin_idempotency_receipts(client_id,operation_id,operation,request_fingerprint)
    values(p_client_id,p_operation_id,v_operation,p_request_fingerprint)
    on conflict(client_id,operation_id) do nothing returning true into v_claimed;
  if not coalesce(v_claimed,false) then
    select * into v_existing from private.commerce_admin_idempotency_receipts
      where client_id=p_client_id and operation_id=p_operation_id;
    if not found or v_existing.operation <> v_operation or v_existing.request_fingerprint <> p_request_fingerprint then
      raise exception 'operation already used' using errcode='22023';
    end if;
    if v_existing.result_json is null then raise exception 'operation in progress' using errcode='55P03'; end if;
    return v_existing.result_json;
  end if;
  select * into v_product from public.products where id=p_product_id for update;
  if not found then raise exception 'product missing' using errcode='P0002'; end if;
  if v_product.status <> 'draft' then raise exception 'product is not draft' using errcode='22023'; end if;
  if p_action='create_draft' then
    insert into public.product_variants(product_id,name,attributes,is_active)
      values(p_product_id,trim(p_colorway->>'name'),jsonb_build_object(
        'colorway_slug',p_colorway->>'slug','colorway_description',p_colorway->>'description'),false)
      returning * into v_variant;
  else
    update public.product_variants set name=trim(p_colorway->>'name'),
      attributes=attributes || jsonb_build_object('colorway_slug',p_colorway->>'slug','colorway_description',p_colorway->>'description')
      where id=p_target_id and product_id=p_product_id and not is_active
        and jsonb_typeof(attributes)='object'
      returning * into v_variant;
    if not found then raise exception 'inactive colorway missing' using errcode='P0002'; end if;
  end if;
  v_result := jsonb_build_object('id',v_variant.id,'product_id',v_variant.product_id,
    'name',v_variant.name,'slug',v_variant.attributes->>'colorway_slug',
    'description',v_variant.attributes->>'colorway_description','is_active',v_variant.is_active,
    'created_at',v_variant.created_at,'updated_at',v_variant.updated_at);
  update private.commerce_admin_idempotency_receipts set result_json=v_result
    where client_id=p_client_id and operation_id=p_operation_id;
  return v_result;
end;
$$;
revoke execute on function public.manage_catalog_colorway(uuid,text,text,uuid,uuid,text,jsonb) from public,anon,authenticated;
grant execute on function public.manage_catalog_colorway(uuid,text,text,uuid,uuid,text,jsonb) to service_role;
commit;
