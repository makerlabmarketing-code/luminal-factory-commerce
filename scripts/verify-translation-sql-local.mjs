// Isolated WASM PostgreSQL. Never accepts a database URL or network connection.
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { pathToFileURL } from 'node:url';
if (!process.env.PGLITE_MODULE) throw new Error('Set PGLITE_MODULE to a local PGlite dist/index.js.');
const { PGlite } = await import(pathToFileURL(resolve(process.env.PGLITE_MODULE)).href);
const db = new PGlite();
const core = readFileSync('supabase/migrations/20260810045019_create_commerce_core.sql', 'utf8');
const root = 'supabase/drafts/translations';
const read = name => readFileSync(`${root}/${name}.sql`, 'utf8');
const product = '550e8400-e29b-41d4-a716-446655440000';
const second = '550e8400-e29b-41d4-a716-446655440010';
const variant = '550e8400-e29b-41d4-a716-446655440020';
const blank = { title: null, description: null, story: null, seoTitle: null, seoDescription: null, primaryMediaAlt: null };
const content = { ...blank, title: 'Meowhe', description: 'Bản dịch đã kiểm tra' };
let seq = 0;
const operation = () => `550e8400-e29b-41d4-a716-${String(++seq).padStart(12, '0')}`;
const save = (revision, body = content, ready = true, op = operation(), variantId = null, parent = product, locale = 'vi') =>
  db.query('select public.save_catalog_translation_draft($1,$2,$3,$4,$5,$6,$7,$8,$9) result', [parent, variantId, locale, op, 'local-test', '8'.repeat(64), revision, JSON.stringify(body), ready]).then(result => result.rows[0].result);
const readDraft = (locale = 'vi') => db.query('select public.read_catalog_translation_draft($1,null,$2) result', [product, locale]).then(result => result.rows[0].result);
const expectCode = (promise, code) => assert.rejects(promise, error => error.code === code);
try {
  await db.exec(`create role anon; create role authenticated; create role service_role bypassrls;
    create schema private; grant usage on schema public,private to service_role;
    ${core.slice(core.indexOf('create or replace function public.commerce_set_updated_at'), core.indexOf('create table public.product_media'))}
    alter table public.products enable row level security; alter table public.product_variants enable row level security;
    grant select on public.products,public.product_variants to anon,authenticated;
    grant all on public.products,public.product_variants to service_role;
    ${core.slice(core.indexOf('create policy "published products are public"'), core.indexOf('create policy "media for published products is public"'))}`);
  await db.exec(read('preflight')); await db.exec(read('forward')); await db.exec(read('validation'));
  await db.query(`insert into public.products(id,slug,name,product_type,release_type,status,published_at)
    values($1,'local-source','Source unchanged','artisan_keycap','informational','published',now()),
    ($2,'local-draft','Second source','artisan_keycap','informational','draft',null)`, [product, second]);
  await db.query("insert into public.product_variants(id,product_id,name,is_active) values($1,$2,'Local variant',false)", [variant, product]);
  await db.exec('set role service_role');
  assert.equal(await readDraft(), null);
  const op = operation(); const created = await save(0, content, true, op);
  assert.equal(created.revision, 1); assert.equal(created.productId, product); assert.equal(created.variantId, null);
  assert.deepEqual(await save(0, content, true, op), created);
  await expectCode(save(0), '40001');
  await expectCode(save(0, { ...content, title: 'Changed' }, true, op), '22023');
  assert.equal((await save(1, blank, false)).revision, 2);
  assert.deepEqual(await save(0, content, true, op), created); // immutable replay after later edits
  assert.equal((await readDraft()).revision, 2);
  assert.equal((await save(0, content, true, operation(), null, product, 'en')).revision, 1);
  assert.equal((await save(0, content, true, operation(), variant)).variantId, variant);
  await expectCode(save(0, content, true, operation(), variant, second), 'P0002');
  await expectCode(save(2, blank), '22023');
  await expectCode(save(2, { ...content, inventory: 5 }), '22023');
  await expectCode(save(2, { ...content, seoTitle: 'x'.repeat(181) }), '22023');
  await expectCode(save(2, []), '22023');
  assert.equal((await db.query('select name from public.products where id=$1', [product])).rows[0].name, 'Source unchanged');
  // Local reviewed-snapshot fixtures only: no runtime publish operation exists in the application.
  await db.query(`insert into public.catalog_translation_public(product_id,variant_id,locale,revision,content)
    values($1,null,'vi',1,$3),($2,null,'vi',1,$3),($1,$4,'vi',1,$3)`, [product, second, JSON.stringify(content), variant]);
  await db.exec('reset role');
  for (const role of ['anon', 'authenticated']) {
    await db.exec(`set role ${role}`);
    await expectCode(save(2), '42501'); await expectCode(readDraft(), '42501');
    await expectCode(db.query('select content from public.catalog_translation_drafts'), '42501');
    await expectCode(db.query('select revision from public.catalog_translation_public'), '42501');
    await expectCode(db.query('select request_json from private.catalog_translation_receipts'), '42501');
    assert.equal((await db.query('select product_id,variant_id,locale,content from public.catalog_translation_public')).rows.length, 1);
    await expectCode(db.query('delete from public.catalog_translation_public'), '42501');
    await db.exec('reset role');
  }
  await db.query('update public.product_variants set is_active=true where id=$1', [variant]);
  await db.exec('set role anon');
  assert.equal((await db.query('select product_id,variant_id,locale,content from public.catalog_translation_public')).rows.length, 2);
  await db.exec('reset role');
  await db.query("update public.products set status='archived' where id=$1", [product]);
  await db.exec('set role service_role'); await expectCode(save(2), '22023'); await db.exec('reset role');
  await db.exec('set role anon');
  assert.equal((await db.query('select product_id,variant_id,locale,content from public.catalog_translation_public')).rows.length, 0);
  await db.exec('reset role');
  const count = (await db.query('select count(*)::int n from public.catalog_translation_drafts')).rows[0].n;
  await db.exec(read('rollback'));
  assert.equal((await db.query('select count(*)::int n from public.catalog_translation_drafts')).rows[0].n, count);
  assert.equal((await db.query('select count(*)::int n from private.catalog_translation_receipts')).rows[0].n, 4);
  await db.exec('set role service_role'); await expectCode(readDraft(), '42501'); await db.exec('reset role');
  await db.exec('set role anon'); await expectCode(db.query('select content from public.catalog_translation_public'), '42501');
  console.log('PASS: draft/read/replay/stale/conflict/readiness/entity FK/locale isolation/source preservation/public RLS/denied grants/data-preserving rollback.');
  console.log('Single-connection local PostgreSQL fixture. Native two-session concurrency and hosted preflight remain required.');
} finally { await db.close(); }
