// Isolated WASM PostgreSQL only. Never accepts a database URL or network client.
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { pathToFileURL } from 'node:url';

if (!process.env.PGLITE_MODULE) throw new Error('Set PGLITE_MODULE to a local @electric-sql/pglite dist/index.js.');
const { PGlite } = await import(pathToFileURL(resolve(process.env.PGLITE_MODULE)).href);
const db = new PGlite();
const read = path => readFileSync(path, 'utf8');
const core = read('supabase/migrations/20260810045019_create_commerce_core.sql');
const receipts = read('supabase/migrations/20260912150000_add_commerce_admin_hero_idempotency.sql');
const root = 'supabase/drafts/colorway-management';
try {
  await db.exec(`create role anon; create role authenticated; create role service_role bypassrls;
    create schema private; grant usage on schema public,private to service_role;
    ${core.slice(core.indexOf('create or replace function public.commerce_set_updated_at'), core.indexOf('create table public.product_media'))}
    ${core.slice(core.indexOf('create trigger products_set_updated_at'), core.indexOf('create trigger customers_set_updated_at'))}
    alter table public.products enable row level security;
    alter table public.product_variants enable row level security;
    grant select on public.products,public.product_variants to anon,authenticated;
    grant all on public.products,public.product_variants to service_role;
    ${core.slice(core.indexOf('create policy "published products are public"'), core.indexOf('create policy "media for published products is public"'))}
    ${receipts.slice(receipts.indexOf('create table private.commerce_admin_idempotency_receipts'), receipts.indexOf('create function public.manage_homepage_hero'))}`);
  await db.exec(read(`${root}/forward.sql`));
  await db.exec(read(`${root}/validation.sql`));
  assert.equal((await db.query('select count(*)::int n from public.products')).rows[0].n, 0);
  // Invoker execution uses the real table grants/RLS, rather than superuser bypass.
  await db.exec(`set role service_role;
    insert into public.products(id,slug,name,product_type,release_type)
      values('550e8400-e29b-41d4-a716-446655440000','local-cw','Local fixture','artisan_keycap','informational');
    select public.manage_catalog_colorway('550e8400-e29b-41d4-a716-446655440001','fixture','create_draft',
      '550e8400-e29b-41d4-a716-446655440000','00000000-0000-0000-0000-000000000000',repeat('8',64),
      '{"name":"Mono","slug":"mono"}'); reset role;`);
  await db.exec("update public.products set status='published',published_at=now() where slug='local-cw'");
  for (const role of ['anon', 'authenticated']) {
    await db.exec(`set role ${role}`);
    await assert.rejects(db.query(`select public.manage_catalog_colorway(gen_random_uuid(),'fixture','create_draft',
      '550e8400-e29b-41d4-a716-446655440000','00000000-0000-0000-0000-000000000000',repeat('9',64),
      '{"name":"Denied","slug":"denied"}')`), error => error.code === '42501');
    assert.equal((await db.query('select count(*)::int n from public.product_variants')).rows[0].n, 0);
    await db.exec('reset role');
  }
  await db.exec(read(`${root}/rollback.sql`));
  assert.equal((await db.query('select count(*)::int n from public.product_variants')).rows[0].n, 1);
  assert.equal((await db.query('select count(*)::int n from private.commerce_admin_idempotency_receipts')).rows[0].n, 1);
  assert.equal((await db.query("select to_regprocedure('public.manage_catalog_colorway(uuid,text,text,uuid,uuid,text,jsonb)') fn")).rows[0].fn, null);
  console.log('PASS: SQL create/edit/replay/conflict/duplicate/parent/state/metadata/role denial/fixture rollback/data-preserving rollback.');
  console.log('Single-connection PostgreSQL slice fixture; concurrency and hosted Supabase preflight remain separate.');
} finally { await db.close(); }
