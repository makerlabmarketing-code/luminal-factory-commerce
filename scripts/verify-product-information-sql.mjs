// Disposable embedded PostgreSQL only. Install PGlite 0.5.8 outside the repo;
// run with NODE_PATH pointing at that installation. No production connection.
import assert from 'node:assert/strict';
import { createRequire } from 'node:module';
import { readFileSync } from 'node:fs';
assert.equal(process.env.PRODUCT_SQL_TEST, 'DISPOSABLE_LOCAL_DATABASE');
const { PGlite } = createRequire(import.meta.url)('@electric-sql/pglite');
const db = new PGlite();
const read = path => readFileSync(path, 'utf8');
const core = read('supabase/migrations/20260810045019_create_commerce_core.sql');
const receipts = read('supabase/migrations/20260912150000_add_commerce_admin_hero_idempotency.sql');
const management = read('supabase/migrations/20260922093000_add_product_raffle_admin_rpcs.sql');
const root = 'supabase/drafts/product-information-update';
try {
  await db.exec(`create role anon; create role authenticated; create role service_role bypassrls;
    create schema private; grant usage on schema public,private to service_role;
    ${core.slice(core.indexOf('create or replace function public.commerce_set_updated_at'), core.indexOf('create table public.product_variants'))}
    alter table public.products enable row level security;
    grant select on public.products to anon,authenticated;
    grant all on public.products to service_role;
    ${receipts.slice(receipts.indexOf('create table private.commerce_admin_idempotency_receipts'), receipts.indexOf('create function public.manage_homepage_hero'))}
    ${management.slice(management.indexOf('alter table private.commerce_admin_idempotency_receipts'), management.indexOf('create function public.manage_raffle'))}`);
  await db.exec(read(`${root}/forward.sql`));
  await db.exec(read(`${root}/validation.sql`));
  assert.equal((await db.query('select count(*)::int as count from public.products')).rows[0].count, 0);
  assert.equal((await db.query('select count(*)::int as count from private.commerce_admin_idempotency_receipts')).rows[0].count, 0);
  await db.exec(read(`${root}/rollback.sql`));
  await db.exec(`begin; set local role service_role;
    do $$ declare p uuid:=gen_random_uuid(); rejected boolean:=false;
    begin
      insert into public.products(id,slug,name,product_type,release_type,status,published_at)
      values(p,'rollback-fixture','Fixture','artisan_keycap','informational','published',now());
      begin perform public.manage_catalog_product(gen_random_uuid(),'rollback-test','update_draft',p,repeat('a',64),
        '{"slug":"rollback-fixture","name":"Changed","product_type":"artisan_keycap","release_type":"informational"}'::jsonb);
      exception when sqlstate 'P0002' then rejected:=true; end;
      if not rejected then raise exception 'rollback failed to restore draft-only writes'; end if;
    end; $$; rollback;`);
  console.log('PASS: draft/published/archived information, state preservation, protected fields, receipt replay, denied public execution, rolled-back fixtures and rollback.');
} finally { await db.close(); }
