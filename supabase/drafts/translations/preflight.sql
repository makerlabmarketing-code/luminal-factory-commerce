-- Read-only: report actual Production compatibility before any reviewed rollout.
select to_regclass('public.products') products,to_regclass('public.product_variants') variants,
  to_regclass('public.catalog_translation_drafts') drafts,to_regclass('public.catalog_translation_public') snapshots,
  to_regclass('private.catalog_translation_receipts') receipts;
select id,product_id,count(*) from public.product_variants group by id,product_id having count(*) > 1;
select c.relname,c.relrowsecurity from pg_class c join pg_namespace n on n.oid=c.relnamespace
where n.nspname='public' and c.relname in ('products','product_variants');
select polname,pg_get_expr(polqual,polrelid) using_expression from pg_policy
where polrelid in ('public.products'::regclass,'public.product_variants'::regclass);
