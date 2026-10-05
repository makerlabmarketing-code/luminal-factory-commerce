-- REVIEW PACKAGE ONLY. New private draft storage; no existing public media changes/backfill.
begin;
create table public.catalog_media_drafts (
  product_id uuid not null references public.products(id) on delete restrict,
  variant_id uuid,
  target_key text generated always as (product_id::text || ':' || coalesce(variant_id::text,'product')) stored primary key,
  revision integer not null default 0 check (revision >= 0),
  assets jsonb not null default '[]' check (jsonb_typeof(assets)='array' and jsonb_array_length(assets)<=120),
  primary_id uuid,
  updated_at timestamptz not null default now(),
  foreign key(product_id,variant_id) references public.product_variants(product_id,id) on delete restrict
);
create table private.catalog_media_receipts (
  client_id text not null, operation_id uuid not null,
  request_json jsonb not null, request_fingerprint text not null,
  result jsonb not null, created_at timestamptz not null default now(),
  primary key(client_id,operation_id)
);
alter table public.catalog_media_drafts enable row level security;
alter table private.catalog_media_receipts enable row level security;
revoke all on public.catalog_media_drafts,private.catalog_media_receipts from public,anon,authenticated;
grant select,insert,update on public.catalog_media_drafts to service_role;
grant select,insert on private.catalog_media_receipts to service_role;
insert into storage.buckets(id,name,public,file_size_limit,allowed_mime_types)
values ('catalog-media-drafts','catalog-media-drafts',false,2097152,array['image/webp']);

create function public.read_catalog_media_draft(p_product_id uuid,p_variant_id uuid)
returns jsonb language plpgsql security invoker set search_path='' as $$
declare r public.catalog_media_drafts;
begin
  if not exists(select 1 from public.products where id=p_product_id) or
    (p_variant_id is not null and not exists(select 1 from public.product_variants where id=p_variant_id and product_id=p_product_id))
    then raise exception 'Target missing' using errcode='P0002'; end if;
  select * into r from public.catalog_media_drafts where product_id=p_product_id and variant_id is not distinct from p_variant_id;
  return jsonb_build_object('productId',p_product_id,'variantId',p_variant_id,'revision',coalesce(r.revision,0),
    'assets',coalesce(r.assets,'[]'),'primaryId',r.primary_id);
end $$;

create function public.save_catalog_media_draft(p_product_id uuid,p_variant_id uuid,p_action text,p_operation_id uuid,
  p_client_id text,p_request_fingerprint text,p_expected_revision integer,p_payload jsonb)
returns jsonb language plpgsql security invoker set search_path='' as $$
declare
  r public.catalog_media_drafts; receipt private.catalog_media_receipts;
  request_json jsonb; output jsonb; next_assets jsonb; next_primary uuid;
  a jsonb; prior jsonb; st text; active boolean;
