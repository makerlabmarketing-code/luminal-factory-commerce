import assert from 'node:assert/strict';
import test from 'node:test';
import { readFileSync } from 'node:fs';
import { createRequire } from 'node:module';
import ts from 'typescript';
const require = createRequire(import.meta.url);
function load(path, dependencies = {}) {
  const compiled = { exports: {} };
  const code = ts.transpileModule(readFileSync(path, 'utf8'), { compilerOptions: { module: ts.ModuleKind.CommonJS } }).outputText;
  new Function('require', 'module', 'exports', code)(key => dependencies[key] ?? require(key), compiled, compiled.exports);
  return compiled.exports;
}
const contract = load('src/features/management/translation-contract.ts');
const publicReader = load('src/features/shop/catalog-translations.ts', { 'server-only': {}, '@/features/management/translation-contract': contract });
const id = '550e8400-e29b-41d4-a716-446655440000';
const blank = { title: null, description: null, story: null, seoTitle: null, seoDescription: null, primaryMediaAlt: null };
const entry = { id, slug: 'meowhe', title: 'Source', description: 'Source description', story: 'Source story', dataSource: 'commerce-catalog', priceLabel: '$70', href: '/shop/meowhe', media: { alt: 'Source alt', src: '/photo.webp' } };
const row = (locale, content) => ({ product_id: id, variant_id: null, locale, content: { ...blank, ...content } });

test('translation drafts permit incomplete content and enforce readiness/limits/domain exclusion', () => {
  assert.equal(contract.translationDraftSchema.safeParse({ content: blank, ready: false }).success, true);
  assert.equal(contract.translationDraftSchema.safeParse({ content: blank, ready: true }).success, false);
  assert.equal(contract.translationDraftSchema.safeParse({ content: { ...blank, title: 'Name', description: 'Story' }, ready: true }).success, true);
  for (const content of [{ ...blank, price: 70 }, { ...blank, title: 'x'.repeat(161) }, { ...blank, story: 'x'.repeat(8001) }, { ...blank, seoTitle: false }]) assert.equal(contract.translationContentSchema.safeParse(content).success, false);
  assert.equal(contract.translationMutationSchema.safeParse({ operationId: id, expectedRevision: -1, draft: { content: blank, ready: false } }).success, false);
  assert.equal(contract.translationContentSchema.parse({ ...blank, title: '   ' }).title, null);
});
test('localized public snapshots use field fallback while retaining identity, price and media', () => {
  const rows = [row('en', { title: 'English', story: 'English story', seoTitle: 'English SEO' }), row('vi', { title: 'Tiếng Việt', description: 'Mô tả', primaryMediaAlt: 'Ảnh chính' })];
  const localized = publicReader.applyApprovedTranslation(entry, 'vi', rows);
  assert.equal(localized.title, 'Tiếng Việt'); assert.equal(localized.story, 'English story'); assert.equal(localized.seoTitle, 'English SEO'); assert.equal(localized.media.alt, 'Ảnh chính');
  for (const key of ['id', 'slug', 'href', 'priceLabel']) assert.equal(localized[key], entry[key]);
  assert.equal(localized.media.src, entry.media.src);
  assert.equal(publicReader.applyApprovedTranslation(entry, 'en', rows).title, 'English');
  assert.equal(publicReader.applyApprovedTranslation(entry, 'vi', [row('vi', { title: 'Other' }), { ...row('vi', { title: 'Variant' }), variant_id: id }]).title, 'Other');
});
test('public reader stays off by default and missing/invalid translations cannot hide catalog entries', async () => {
  const old = process.env.COMMERCE_CATALOG_TRANSLATIONS_ENABLED; const originalFetch = globalThis.fetch;
  let requests = 0;
  try {
    delete process.env.COMMERCE_CATALOG_TRANSLATIONS_ENABLED;
    globalThis.fetch = async () => { requests++; throw new Error('network'); };
    assert.strictEqual(await publicReader.localizeCatalogEntries([entry], 'vi', { url: 'https://catalog.test', publishableKey: 'public' }).then(rows => rows[0]), entry); assert.equal(requests, 0);
    process.env.COMMERCE_CATALOG_TRANSLATIONS_ENABLED = 'true';
    assert.strictEqual((await publicReader.localizeCatalogEntries([entry], 'vi', { url: 'https://catalog.test', publishableKey: 'public' }))[0], entry);
    globalThis.fetch = async (url, options) => {
      assert.match(url.pathname, /catalog_translation_public$/); assert.equal(url.searchParams.get('variant_id'), 'is.null'); assert.equal(options.headers.apikey, 'public');
      return Response.json([row('vi', { title: 'Tên', description: 'Mô tả' })]);
    };
    assert.equal((await publicReader.localizeCatalogEntries([entry], 'vi', { url: 'https://catalog.test', publishableKey: 'public' }))[0].title, 'Tên');
    for (const data of [[{ ...row('vi', { title: 'Leak' }), draft: true }], [row('vi', { title: 'A' }), row('vi', { title: 'B' })], [{ ...row('vi', { title: 'Wrong' }), product_id: '550e8400-e29b-41d4-a716-446655440001' }]]) {
      globalThis.fetch = async () => Response.json(data);
      assert.strictEqual((await publicReader.localizeCatalogEntries([entry], 'vi', { url: 'https://catalog.test', publishableKey: 'public' }))[0], entry);
    }
  } finally { globalThis.fetch = originalFetch; if (old === undefined) delete process.env.COMMERCE_CATALOG_TRANSLATIONS_ENABLED; else process.env.COMMERCE_CATALOG_TRANSLATIONS_ENABLED = old; }
});

test('signed translation handler denies before service access and preserves scope boundaries', async () => {
  let authorized = false; let calls = 0; const scopes = [];
  class ServiceError extends Error {}
  const handler = load('src/features/management/translation-admin-route.ts', {
    './translation-contract': contract,
    './catalog-raffle-admin-service': { CatalogRaffleAdminServiceError: ServiceError },
    './translation-admin-service': { readManagedTranslation: async () => { calls++; return null; }, saveManagedTranslation: async () => { calls++; return { id }; } },
    './commerce-admin-route-runtime': {
      authorizeCommerceAdminRoute: async (_request, scope) => { scopes.push(scope); return authorized ? { identity: { requestId: id, clientId: 'erp' }, rawBodyText: '{}' } : new Response(null, { status: 401 }); },
      commerceAdminSuccess: value => Response.json(value), commerceAdminFailure: (_id, status) => new Response(null, { status }),
      parseCommerceAdminJson: JSON.parse, recordCommerceAdminAudit: async () => {},
    },
  });
  const params = Promise.resolve({ id, locale: 'vi' });
  assert.equal((await handler.handleTranslationRoute(new Request('https://test'), params, false)).status, 401); assert.equal(calls, 0);
  authorized = true;
  assert.equal((await handler.handleTranslationRoute(new Request('https://test'), params, false)).status, 200); assert.equal(calls, 1);
  assert.equal((await handler.handleTranslationRoute(new Request('https://test'), params, true)).status, 400); assert.equal(calls, 1);
  assert.deepEqual(scopes, [['commerce.product.read'], ['commerce.product.read'], ['commerce.product.write']]);
});
