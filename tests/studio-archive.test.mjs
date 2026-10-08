import assert from 'node:assert/strict';
import test from 'node:test';
import { readFileSync, existsSync } from 'node:fs';
import ts from 'typescript';
function load(path, dependencies = {}) {
  const mod = { exports: {} };
  const code = ts.transpileModule(readFileSync(path, 'utf8'), { compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022 } }).outputText;
  new Function('require', 'module', 'exports', code)(name => {
    assert.ok(name in dependencies, `Unexpected runtime dependency: ${name}`);
    return dependencies[name];
  }, mod, mod.exports);
  return mod.exports;
}
const media = load('src/content/homepage-media.ts');
const archive = load('src/features/archive/archive-content.ts', { '@/content/homepage-media': media });
const dictionary = JSON.parse(readFileSync('src/lib/i18n/copy.json', 'utf8'));
test('public archive contains three genuine colorway records with existing approved images', () => {
  const entries = archive.getCuratedArchiveEntries();
  assert.equal(entries.length, 3);
  assert.equal(new Set(entries.map(entry => entry.href)).size, 3);
  for (const entry of entries) {
    assert.equal(entry.isPlaceholder, false);
    assert.equal(entry.media.productionApproved, true);
    assert.ok(existsSync(`public${entry.media.src}`));
    assert.equal(archive.getArchiveEntryBySlug(entry.slug), entry);
    assert.equal(entry.year, '');
    assert.ok(!entry.facts.some(fact => /price|stock|edition|sold out|release date/i.test(fact.label)));
  }
});
test('old placeholder and unknown slugs cannot become public archive records', () => {
  assert.equal(archive.getArchiveEntryBySlug('object-study-01'), undefined);
  assert.equal(archive.getArchiveEntryBySlug('unknown'), undefined);
});
test('each record has EN and VI descriptions, material labels and image descriptions', () => {
  for (const entry of archive.getCuratedArchiveEntries()) {
    for (const text of [entry.description, entry.collection, entry.materialNote, entry.media.alt, ...entry.historicalNotes]) {
      assert.ok(dictionary[text]?.[0], `Missing English: ${text}`);
      assert.ok(dictionary[text]?.[1], `Missing Vietnamese: ${text}`);
    }
  }
});
