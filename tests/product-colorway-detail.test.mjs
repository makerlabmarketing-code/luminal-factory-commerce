import assert from 'node:assert/strict';
import test from 'node:test';
import { readFileSync } from 'node:fs';
import { createRequire } from 'node:module';
import ts from 'typescript';
const require = createRequire(import.meta.url);
function load(path, deps = {}, append = '') {
  const mod = { exports: {} };
  const code = ts.transpileModule(readFileSync(path, 'utf8'), { compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022, esModuleInterop: true } }).outputText;
  new Function('require', 'module', 'exports', code + append)(name => deps[name] ?? require(name), mod, mod.exports);
  return mod.exports;
}
const pid = '550e8400-e29b-41d4-a716-446655440000';
const vid = '550e8400-e29b-41d4-a716-446655440001';
const other = '550e8400-e29b-41d4-a716-446655440002';
const { selectGallery } = load('src/features/shop/gallery-selection.ts');
const releaseService = load('src/features/shop/product-release-service.ts', { 'server-only': {} });

test('selected gallery isolates variants and retains shared images; wrong-parent selection cannot expose images', () => {
  const entry = { id: pid, colorways: [{ id: vid, productId: pid, name: 'Lolipop' }, { id: other, productId: 'wrong', name: 'Wrong' }], gallery: [{ key: 'shared', variantId: null }, { key: 'lolipop', variantId: vid }, { key: 'other', variantId: other }] };
  assert.deepEqual(selectGallery(entry, vid).map(a => a.key), ['lolipop', 'shared']);
  assert.deepEqual(selectGallery(entry, null).map(a => a.key), ['shared']);
  assert.deepEqual(selectGallery(entry, other).map(a => a.key), ['shared']);
  assert.deepEqual(selectGallery({ ...entry, gallery: entry.gallery.slice(2) }, vid), []);
});

test('catalog Colorway read model excludes inactive and wrong-parent variants, including media, but preserves an active variant without photos', () => {
  const adapter = load('src/features/shop/catalog-adapter.ts', { 'server-only': {}, './catalog-translations': {}, react: { cache: x => x }, './shop-content': {} }, '\nmodule.exports.mapProduct = mapProduct;');
  const row = { id: pid, slug: 'meowhe', name: 'Meowhe', description: null, product_type: 'artisan_keycap', release_type: 'informational', product_prices: [], product_variants: [{ id: vid, product_id: pid, name: 'No photo', is_active: true }, { id: other, product_id: 'wrong', name: 'Wrong', is_active: true }], product_media: [{ variant_id: other, product_variants: { id: other, name: 'Wrong', is_active: true }, media_type: 'image', storage_path: '/wrong.webp', is_primary: true, sort_order: 0 }] };
  const entry = adapter.mapProduct(row);
  assert.deepEqual(entry.colorways, [{ id: vid, productId: pid, name: 'No photo' }]);
  assert.deepEqual(entry.gallery, []);
  assert.deepEqual(entry.objectFacts, []);
  assert.equal(entry.media.productionApproved, false);
  assert.equal(entry.story.includes('Cherry MX'), false);
});

test('release links require published non-test records, matching Product and truthful time/state', () => {
  const now = Date.parse('2026-10-06T08:00:00Z');
  const row = { slug: 'meowhe-release', title: 'Release', product_id: pid, is_published: true, is_test: false, status: 'OPEN', opens_at: '2026-10-06T07:00:00Z', closes_at: '2026-10-06T09:00:00Z', published_at: '2026-10-06T06:00:00Z' };
  assert.deepEqual(releaseService.resolveProductReleases([row], pid, now), [{ slug: row.slug, title: 'Release', state: 'current' }]);
  for (const changed of [{ is_test: true }, { is_published: false }, { product_id: other }, { status: 'DRAFT' }, { closes_at: '2026-10-06T07:30:00Z' }, { published_at: '2026-10-07T06:00:00Z' }, { slug: '//evil.test' }]) assert.deepEqual(releaseService.resolveProductReleases([{ ...row, ...changed }], pid, now), []);
  assert.equal(releaseService.resolveProductReleases([{ ...row, status: 'CLOSED', closes_at: '2026-10-06T07:30:00Z' }], pid, now)[0].state, 'past');
  assert.equal(releaseService.resolveProductReleases([{ ...row, status: 'SCHEDULED', opens_at: '2026-10-06T08:30:00Z' }], pid, now)[0].state, 'upcoming');
});

test('detail catalog read failure remains an error instead of becoming not-found or fixture content', async () => {
  const oldUrl = process.env.NEXT_PUBLIC_SUPABASE_URL, oldKey = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY, oldFetch = global.fetch;
  try {
    process.env.NEXT_PUBLIC_SUPABASE_URL = 'https://catalog.test'; process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY = 'public'; global.fetch = async () => new Response(null, { status: 503 });
    const adapter = load('src/features/shop/catalog-adapter.ts', { 'server-only': {}, './catalog-translations': {}, react: { cache: x => x }, './shop-content': {} });
    await assert.rejects(adapter.getShopCatalogEntryBySlug('meowhe'), /could not be loaded/);
  } finally { global.fetch = oldFetch; if (oldUrl === undefined) delete process.env.NEXT_PUBLIC_SUPABASE_URL; else process.env.NEXT_PUBLIC_SUPABASE_URL = oldUrl; if (oldKey === undefined) delete process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY; else process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY = oldKey; }
});
