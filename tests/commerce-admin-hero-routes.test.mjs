import assert from "node:assert/strict";
import fs from "node:fs";
import test from "node:test";

const read = (path) => fs.readFileSync(new URL(`../${path}`, import.meta.url), "utf8");

const runtime = read("src/features/management/commerce-admin-route-runtime.ts");
const service = read("src/features/management/homepage-hero-admin-service.ts");
const collectionRoute = read("src/app/api/admin/v1/homepage-hero/route.ts");
const updateRoute = read("src/app/api/admin/v1/homepage-hero/[id]/route.ts");
const publishRoute = read("src/app/api/admin/v1/homepage-hero/[id]/publish/route.ts");
const unpublishRoute = read("src/app/api/admin/v1/homepage-hero/[id]/unpublish/route.ts");
const migration = read("supabase/migrations/20260912150000_add_commerce_admin_hero_idempotency.sql");
const envExample = read(".env.example");

test("Commerce Admin routes stay behind the exact default-off runtime flag", () => {
  assert.match(runtime, /readCommerceAdminEnvironment\(\)/);
  assert.match(runtime, /if \(!environment\.enabled\)/);
  assert.match(envExample, /COMMERCE_ADMIN_INTEGRATION_ENABLED=false/);
});

test("Homepage Hero route family and least-privilege scopes match ERP contract", () => {
  assert.match(collectionRoute, /export async function GET/);
  assert.match(collectionRoute, /commerce\.hero\.read/);
  assert.match(collectionRoute, /export async function POST/);
  assert.match(collectionRoute, /commerce\.hero\.write/);
  assert.match(updateRoute, /export async function PATCH/);
  assert.match(updateRoute, /commerce\.hero\.write/);
  assert.match(publishRoute, /commerce\.hero\.publish/);
  assert.match(unpublishRoute, /commerce\.hero\.publish/);
});

test("raw request bytes are verified before JSON parsing and replay uses durable RPC", () => {
  assert.match(runtime, /request\.arrayBuffer\(\)/);
  assert.match(runtime, /verifyCommerceAdminRequest/);
  assert.match(runtime, /consume_commerce_admin_nonce/);
  assert.match(runtime, /parseCommerceAdminJson/);
});

test("mutations use one Commerce-owned idempotent RPC and existing publish boundaries", () => {
  assert.match(service, /manage_homepage_hero/);
  assert.match(migration, /primary key \(client_id, operation_id\)/i);
  assert.match(migration, /on conflict \(client_id, operation_id\) do nothing/i);
  assert.match(migration, /public\.publish_homepage_hero\(p_target_id\)/);
  assert.match(migration, /public\.unpublish_homepage_hero\(p_target_id\)/);
  assert.match(migration, /where id = p_target_id and not is_active/i);
});

test("idempotency state is private, RLS-backed and service-role-only", () => {
  assert.match(migration, /alter table private\.commerce_admin_idempotency_receipts enable row level security/i);
  assert.match(migration, /revoke all on table private\.commerce_admin_idempotency_receipts from public, anon, authenticated/i);
  assert.match(migration, /grant execute on function public\.manage_homepage_hero[\s\S]*to service_role/i);
});
