-- E-006 proposal only. Do not apply without exact SQL review and live approval.
begin;
create function private.catalog_translation_content_valid(p_content jsonb) returns boolean
language plpgsql immutable security invoker set search_path = '' as $$
begin
  if p_content is null or jsonb_typeof(p_content) <> 'object' then return false; end if;
  return coalesce(p_content ?& array['title','description','story','seoTitle','seoDescription','primaryMediaAlt']
    and (p_content - array['title','description','story','seoTitle','seoDescription','primaryMediaAlt']) = '{}'::jsonb
    and not exists (select 1 from jsonb_each(p_content) e where jsonb_typeof(e.value) not in ('string','null'))
    and length(coalesce(p_content->>'title','')) <= 160
    and length(coalesce(p_content->>'description','')) <= 5000
    and length(coalesce(p_content->>'story','')) <= 8000
    and length(coalesce(p_content->>'seoTitle','')) <= 180
    and length(coalesce(p_content->>'seoDescription','')) <= 500
    and length(coalesce(p_content->>'primaryMediaAlt','')) <= 500, false);
end;
$$;
revoke all on function private.catalog_translation_content_valid(jsonb) from public,anon,authenticated;
grant execute on function private.catalog_translation_content_valid(jsonb) to service_role;

create unique index catalog_translation_variant_parent_idx on public.product_variants(product_id,id);
create table public.catalog_translation_drafts (
  product_id uuid not null references public.products(id) on delete restrict,
  variant_id uuid,
  entity_id uuid generated always as (coalesce(variant_id,product_id)) stored,
  locale text not null check(locale in ('en','vi')),
  revision integer not null check(revision > 0),
  content jsonb not null check(private.catalog_translation_content_valid(content)),
  ready boolean not null default false,
  updated_at timestamptz not null default statement_timestamp(),
  primary key(product_id,entity_id,locale),
  foreign key(product_id,variant_id) references public.product_variants(product_id,id) on delete restrict,
  check(variant_id is null or variant_id <> product_id),
  check(not ready or (length(trim(coalesce(content->>'title',''))) > 0 and length(trim(coalesce(content->>'description',''))) > 0))
);
create table public.catalog_translation_public (
  product_id uuid not null references public.products(id) on delete restrict,
  variant_id uuid,
  entity_id uuid generated always as (coalesce(variant_id,product_id)) stored,
  locale text not null check(locale in ('en','vi')),
  revision integer not null check(revision > 0),
  content jsonb not null check(private.catalog_translation_content_valid(content)),
  published_at timestamptz not null default statement_timestamp(),
  primary key(product_id,entity_id,locale),
  foreign key(product_id,variant_id) references public.product_variants(product_id,id) on delete restrict,
  check(variant_id is null or variant_id <> product_id),
  check(length(trim(coalesce(content->>'title',''))) > 0 and length(trim(coalesce(content->>'description',''))) > 0)
);
create table private.catalog_translation_receipts (
  client_id text not null check(length(client_id) between 1 and 128 and client_id ~ '^[A-Za-z0-9._:-]+$'),
  operation_id uuid not null,
  request_fingerprint text not null check(request_fingerprint ~ '^[0-9a-f]{64}$'),
  request_json jsonb not null,
  result_json jsonb,
  created_at timestamptz not null default statement_timestamp(),
  primary key(client_id,operation_id)
);
alter table public.catalog_translation_drafts enable row level security;
alter table public.catalog_translation_public enable row level security;
alter table private.catalog_translation_receipts enable row level security;
revoke all on public.catalog_translation_drafts,public.catalog_translation_public,private.catalog_translation_receipts from public,anon,authenticated;
grant all on public.catalog_translation_drafts,public.catalog_translation_public,private.catalog_translation_receipts to service_role;
grant select(product_id,variant_id,locale,content) on public.catalog_translation_public to anon,authenticated;
create policy "approved translations for public catalog" on public.catalog_translation_public for select to anon,authenticated
using (exists(select 1 from public.products p where p.id=catalog_translation_public.product_id and p.status='published')
  and (variant_id is null or exists(select 1 from public.product_variants v where v.id=catalog_translation_public.variant_id and v.product_id=catalog_translation_public.product_id and v.is_active)));

