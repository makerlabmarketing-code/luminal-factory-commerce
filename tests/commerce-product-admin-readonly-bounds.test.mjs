import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

const read = (path) => readFileSync(path, "utf8");

test("Commerce catalog list requires signed product-read scope and no caching", () => {
  const route = read("src/app/api/admin/v1/products/route.ts");
  assert.match(route, /authorizeCommerceAdminRoute\(request, \["commerce\.product\.read"\]\)/);
  assert.match(route, /recordCommerceAdminAudit\(context/);
  assert.match(route, /commerceAdminSuccess\(products, context\.identity\.requestId\)/);
  assert.match(route, /export const dynamic = "force-dynamic"/);
});

test("Product list cannot silently truncate beyond 200 entries", () => {
  const service = read("src/features/management/catalog-raffle-admin-service.ts");
  assert.match(service, /export async function listManagedProducts/);
  assert.match(service, /\.limit\(201\)/);
  assert.match(service, /\(data\?\.length \?\? 0\) > 200/);
  assert.match(service, /Product catalog pagination is required/);
});
