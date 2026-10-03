-- Read-only checks before placing forward.sql in a CLI-generated migration.
select product_id, attributes->>'colorway_slug' as slug, count(*)
from public.product_variants where attributes ? 'colorway_slug'
group by product_id, attributes->>'colorway_slug' having count(*) > 1;
select conname, pg_get_constraintdef(oid)
from pg_constraint where conrelid='private.commerce_admin_idempotency_receipts'::regclass;
select indexname from pg_indexes where schemaname='public' and tablename='product_variants';
select has_table_privilege('anon','public.product_variants','INSERT') as anon_insert,
  has_table_privilege('authenticated','public.product_variants','UPDATE') as authenticated_update;
