import assert from 'node:assert/strict';
import test from 'node:test';
import { readFileSync } from 'node:fs';
import { createRequire } from 'node:module';
import ts from 'typescript';
import React from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
const require = createRequire(import.meta.url);
const dictionary = JSON.parse(readFileSync('src/lib/i18n/copy.json', 'utf8'));
let locale = 'en';
const mod = { exports: {} };
const code = ts.transpileModule(readFileSync('src/features/raffle/raffle-discovery.tsx', 'utf8'), {
  compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022, jsx: ts.JsxEmit.ReactJSX, esModuleInterop: true },
}).outputText;
new Function('require', 'module', 'exports', code)(name => {
  if (name === '@/lib/i18n/server') return { getLocale: async () => locale, getTranslator: async () => text => dictionary[text]?.[locale === 'vi' ? 1 : 0] ?? text };
  if (name === '@/lib/i18n/locale') return { localeHref: href => `/${locale}${href}` };
  if (name === '@/lib/i18n/link') return { default: ({ href, children, ...props }) => React.createElement('a', { ...props, href: `/${locale}${href}` }, children), __esModule: true };
  if (name.endsWith('.css')) return {};
  return require(name);
}, mod, mod.exports);
const render = async releases => renderToStaticMarkup(await mod.exports.RaffleDiscovery({ releases }));

test('both locales distinguish unavailable/disabled from verified empty and localize retry/navigation', async () => {
  for (locale of ['en', 'vi']) {
    const emptyCopy = dictionary['No announced releases'][locale === 'vi' ? 1 : 0];
    for (const state of ['disabled', 'unavailable', 'empty']) {
      const html = await render({ state, entries: [] });
      assert.equal((html.match(/<h1\b/g) ?? []).length, 1);
      assert.equal(html.includes(emptyCopy), state === 'empty');
      assert.equal(html.includes(`href="/${locale}/raffle"`), state === 'unavailable');
      assert.ok(html.includes(`href="/${locale}/archive"`));
      assert.ok(html.includes(`href="/${locale}/shop"`));
      assert.doesNotMatch(html, /<form|<button|type="submit"/);
    }
  }
});

test('published cards preserve source identity, escape content, show UTC+7 semantic dates and detail-only links', async () => {
  const entries = ['open', 'upcoming', 'closed', 'completed', 'cancelled'].map(state => ({ id: state, slug: `release-${state}`, title: '<Meowhe>', summary: '<script>source</script>', state,
    opensAt: state === 'cancelled' ? null : '2026-10-07T00:00:00Z', closesAt: state === 'cancelled' ? null : '2026-10-07T01:00:00Z' }));
  for (locale of ['en', 'vi']) {
    const html = await render({ state: 'ready', entries });
    assert.equal((html.match(/<h2>/g) ?? []).length, 5);
    assert.equal((html.match(/<time /g) ?? []).length, 8);
    assert.ok(html.includes('dateTime="2026-10-07T00:00:00Z"'));
    assert.ok(html.includes('Asia/Ho_Chi_Minh (UTC+7)'));
    assert.ok(html.includes('&lt;Meowhe&gt;')); assert.ok(html.includes('&lt;script&gt;'));
    for (const entry of entries) assert.ok(html.includes(`href="/${locale}/raffle/${entry.slug}"`));
    assert.doesNotMatch(html, /<form|<script|Enter raffle|No announced releases/);
  }
});
