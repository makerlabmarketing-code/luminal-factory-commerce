import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { createRequire } from 'node:module';
import { resolve, dirname } from 'node:path';
import { runInThisContext } from 'node:vm';
import test from 'node:test';
import ts from 'typescript';
const require = createRequire(import.meta.url);
class ServiceError extends Error { constructor(code, message) { super(message); this.code = code; } }
function loadSource(file, mocks = {}, cache = new Map()) {
  if (cache.has(file)) return cache.get(file).exports;
  const loadedModule = { exports: {} }; cache.set(file, loadedModule);
  const code = ts.transpileModule(readFileSync(file, 'utf8'), { compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022 } }).outputText;
  runInThisContext(`(function(require,module,exports){${code}\n})`, { filename: file })(specifier => {
    if (specifier in mocks) return mocks[specifier];
    if (specifier === 'server-only') return {};
    if (specifier.startsWith('.')) return loadSource(resolve(dirname(file), `${specifier}.ts`), mocks, cache);
    return require(specifier);
  }, loadedModule, loadedModule.exports);
  return loadedModule.exports;
}
const id = '550e8400-e29b-41d4-a716-446655440000';
const other = '550e8400-e29b-41d4-a716-446655440001';
const contract = loadSource(resolve('src/features/management/colorway-admin-contract.ts'));
const mutation = { operationId: id, draft: { name: ' Lolipop ', slug: ' lolipop ', description: ' Study ' } };
const row = { id: other, product_id: id, name: 'Lolipop', slug: 'lolipop', description: 'Study', is_active: false, created_at: '2026-10-02T00:00:00Z', updated_at: '2026-10-02T00:00:00Z' };
test('strict colorway schema normalizes and rejects commerce fields or reassignment', () => {
  assert.equal(contract.colorwayMutationSchema.parse(mutation).draft.name, 'Lolipop');
  for (const key of ['price', 'isActive', 'productId', 'stock', 'sku']) assert.equal(contract.colorwayMutationSchema.safeParse({ ...mutation, draft: { ...mutation.draft, [key]: 'x' } }).success, false);
  assert.equal(contract.colorwayMutationSchema.safeParse({ ...mutation, draft: { name: 'x', slug: '../x' } }).success, false);
});
test('service sends retained operation ID and path parent to the single RPC', async () => {
  const service = loadSource(resolve('src/features/management/colorway-admin-service.ts'), { './catalog-raffle-admin-service': { CatalogRaffleAdminServiceError: ServiceError } });
  let input;
  const client = { async rpc(name, args) { input = { name, args }; return { data: row, error: null }; } };
  assert.deepEqual(await service.saveManagedColorway(client, id, other, contract.colorwayMutationSchema.parse(mutation), { clientId: 'erp', requestFingerprint: 'fingerprint' }), row);
  assert.equal(input.name, 'manage_catalog_colorway');
  assert.equal(input.args.p_product_id, id); assert.equal(input.args.p_target_id, other);
  assert.equal(input.args.p_action, 'update_draft'); assert.equal(input.args.p_operation_id, id);
  await assert.rejects(service.saveManagedColorway({ async rpc() { return { data: null, error: { code: '23505' } }; } }, id, null, mutation, { clientId: 'erp', requestFingerprint: 'f' }), error => error.code === 'CONFLICT');
});
test('signed route denies before parsing and maps save conflicts without internal details', async () => {
  let authorized = false; let saveCalls = 0; let audits = 0;
  const runtime = {
    async authorizeCommerceAdminRoute(request, scopes) {
      assert.deepEqual(scopes, ['commerce.product.write']);
      if (!authorized) return new Response('', { status: 401 });
      return { identity: { requestId: id, clientId: 'erp' }, rawBodyText: JSON.stringify(mutation), requestFingerprint: 'f', privilegedClient: {} };
    },
    parseCommerceAdminJson: JSON.parse,
    commerceAdminFailure: (requestId,status,code,message) => Response.json({ code,message }, { status }),
    commerceAdminSuccess: (data,requestId,status=200) => Response.json(data,{ status }),
    async recordCommerceAdminAudit() { audits++; },
  };
  const route = loadSource(resolve('src/features/management/colorway-admin-route.ts'), {
    './commerce-admin-route-runtime': runtime,
    './catalog-raffle-admin-service': { CatalogRaffleAdminServiceError: ServiceError },
    './colorway-admin-service': { async saveManagedColorway() { saveCalls++; throw new ServiceError('CONFLICT','Phối màu bị trùng.'); } },
  });
  assert.equal((await route.handleColorwayRequest(new Request('https://commerce.test',{method:'POST'}),id)).status,401);
  assert.equal(saveCalls,0); authorized=true;
  assert.equal((await route.handleColorwayRequest(new Request('https://commerce.test',{method:'POST'}),'../other')).status,400);
  assert.equal(saveCalls,0);
  assert.equal((await route.handleColorwayRequest(new Request('https://commerce.test',{method:'POST'}),id)).status,409);
  assert.equal(saveCalls,1); assert.equal(audits,1);
});
