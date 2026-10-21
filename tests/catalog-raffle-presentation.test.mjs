import assert from 'node:assert/strict';
import test from 'node:test';
import { readFileSync } from 'node:fs';
import { createRequire } from 'node:module';
import ts from 'typescript';

const require = createRequire(import.meta.url);
const source = readFileSync('src/features/shop/catalog-adapter.ts', 'utf8');
const code = ts.transpileModule(source, { compilerOptions: {
  module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022, esModuleInterop: true,
} }).outputText;
const compiled = { exports: {} };
const dependencies = {
  'server-only': {}, react: { cache: fn => fn }, './shop-content': {},
  './catalog-translations': { localizeCatalogEntries: async entries => entries },
};
new Function('require', 'module', 'exports', code)((key) => dependencies[key] ?? require(key), compiled, compiled.exports);
const { getShopCatalog } = compiled.exports;
const row = {
  id: '550e8400-e29b-41d4-a716-446655440000', slug: 'legacy-keycap', name: 'Keycap',
  description: null, product_type: 'artisan_keycap', release_type: 'direct',
  published_at: null, product_prices: [], product_media: [],
};

test('legacy keycaps stay raffle-only while other objects retain their release labels', async () => {
  const previousFetch = globalThis.fetch;
  const previousUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const previousKey = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;
  try {
    process.env.NEXT_PUBLIC_SUPABASE_URL = 'https://catalog.test';
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY = 'public';
    for (const release_type of ['direct', 'preorder', 'informational']) {
      globalThis.fetch = async () => Response.json([{ ...row, release_type }]);
      const { entries } = await getShopCatalog();
      assert.equal(entries[0].collection, 'Raffle-only artisan keycap');
      assert.match(entries[0].availabilityLabel, /released through raffles/);
      assert.equal(entries[0].facts.find(fact => fact.label === 'Release type').value, 'informational');
    }
    for (const [release_type, label] of [['direct', 'Direct catalog'], ['preorder', 'Preorder catalog'], ['informational', 'Catalog object']]) {
      globalThis.fetch = async () => Response.json([{ ...row, product_type: 'collectible_object', release_type }]);
      assert.equal((await getShopCatalog()).entries[0].collection, label);
    }
    const requests = [];
    globalThis.fetch = async url => { requests.push(new URL(url)); return Response.json([]); };
    for (const release of ['direct', 'preorder', 'informational']) {
      await getShopCatalog({ q: 'Meowhe', type: 'artisan_keycap', release });
      const params = requests.at(-1).searchParams;
      assert.equal(params.get('product_type'), 'eq.artisan_keycap');
      assert.match(params.get('or'), /name.ilike/);
      if (release === 'informational') {
        assert.equal(params.get('release_type'), null);
        assert.equal(params.get('and'), '(or(release_type.eq.informational,product_type.eq.artisan_keycap))');
      } else {
        assert.equal(params.get('release_type'), `eq.${release}`);
        assert.equal(params.get('and'), '(product_type.neq.artisan_keycap)');
      }
    }
  } finally {
    globalThis.fetch = previousFetch;
    if (previousUrl === undefined) delete process.env.NEXT_PUBLIC_SUPABASE_URL; else process.env.NEXT_PUBLIC_SUPABASE_URL = previousUrl;
    if (previousKey === undefined) delete process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY; else process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY = previousKey;
  }
});