begin
  if p_operation_id is null or p_client_id is null or length(p_client_id) not between 1 and 100 or
    p_request_fingerprint is null or p_request_fingerprint !~ '^[0-9a-f]{64}$' or
    p_action is null or p_action not in ('append','update') or p_expected_revision is null or p_expected_revision not between 0 and 2147483646
    then raise exception 'Invalid request' using errcode='22023'; end if;
  -- Serialize receipt identity across targets as well as collection writes; immutable retry results.
  perform pg_catalog.pg_advisory_xact_lock(pg_catalog.hashtextextended(p_client_id||':'||p_operation_id::text,0));
  select status into st from public.products where id=p_product_id for update;
  if not found then raise exception 'Target missing' using errcode='P0002'; end if;
  if st <> 'draft' then raise exception 'Not a draft' using errcode='22023'; end if;
  if p_variant_id is not null then
    select is_active into active from public.product_variants where id=p_variant_id and product_id=p_product_id for update;
    if not found then raise exception 'Variant missing' using errcode='P0002'; end if;
    if active then raise exception 'Variant active' using errcode='22023'; end if;
  end if;
  request_json:=jsonb_build_object('productId',p_product_id,'variantId',p_variant_id,'action',p_action,'revision',p_expected_revision,'payload',p_payload);
  select * into receipt from private.catalog_media_receipts where client_id=p_client_id and operation_id=p_operation_id;
  if found then
    if receipt.request_json<>request_json then raise exception 'Operation reused' using errcode='22023'; end if;
    return receipt.result;
  end if;
  insert into public.catalog_media_drafts(product_id,variant_id) values(p_product_id,p_variant_id) on conflict do nothing;
  select * into strict r from public.catalog_media_drafts where product_id=p_product_id and variant_id is not distinct from p_variant_id for update;
  if r.revision<>p_expected_revision then raise exception 'Stale revision' using errcode='40001'; end if;
  if jsonb_typeof(p_payload) is distinct from 'object' then raise exception 'Invalid payload' using errcode='22023'; end if;
  if p_action='append' then
    if (select count(*) from jsonb_object_keys(p_payload))<>1 or not(p_payload?'asset') then raise exception 'Invalid append' using errcode='22023'; end if;
    a:=p_payload->'asset';
    if jsonb_typeof(a) is distinct from 'object' or (select count(*) from jsonb_object_keys(a))<>8 or
      not(a ?& array['id','path','fileName','sizeBytes','width','height','alt','removed']) then raise exception 'Invalid asset' using errcode='22023'; end if;
    if jsonb_typeof(a->'id') is distinct from 'string' or (a->>'id') !~ '^[0-9a-f-]{36}$' or
      jsonb_typeof(a->'path') is distinct from 'string' or (a->>'path')<>(p_product_id::text||'/'||coalesce(p_variant_id::text,'product')||'/'||(a->>'id')||'.webp') or
      jsonb_typeof(a->'fileName') is distinct from 'string' or length(a->>'fileName') not between 1 and 180 or (a->>'fileName') ~ '[/\\]' or
      jsonb_typeof(a->'alt') is distinct from 'string' or length(a->>'alt')>500 or
      a->'removed' is distinct from 'false'::jsonb or
      jsonb_typeof(a->'sizeBytes') is distinct from 'number' or (a->>'sizeBytes') !~ '^[0-9]+$' or (a->>'sizeBytes')::numeric not between 1 and 2097152 or
      jsonb_typeof(a->'width') is distinct from 'number' or (a->>'width') !~ '^[0-9]+$' or (a->>'width')::numeric not between 1 and 2048 or
      jsonb_typeof(a->'height') is distinct from 'number' or (a->>'height') !~ '^[0-9]+$' or (a->>'height')::numeric not between 1 and 2048
      then raise exception 'Invalid asset fields' using errcode='22023'; end if;
    perform (a->>'id')::uuid;
    if exists(select 1 from jsonb_array_elements(r.assets) x where x->>'id'=a->>'id') then raise exception 'Duplicate asset' using errcode='22023'; end if;
    next_assets:=r.assets||jsonb_build_array(a); next_primary:=coalesce(r.primary_id,(a->>'id')::uuid);
  else
    if (select count(*) from jsonb_object_keys(p_payload))<>2 or not(p_payload ?& array['assets','primaryId']) or
      jsonb_typeof(p_payload->'assets') is distinct from 'array' then raise exception 'Invalid update' using errcode='22023'; end if;
    if jsonb_array_length(p_payload->'assets')<>jsonb_array_length(r.assets) then raise exception 'Cannot discard assets' using errcode='22023'; end if;
    next_assets:='[]';
    for a in select * from jsonb_array_elements(p_payload->'assets') loop
      if jsonb_typeof(a) is distinct from 'object' or (select count(*) from jsonb_object_keys(a))<>3 or not(a ?& array['id','alt','removed']) or
        jsonb_typeof(a->'id') is distinct from 'string' or jsonb_typeof(a->'alt') is distinct from 'string' or length(a->>'alt')>500 or
        jsonb_typeof(a->'removed') is distinct from 'boolean' then raise exception 'Invalid update fields' using errcode='22023'; end if;
      select x into prior from jsonb_array_elements(r.assets) x where x->>'id'=a->>'id';
      if not found or exists(select 1 from jsonb_array_elements(next_assets) x where x->>'id'=a->>'id') then raise exception 'Unknown/duplicate asset' using errcode='22023'; end if;
      next_assets:=next_assets||jsonb_build_array(prior||jsonb_build_object('alt',a->>'alt','removed',a->'removed'));
    end loop;
    if jsonb_typeof(p_payload->'primaryId') not in ('string','null') then raise exception 'Invalid cover' using errcode='22023'; end if;
    next_primary:=nullif(p_payload->>'primaryId','')::uuid;
  end if;
  if jsonb_array_length(next_assets)>120 or (select count(*) from jsonb_array_elements(next_assets) x where x->'removed'='false')>20 then raise exception 'Too many images' using errcode='22023'; end if;
  if (exists(select 1 from jsonb_array_elements(next_assets) x where x->'removed'='false') and
    not exists(select 1 from jsonb_array_elements(next_assets) x where (x->>'id')::uuid=next_primary and x->'removed'='false')) or
    (not exists(select 1 from jsonb_array_elements(next_assets) x where x->'removed'='false') and next_primary is not null)
    then raise exception 'Invalid cover' using errcode='22023'; end if;
  update public.catalog_media_drafts set assets=next_assets,primary_id=next_primary,revision=r.revision+1,updated_at=now() where target_key=r.target_key;
  output:=public.read_catalog_media_draft(p_product_id,p_variant_id);
  insert into private.catalog_media_receipts(client_id,operation_id,request_json,request_fingerprint,result) values(p_client_id,p_operation_id,request_json,p_request_fingerprint,output);
  return output;
end $$;
revoke all on function public.read_catalog_media_draft(uuid,uuid) from public,anon,authenticated;
revoke all on function public.save_catalog_media_draft(uuid,uuid,text,uuid,text,text,integer,jsonb) from public,anon,authenticated;
grant execute on function public.read_catalog_media_draft(uuid,uuid), public.save_catalog_media_draft(uuid,uuid,text,uuid,text,text,integer,jsonb) to service_role;
commit;
