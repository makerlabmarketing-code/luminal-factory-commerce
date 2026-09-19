import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

const migrationPath = "supabase/migrations/20260919123447_verified_customer_cart_boundary.sql";
const sql = readFileSync(migrationPath, "utf8");

test("customer cart RPCs are fixed, invoker-only and service-role-only", () => {
  for (const signature of [
    "read_verified_customer_cart\\(uuid\\)",
    "set_verified_customer_cart_line\\(uuid, text, uuid, uuid, integer\\)",
    "remove_verified_customer_cart_line\\(uuid, uuid, uuid\\)",
  ]) {
    assert.match(sql, new RegExp(`revoke execute on function public\\.${signature}\\s+from public, anon, authenticated`, "i"));
    assert.match(sql, new RegExp(`grant execute on function public\\.${signature}\\s+to service_role`, "i"));
  }
  assert.equal((sql.match(/security invoker/gi) ?? []).length, 4);
  assert.equal((sql.match(/set search_path = ''/gi) ?? []).length, 4);
  assert.doesNotMatch(sql, /security definer/i);
});

test("customer cart ownership is subject-scoped and never request-email scoped", () => {
  assert.match(sql, /customers\.auth_user_id = p_auth_user_id/);
  assert.match(sql, /lower\(btrim\(customers\.email\)\) = p_verified_email/);
  assert.match(sql, /customers\.auth_user_id is distinct from p_auth_user_id/);
  assert.doesNotMatch(sql, /where customers\.email = p_verified_email/i);
  assert.match(sql, /customer-cart-merge-auth:/);
});

test("reads are bounded and writes preserve cart/catalog lifecycle", () => {
  assert.match(sql, /available_position <= 50/);
  assert.match(sql, /carts\.expires_at > v_now/);
  assert.match(sql, /set status = 'expired'/);
  assert.match(sql, /interval '30 days'/);
  assert.match(sql, /products\.status = 'published'/);
  assert.match(sql, /variants\.product_id = products\.id/);
  assert.match(sql, /requested_quantity/);
  assert.doesNotMatch(
    sql,
    /(?:insert into|update|delete from)\s+public\.(?:inventory_items|orders|payments|refunds|raffles|raffle_entries)/i,
  );
});

test("migration does not open cart tables to browser roles", () => {
  assert.doesNotMatch(sql, /create policy[\s\S]+on public\.(?:carts|cart_items)/i);
  assert.doesNotMatch(sql, /grant [^;]+ on (?:table )?public\.(?:carts|cart_items)[^;]+to (?:anon|authenticated)/i);
});
