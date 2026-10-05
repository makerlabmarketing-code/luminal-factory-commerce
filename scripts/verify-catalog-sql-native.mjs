// Only the disposable PostgreSQL 17 CI database. No application credentials/URLs.
import assert from 'node:assert/strict';
import { spawn } from 'node:child_process';
import { readFileSync } from 'node:fs';
import { setTimeout as delay } from 'node:timers/promises';

const suite = process.argv[2];
assert.ok(['colorways', 'translations'].includes(suite), 'Choose colorways or translations.');
assert.equal(process.env.CATALOG_SQL_TEST, 'DISPOSABLE_LOCAL_DATABASE');
const port = process.env.CATALOG_SQL_TEST_PORT ?? '5432';
assert.match(port, /^\d{1,5}$/);
const env = { PATH: process.env.PATH, PGHOST: '127.0.0.1', PGPORT: port,
  PGDATABASE: 'luminal_sql_test', PGUSER: 'postgres', PGPASSWORD: 'luminal-local-fixture', PGCONNECT_TIMEOUT: '5' };
const read = path => readFileSync(path, 'utf8');
function session(name) {
  const child = spawn('psql', ['-X', '-q', '-A', '-t', '-v', 'ON_ERROR_STOP=1', '-v', 'VERBOSITY=verbose'],
    { env: { ...env, PGAPPNAME: name }, stdio: ['pipe', 'pipe', 'pipe'] });
  let stdout = '', stderr = '';
  child.stdout.on('data', chunk => { stdout += chunk; });
  child.stderr.on('data', chunk => { stderr += chunk; });
  const done = new Promise((resolve, reject) => {
    child.on('error', reject);
    child.on('close', code => code === 0 ? resolve(stdout.trim()) : reject(new Error(stderr || `psql exit ${code}`)));
  });
  // Callers attach immediately; failures during readiness polling must not be unhandled.
  done.catch(() => {});
  return { child, done, output: () => stdout };
}
async function sql(query, name = 'lfc-check') {
  const connection = session(name);
  connection.child.stdin.end(query);
  return connection.done;
}
function json(output) { return JSON.parse(output.split('\n').find(line => line.startsWith('{'))); }
let seq = 1;
const uuid = () => `550e8400-e29b-41d4-a716-${String(seq++).padStart(12, '0')}`;
const parent = uuid(), variant = uuid();
const fingerprint = '8'.repeat(64);
const content = { title: 'Fixture', description: 'Fixture description', story: null, seoTitle: null, seoDescription: null, primaryMediaAlt: null };
const quote = value => `'${String(value).replaceAll("'", "''")}'`;
const createColorway = (op, slug, id = parent, fp = fingerprint) =>
  `select public.manage_catalog_colorway('${op}','native-test','create_draft','${id}',null,'${fp}',${quote(JSON.stringify({ name: 'Fixture', slug }))}::jsonb)`;
const saveTranslation = (op, revision, locale = 'vi', text = content, variantId = null) =>
  `select public.save_catalog_translation_draft('${parent}',${variantId ? quote(variantId) : 'null'},'${locale}','${op}','native-test','${fingerprint}',${revision},${quote(JSON.stringify(text))}::jsonb,true)`;

async function race(heldQuery, contenderQuery, code = null) {
  const holder = session('lfc-holder');
  holder.child.stdin.write(`begin; set role service_role; ${heldQuery};\n\\echo HOLDER_READY\n`);
  let contender;
  try {
    const deadline = Date.now() + 5000;
    while (!holder.output().includes('HOLDER_READY')) {
      await Promise.race([delay(20), holder.done.then(() => { throw new Error('holder exited before readiness'); })]);
      assert.ok(Date.now() < deadline, 'holder readiness timeout');
    }
    contender = sql(`set role service_role; ${contenderQuery};`, 'lfc-contender');
    contender.catch(() => {});
    const lockDeadline = Date.now() + 1500;
    while (await sql("select exists(select 1 from pg_stat_activity where application_name='lfc-contender' and wait_event_type='Lock' and cardinality(pg_blocking_pids(pid)) > 0)") !== 't') {
      assert.ok(Date.now() < lockDeadline, 'contender did not wait on the held transaction');
      await delay(20);
    }
    holder.child.stdin.end('commit;\n');
    const held = await holder.done;
    if (code) {
      await assert.rejects(contender, error => error.message.includes(code));
      return { held: jsonOrNull(held), next: null };
    }
    return { held: jsonOrNull(held), next: jsonOrNull(await contender) };
  } finally {
    if (!holder.child.stdin.writableEnded) holder.child.stdin.end('rollback;\n');
    await holder.done.catch(() => {});
    if (contender) await contender.catch(() => {});
  }
}
function jsonOrNull(output) { return output.split('\n').some(line => line.startsWith('{')) ? json(output) : null; }

