import assert from 'node:assert/strict';
import test from 'node:test';
import { readFileSync } from 'node:fs';
import { createRequire } from 'node:module';
import ts from 'typescript';
import { defaultLocale, localeHref, languageAlternates, splitLocale, isLocale } from '../src/lib/i18n/locale.ts';
const require = createRequire(import.meta.url);
const dictionary = JSON.parse(readFileSync('src/lib/i18n/copy.json', 'utf8'));
function loadModule(path, dependencies) {
  const code = ts.transpileModule(readFileSync(path, 'utf8'), { compilerOptions: { module: ts.ModuleKind.CommonJS } }).outputText;
  const compiled = { exports: {} };
  new Function('require', 'module', 'exports', code)(name => dependencies[name] ?? require(name), compiled, compiled.exports);
  return compiled.exports;
}
const helpers = { defaultLocale, localeHref, languageAlternates, splitLocale, isLocale, localeCookie: 'luminal_locale' };
const { translator } = loadModule('src/lib/i18n/translations.ts', { './copy.json': { default: dictionary } });
const { localizePresentation } = loadModule('src/lib/i18n/presentation.ts', { './translations': { translator } });

test('locale URLs preserve slug, query and hash without duplicating prefixes', () => {
  assert.equal(defaultLocale, 'en');
  assert.equal(localeHref('/vi/shop/meowhe?type=other#story', 'en'), '/en/shop/meowhe?type=other#story');
  assert.equal(localeHref('/en', 'vi'), '/vi');
  assert.equal(localeHref('/shop?release=direct', 'vi'), '/vi/shop?release=direct');
  for (const url of ['/api/cart', '/api/account/auth', '/_next/static/test.js', '#story', 'https://example.com/en', '//example.com']) assert.equal(localeHref(url, 'vi'), url);
  assert.deepEqual(splitLocale('/vintage'), { locale: null, path: '/vintage' });
  assert.equal(isLocale('fr'), false);
});

test('language SEO points both translations and x-default at the same object', () => {
  assert.deepEqual(languageAlternates('/shop/meowhe', 'vi'), {
    canonical: '/vi/shop/meowhe', languages: { en: '/en/shop/meowhe', vi: '/vi/shop/meowhe', 'x-default': '/en/shop/meowhe' },
  });
});

test('every reviewed string has both languages and matching interpolation tokens', () => {
  const tokens = value => [...value.matchAll(/\{[a-z]+\}/g)].map(match => match[0]).sort();
  for (const [key, pair] of Object.entries(dictionary)) {
    assert.equal(pair.length, 2, key);
    assert.ok(pair.every(value => typeof value === 'string' && value.trim()), key);
    assert.deepEqual(tokens(pair[0]), tokens(pair[1]), key);
  }
  assert.equal(translator('en')('Giỏ hàng'), 'Cart');
  assert.equal(translator('vi')('Entry recorded. Reference: {reference}'), 'Entry đã được ghi nhận. Mã tham chiếu: {reference}');
  assert.equal(translator('vi')('Meowhe Lolipop'), 'Meowhe Lolipop');
});

test('presentation translation preserves domain state, identity, URLs and price', () => {
  const original = { id: 'meowhe', slug: 'lolipop', title: 'Meowhe Lolipop', status: 'OPEN', releaseType: 'direct', price: 65, href: '/shop/meowhe', media: { src: '/images/meowhe.png' }, description: 'Scroll to follow the object' };
  const translated = localizePresentation(original, 'vi');
  assert.notEqual(translated.description, original.description);
  assert.deepEqual({ ...translated, description: original.description }, original);
  assert.equal(original.description, 'Scroll to follow the object');
});

test('proxy respects explicit language, English default, preference cookie and private cart cache', async () => {
  let refreshes = 0;
  const response = location => ({ location, headers: new Headers() });
  const { proxy } = loadModule('src/proxy.ts', {
    '@/lib/i18n/locale': helpers,
    'next/server': { NextResponse: { redirect: url => response(url.href), next: () => response(null) } },
    '@/lib/supabase/customer-auth-proxy': { refreshCustomerAuthSession: async () => { refreshes++; return response(null); } },
  });
  const request = (path, preference) => { const url = new URL(path, 'https://luminalfactory.com'); url.clone = () => new URL(url); return { method: 'GET', nextUrl: url, cookies: { get: () => preference ? { value: preference } : undefined } }; };
  assert.equal((await proxy(request('/shop?q=meowhe'))).location, 'https://luminalfactory.com/en/shop?q=meowhe');
  assert.equal((await proxy(request('/shop', 'vi'))).location, 'https://luminalfactory.com/vi/shop');
  assert.equal((await proxy(request('/shop', 'fr'))).location, 'https://luminalfactory.com/en/shop');
  for (const path of ['/vi/shop', '/en/shop', '/fr/shop', '/api/cart', '/api/account/auth']) assert.equal((await proxy(request(path, 'vi'))).location, null);
  for (const path of ['/en/cart', '/vi/cart']) {
    const result = await proxy(request(path));
    assert.equal(result.headers.get('Cache-Control'), 'private, no-store, max-age=0');
    assert.equal(result.headers.get('Vary'), 'Cookie');
  }
  for (const path of ['/en/account', '/vi/account']) await proxy(request(path));
  assert.equal(refreshes, 5);
});

test('Production metadata and sitemap have an absolute verified origin even without an environment override', () => {
  const origin = loadModule('src/lib/site-url.ts', {}).publicSiteUrl;
  assert.ok(new URL(origin).origin.startsWith('https://'));
  assert.match(readFileSync('src/app/[locale]/layout.tsx', 'utf8'), /metadataBase: new URL\(publicSiteUrl\)/);
  const previous = process.env.VERCEL_ENV;
  try {
    process.env.VERCEL_ENV = 'production';
    const { default: sitemap } = loadModule('src/app/sitemap.ts', { '@/lib/site-url': { publicSiteUrl: 'https://luminalfactory.com' }, '@/lib/i18n/locale': { locales: ['en','vi'], localeHref } });
    const entries = sitemap();
    assert.equal(entries.length, 14);
    assert.ok(entries.some(entry => entry.url === 'https://luminalfactory.com/vi/support'));
    assert.ok(entries.some(entry => entry.url === 'https://luminalfactory.com/en/support'));
    assert.ok(entries.every(entry => entry.url.startsWith('https://luminalfactory.com/') && Object.values(entry.alternates.languages).every(url => url.startsWith('https://luminalfactory.com/'))));
    assert.ok(entries.every(entry => !/account|cart|test|object-study/.test(entry.url)));
    process.env.VERCEL_ENV = 'preview';
    assert.deepEqual(sitemap(), []);
  } finally { if (previous === undefined) delete process.env.VERCEL_ENV; else process.env.VERCEL_ENV = previous; }
});
