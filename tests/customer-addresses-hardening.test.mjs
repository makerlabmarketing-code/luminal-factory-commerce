import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

const hardening = readFileSync("supabase/migrations/20260911042616_harden_customer_addresses.sql", "utf8");
const server = readFileSync("src/features/account/customer-address-server.ts", "utf8");
const request = readFileSync("src/features/account/customer-address-request.ts", "utf8");
const panel = readFileSync("src/features/account/customer-addresses-panel.tsx", "utf8");

test("customer lookup exposes only the authenticated customer's identifier columns", () => {
  assert.match(hardening, /grant select \(id, auth_user_id\) on table public\.customers to authenticated/i);
  assert.match(hardening, /create policy customers_select_own_identifier[\s\S]*auth_user_id = \(select auth\.uid\(\)\)/i);
  assert.doesNotMatch(hardening, /grant select on table public\.customers to authenticated/i);
});

test("address count is database-bounded and serialized per customer", () => {
  assert.match(hardening, /pg_advisory_xact_lock\(hashtextextended\(new\.customer_id::text, 0\)\)/i);
  assert.match(hardening, /if address_count >= 10 then/i);
  assert.match(hardening, /errcode = '23514'/i);
  assert.match(server, /\.limit\(10\)/i);
  assert.match(panel, /MAX_SAVED_ADDRESSES = 10/i);
});

test("default-address selection is atomic and the first address becomes default", () => {
  assert.match(hardening, /if address_count = 0 then[\s\S]*new\.is_default := true/i);
  assert.match(hardening, /if new\.is_default then[\s\S]*update public\.customer_addresses[\s\S]*set is_default = false/i);
  assert.match(hardening, /before insert or update of customer_id, is_default on public\.customer_addresses/i);
  assert.match(request, /setDefaultCustomerAddress\(body\.id\)/i);
  assert.match(panel, /action: "set_default"/i);
});

test("deleting a default address promotes the oldest remaining address", () => {
  assert.match(hardening, /create trigger customer_addresses_reassign_default/i);
  assert.match(hardening, /after delete on public\.customer_addresses/i);
  assert.match(hardening, /order by created_at asc, id asc/i);
});

test("hardening stays outside transactional commerce domains", () => {
  for (const table of ["inventory_items", "orders", "order_items", "payments", "refunds", "raffles", "raffle_entries"]) {
    assert.doesNotMatch(hardening, new RegExp(`(?:insert\\s+into|update|delete\\s+from)\\s+public\\.${table}\\b`, "i"));
  }
  assert.doesNotMatch(hardening, /security definer|user_metadata|raw_user_meta_data|http_request|net\.http/i);
});