assert.equal(await sql('select current_database()'), 'luminal_sql_test');
assert.equal(await sql("select (current_setting('server_version_num')::int / 10000)::text"), '17');
assert.equal(await sql("select count(*) from pg_tables where schemaname in ('public','private')"), '0', 'Database must be empty.');
const core = read('supabase/migrations/20260810045019_create_commerce_core.sql');
let setup = `create role anon; create role authenticated; create role service_role bypassrls;
  create schema private; grant usage on schema public,private to service_role;
  ${core.slice(core.indexOf('create or replace function public.commerce_set_updated_at'), core.indexOf('create table public.product_media'))}
  alter table public.products enable row level security; alter table public.product_variants enable row level security;
  grant select on public.products,public.product_variants to anon,authenticated;
  grant all on public.products,public.product_variants to service_role;
  ${core.slice(core.indexOf('create policy "published products are public"'), core.indexOf('create policy "media for published products is public"'))}`;
const root = suite === 'colorways' ? 'supabase/drafts/colorway-management' : 'supabase/drafts/translations';
if (suite === 'colorways') {
  const receipts = read('supabase/migrations/20260912150000_add_commerce_admin_hero_idempotency.sql');
  setup += receipts.slice(receipts.indexOf('create table private.commerce_admin_idempotency_receipts'), receipts.indexOf('create function public.manage_homepage_hero'));
}
await sql(setup);
await sql(read(`${root}/forward.sql`));
await sql(read(`${root}/validation.sql`));
assert.equal(await sql('select count(*) from public.products'), '0', 'Validation fixture must roll back.');
await sql(`insert into public.products(id,slug,name,product_type,release_type) values('${parent}','native-fixture','Source unchanged','artisan_keycap','informational');
  insert into public.product_variants(id,product_id,name,is_active) values('${variant}','${parent}','Variant source',false);`);
if (suite === 'colorways') {
  const op = uuid();
  const replay = await race(createColorway(op, 'same-op'), createColorway(op, 'same-op'));
  assert.deepEqual(replay.next, replay.held);
  assert.equal(await sql("select count(*) from public.product_variants where attributes->>'colorway_slug'='same-op'"), '1');
  const conflictOp = uuid();
  await race(createColorway(conflictOp, 'original'), createColorway(conflictOp, 'changed', parent, '9'.repeat(64)), '22023');
  await race(createColorway(uuid(), 'duplicate'), createColorway(uuid(), 'duplicate'), '23505');
  await race(`update public.product_variants set is_active=true where id='${variant}'`,
    `select public.manage_catalog_colorway('${uuid()}','native-test','update_draft','${parent}','${variant}','${fingerprint}','{"name":"Denied","slug":"denied"}')`, 'P0002');
  await race(`update public.products set status='published',published_at=now() where id='${parent}'`, createColorway(uuid(), 'publish-race'), '22023');
  assert.equal(await sql("select count(*) from public.product_variants where attributes->>'colorway_slug'='publish-race'"), '0');
  const before = await sql('select count(*) from public.product_variants');
  await sql(read(`${root}/rollback.sql`));
  assert.equal(await sql('select count(*) from public.product_variants'), before);
  assert.equal(await sql("select to_regprocedure('public.manage_catalog_colorway(uuid,text,text,uuid,uuid,text,jsonb)') is null"), 't');
  console.log('PASS PostgreSQL 17: same-operation replay, operation conflict, duplicate slug, activation/save and publish/save races; data-preserving rollback.');
} else {
  const op = uuid();
  const replay = await race(saveTranslation(op, 0), saveTranslation(op, 0));
  assert.deepEqual(replay.next, replay.held);
  await race(saveTranslation(uuid(), 1), saveTranslation(uuid(), 1, 'vi', { ...content, title: 'Stale overwrite' }), '40001');
  assert.equal(await sql(`select revision from public.catalog_translation_drafts where product_id='${parent}' and locale='vi'`), '2');
  const conflictOp = uuid();
  await race(saveTranslation(conflictOp, 2), saveTranslation(conflictOp, 2, 'vi', { ...content, title: 'Changed payload' }), '22023');
  const en = await race(saveTranslation(uuid(), 0, 'en'), saveTranslation(uuid(), 0, 'vi', content, variant));
  assert.equal(en.held.locale, 'en'); assert.equal(en.next.variantId, variant); assert.equal(en.next.revision, 1);
  // Retrying an earlier operation returns its original receipt, never the latest revision.
  assert.deepEqual(json(await sql(`set role service_role; ${saveTranslation(op, 0)};`)), replay.held);
  await race(`update public.products set status='archived' where id='${parent}'`, saveTranslation(uuid(), 3), '22023');
  assert.equal(await sql(`select revision from public.catalog_translation_drafts where product_id='${parent}' and variant_id is null and locale='vi'`), '3');
  for (const role of ['anon', 'authenticated']) {
    await assert.rejects(sql(`set role ${role}; select public.read_catalog_translation_draft('${parent}',null,'vi');`), error => error.message.includes('42501'));
    await assert.rejects(sql(`set role ${role}; select content from public.catalog_translation_drafts;`), error => error.message.includes('42501'));
  }
  const before = await sql('select count(*) from public.catalog_translation_drafts');
  await sql(read(`${root}/rollback.sql`));
  assert.equal(await sql('select count(*) from public.catalog_translation_drafts'), before);
  await assert.rejects(sql(`set role service_role; select public.read_catalog_translation_draft('${parent}',null,'vi');`), error => error.message.includes('42501'));
  console.log('PASS PostgreSQL 17: replay, stale concurrent save, changed-operation conflict, Product/Colorway/locale isolation, archive/save race, denied browser roles; data-preserving rollback.');
}
