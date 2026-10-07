import assert from 'node:assert/strict';
import test from 'node:test';
import { readFileSync } from 'node:fs';
import { createRequire } from 'node:module';
import ts from 'typescript';
const require = createRequire(import.meta.url);
const mod = { exports: {} };
const code = ts.transpileModule(readFileSync('src/features/raffle/raffle-list-service.ts', 'utf8'), {
  compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022, esModuleInterop: true },
}).outputText;
new Function('require', 'module', 'exports', code)(name => name === 'server-only' ? {} : require(name), mod, mod.exports);
const { resolveRaffleList, getPublishedRaffleList } = mod.exports;
const now = Date.parse('2026-10-07T00:00:00Z');
const base = { id: '550e8400-e29b-41d4-a716-446655440000', slug: 'meowhe-release', title: 'Meowhe', summary: null,
  product_id: null, is_published: true, is_test: false, status: 'OPEN', published_at: '2026-10-06T00:00:00Z',
  opens_at: '2026-10-06T23:00:00Z', closes_at: '2026-10-07T01:00:00Z' };

test('raffle list enforces opening/closing boundaries without manufacturing lifecycle transitions', () => {
  const result = change => resolveRaffleList([{ ...base, ...change }], now);
  assert.equal(result({ opens_at: '2026-10-07T00:00:00Z' }).entries[0].state, 'open');
  assert.equal(result({ closes_at: '2026-10-07T00:00:00Z' }).entries[0].state, 'closed');
  assert.equal(result({ status: 'SCHEDULED', opens_at: '2026-10-07T00:30:00Z' }).entries[0].state, 'upcoming');
  for (const change of [{ status: 'SCHEDULED' }, { opens_at: '2026-10-07T00:30:00Z' }, { closes_at: null }, { closes_at: base.opens_at }, { status: 'CLOSED' }, { status: 'COMPLETED' }]) assert.equal(result(change).entries.length, 0);
  assert.equal(result({ status: 'COMPLETED', closes_at: '2026-10-07T00:00:00Z' }).entries[0].state, 'completed');
  assert.equal(result({ status: 'CANCELLED', opens_at: null, closes_at: null }).entries[0].state, 'cancelled');
});

test('private/test/draft/future-published/unsafe rows cannot enter public list; verified empty differs from invalid', () => {
  assert.equal(resolveRaffleList([], now).state, 'empty');
  assert.equal(resolveRaffleList({}, now).state, 'unavailable');
  for (const change of [{ is_published: false }, { is_test: true }, { status: 'DRAFT' }, { published_at: '2026-10-08T00:00:00Z' }, { slug: '//example.test' }]) {
    assert.equal(resolveRaffleList([{ ...base, ...change }], now).state, 'unavailable');
  }
  assert.equal(resolveRaffleList([base, { ...base, slug: '//invalid' }, base], now).entries.length, 1);
  assert.equal(resolveRaffleList(Array(31).fill(base), now).state, 'unavailable');
});

test('list prioritizes open then nearest scheduled before past releases', () => {
  const scheduled = { ...base, status: 'SCHEDULED' };
  const rows = [{ ...base, slug: 'past', status: 'CLOSED', closes_at: '2026-10-07T00:00:00Z' },
    { ...scheduled, slug: 'later', opens_at: '2026-10-07T00:40:00Z' },
    { ...scheduled, slug: 'near', opens_at: '2026-10-07T00:20:00Z' }, base];
  assert.deepEqual(resolveRaffleList(rows, now).entries.map(x => x.slug), ['meowhe-release', 'near', 'later', 'past']);
});

test('reader is independently gated and uses bounded anonymous no-store reads; errors never become empty', async () => {
  const names = ['COMMERCE_RAFFLE_DETAIL_ENABLED', 'NEXT_PUBLIC_SUPABASE_URL', 'NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY'];
  const old = names.map(n => process.env[n]); const originalFetch = global.fetch;
  try {
    let calls = 0;
    global.fetch = async (endpoint, options) => { calls++; const url = new URL(endpoint);
      assert.equal(url.searchParams.get('limit'), '30'); assert.equal(url.searchParams.get('is_test'), 'eq.false');
      assert.equal(url.searchParams.get('is_published'), 'eq.true'); assert.equal(options.cache, 'no-store');
      assert.equal(options.headers.apikey, 'public-key'); assert.equal(options.method, undefined);
      return new Response('[]', { status: 200 }); };
    process.env.COMMERCE_RAFFLE_DETAIL_ENABLED = 'false';
    assert.equal((await getPublishedRaffleList()).state, 'disabled'); assert.equal(calls, 0);
    process.env.COMMERCE_RAFFLE_DETAIL_ENABLED = 'true';
    process.env.NEXT_PUBLIC_SUPABASE_URL = 'https://catalog.test'; process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY = 'public-key';
    assert.equal((await getPublishedRaffleList()).state, 'empty'); assert.equal(calls, 1);
    global.fetch = async () => new Response(null, { status: 503 });
    assert.equal((await getPublishedRaffleList()).state, 'unavailable');
    global.fetch = async () => new Response('{malformed', { status: 200 });
    assert.equal((await getPublishedRaffleList()).state, 'unavailable');
    process.env.NEXT_PUBLIC_SUPABASE_URL = 'https://user:pass@catalog.test';
    global.fetch = async () => assert.fail('invalid configuration must not fetch');
    assert.equal((await getPublishedRaffleList()).state, 'unavailable');
  } finally { global.fetch = originalFetch; names.forEach((n, i) => { if (old[i] === undefined) delete process.env[n]; else process.env[n] = old[i]; }); }
});
