import assert from 'node:assert/strict';
import test from 'node:test';
import { readFileSync } from 'node:fs';
import { createRequire } from 'node:module';
import ts from 'typescript';
const require = createRequire(import.meta.url);
const mod = { exports: {} };
const code = ts.transpileModule(readFileSync('src/features/management/catalog-raffle-admin-contract.ts', 'utf8'), {
  compilerOptions: { module: ts.ModuleKind.CommonJS },
}).outputText;
new Function('require', 'module', 'exports', code)(require, mod, mod.exports);
const { productDraftMutationSchema, productUpdateMutationSchema } = mod.exports;
const mutation = { operationId: '550e8400-e29b-41d4-a716-446655440000', draft: {
  name: ' Meowhe ', slug: 'meowhe', description: ' Description ', productType: 'artisan_keycap', releaseType: 'direct',
} };
test('information PATCH validates legacy metadata while create remains raffle-only', () => {
  assert.equal(productDraftMutationSchema.safeParse(mutation).success, false);
  const parsed = productUpdateMutationSchema.parse(mutation);
  assert.equal(parsed.draft.name, 'Meowhe');
  assert.equal(parsed.draft.description, 'Description');
  assert.equal(parsed.draft.releaseType, 'direct');
  assert.equal(productDraftMutationSchema.safeParse({ ...mutation, draft: { ...mutation.draft, releaseType: 'informational' } }).success, true);
});
test('information PATCH cannot carry lifecycle, money, inventory or malformed fields', () => {
  for (const change of [{ status: 'published' }, { published_at: '2026-10-07' }, { price: 70 }, { stock: 5 }, { slug: '../bad' }, { name: '' }, { description: 'x'.repeat(5001) }]) {
    assert.equal(productUpdateMutationSchema.safeParse({ ...mutation, draft: { ...mutation.draft, ...change } }).success, false);
  }
  assert.equal(productUpdateMutationSchema.safeParse({ ...mutation, operationId: 'bad' }).success, false);
});