create function public.read_catalog_translation_draft(p_product_id uuid,p_variant_id uuid,p_locale text)
returns jsonb language plpgsql security invoker set search_path = '' as $$
declare v_row public.catalog_translation_drafts%rowtype;
begin
  if p_product_id is null or p_locale is null or p_locale not in ('en','vi') then raise exception 'invalid target' using errcode='22023'; end if;
  if not exists(select 1 from public.products where id=p_product_id)
    or (p_variant_id is not null and not exists(select 1 from public.product_variants where id=p_variant_id and product_id=p_product_id)) then
    raise exception 'target missing' using errcode='P0002';
  end if;
  select * into v_row from public.catalog_translation_drafts where product_id=p_product_id and entity_id=coalesce(p_variant_id,p_product_id) and locale=p_locale;
  if not found then return null; end if;
  return jsonb_build_object('productId',v_row.product_id,'variantId',v_row.variant_id,'locale',v_row.locale,
    'revision',v_row.revision,'content',v_row.content,'ready',v_row.ready,'updatedAt',v_row.updated_at);
end; $$;

create function public.save_catalog_translation_draft(p_product_id uuid,p_variant_id uuid,p_locale text,
  p_operation_id uuid,p_client_id text,p_request_fingerprint text,p_expected_revision integer,p_content jsonb,p_ready boolean)
returns jsonb language plpgsql security invoker set search_path = ''
set statement_timeout='5s' set lock_timeout='2s' as $$
declare
  v_status text; v_claimed boolean:=false; v_revision integer;
  v_request jsonb; v_receipt private.catalog_translation_receipts%rowtype;
  v_row public.catalog_translation_drafts%rowtype; v_result jsonb;
begin
  if p_product_id is null or p_locale is null or p_locale not in ('en','vi') or p_ready is null
    or p_operation_id is null or p_expected_revision is null or p_expected_revision < 0 or p_expected_revision > 2147483646
    or not private.catalog_translation_content_valid(p_content)
    or (p_ready and (length(trim(coalesce(p_content->>'title',''))) = 0 or length(trim(coalesce(p_content->>'description',''))) = 0)) then
    raise exception 'invalid translation' using errcode='22023';
  end if;
  v_request:=jsonb_build_object('productId',p_product_id,'variantId',p_variant_id,'locale',p_locale,
    'revision',p_expected_revision,'content',p_content,'ready',p_ready);
  -- Claim receipt first. Same operation can never write twice, including after a later edit.
  insert into private.catalog_translation_receipts(client_id,operation_id,request_fingerprint,request_json)
    values(p_client_id,p_operation_id,p_request_fingerprint,v_request)
    on conflict(client_id,operation_id) do nothing returning true into v_claimed;
  if not coalesce(v_claimed,false) then
    select * into v_receipt from private.catalog_translation_receipts where client_id=p_client_id and operation_id=p_operation_id;
    if not found or v_receipt.request_fingerprint <> p_request_fingerprint or v_receipt.request_json <> v_request then
      raise exception 'operation reused' using errcode='22023'; end if;
    if v_receipt.result_json is null then raise exception 'operation pending' using errcode='55P03'; end if;
    return v_receipt.result_json;
  end if;
  -- Parent locking also serializes against catalog state changes. No base Product update.
  select status into v_status from public.products where id=p_product_id for update;
  if not found then raise exception 'product missing' using errcode='P0002'; end if;
  if v_status='archived' then raise exception 'archived parent' using errcode='22023'; end if;
  if p_variant_id is not null then
    perform 1 from public.product_variants where id=p_variant_id and product_id=p_product_id for update;
    if not found then raise exception 'variant missing' using errcode='P0002'; end if;
  end if;
  select revision into v_revision from public.catalog_translation_drafts
    where product_id=p_product_id and entity_id=coalesce(p_variant_id,p_product_id) and locale=p_locale for update;
  if coalesce(v_revision,0) <> p_expected_revision then raise exception 'stale translation' using errcode='40001'; end if;
  insert into public.catalog_translation_drafts(product_id,variant_id,locale,revision,content,ready)
    values(p_product_id,p_variant_id,p_locale,p_expected_revision+1,p_content,p_ready)
    on conflict(product_id,entity_id,locale) do update set revision=excluded.revision,content=excluded.content,ready=excluded.ready,updated_at=statement_timestamp()
    returning * into v_row;
  v_result:=jsonb_build_object('productId',v_row.product_id,'variantId',v_row.variant_id,'locale',v_row.locale,
    'revision',v_row.revision,'content',v_row.content,'ready',v_row.ready,'updatedAt',v_row.updated_at);
  update private.catalog_translation_receipts set result_json=v_result where client_id=p_client_id and operation_id=p_operation_id;
  return v_result;
end; $$;
revoke execute on function public.read_catalog_translation_draft(uuid,uuid,text),public.save_catalog_translation_draft(uuid,uuid,text,uuid,text,text,integer,jsonb,boolean) from public,anon,authenticated;
grant execute on function public.read_catalog_translation_draft(uuid,uuid,text),public.save_catalog_translation_draft(uuid,uuid,text,uuid,text,text,integer,jsonb,boolean) to service_role;
commit;
