import assert from "node:assert/strict";
import fs from "node:fs";
import test from "node:test";

const migrationPath = "supabase/migrations/20260813103758_create_guest_cart_foundation.sql";
const sql = fs.readFileSync(migrationPath, "utf8");
const executableSql = sql.replace(/^--.*$/gm, "");

for (const table of ["carts", "cart_items"]) {
  test(`creates default-deny ${table}`, () => {
    assert.match(sql, new RegExp(`create table public\\.${table}\\b`, "i"));
    assert.match(sql, new RegExp(`alter table public\\.${table} enable row level security`, "i"));
  });
}

test("stores only a fixed-length guest token hash", () => {
  assert.match(sql, /guest_token_hash bytea/i);
  assert.match(sql, /octet_length\(guest_token_hash\) = 32/i);
  assert.doesNotMatch(sql, /\bguest_token\s+(text|bytea)/i);
});

test("enforces one active cart ownership mode", () => {
  assert.match(sql, /constraint carts_owner_mode_check/i);
  assert.match(sql, /\(customer_id is null\) <> \(guest_token_hash is null\)/i);
  assert.match(sql, /status <> 'active'[\s\S]*guest_token_hash is null/i);
  assert.match(sql, /carts_active_customer_uidx[\s\S]*status = 'active'/i);
});

test("uses the approved guest cart retention boundary", () => {
  assert.match(sql, /expires_at timestamptz not null default \(now\(\) \+ interval '30 days'\)/i);
  assert.match(sql, /carts_status_expiry_idx/i);
});

test("keeps cart lines bounded and de-duplicated", () => {
  assert.match(sql, /requested_quantity between 1 and 99/i);
  assert.match(sql, /cart_items_cart_variant_uidx/i);
  assert.match(sql, /cart_items_cart_product_no_variant_uidx/i);
});

test("keeps client roles default-deny", () => {
  assert.match(
    sql,
    /revoke all on table public\.carts, public\.cart_items from public, anon, authenticated;/i,
  );
  assert.doesNotMatch(sql, /create policy/i);
  assert.doesNotMatch(sql, /grant [^;]+ to (anon|authenticated)/i);
  assert.match(
    sql,
    /grant select, insert, update, delete on table public\.carts, public\.cart_items to service_role;/i,
  );
});

test("does not add PII or transaction authority to carts", () => {
  for (const forbiddenColumn of [
    "email",
    "full_name",
    "phone",
    "address",
    "price_minor",
    "stock",
    "payment",
    "order_id",
  ]) {
    assert.doesNotMatch(executableSql, new RegExp(`\\b${forbiddenColumn}\\b`, "i"));
  }

  assert.doesNotMatch(executableSql, /security definer/i);
  assert.doesNotMatch(executableSql, /auth\.users|auth\.uid\(\)/i);
});
