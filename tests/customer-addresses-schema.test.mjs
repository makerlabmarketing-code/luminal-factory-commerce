import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

const migrationPath = "supabase/migrations/20260908090700_create_customer_addresses.sql";
const sql = readFileSync(migrationPath, "utf8");

test("customer addresses are customer-owned, bounded and indexed", () => {
  assert.match(sql, /create table public\.customer_addresses/i);
  assert.match(sql, /customer_id uuid not null references public\.customers\(id\) on delete cascade/i);
  assert.match(sql, /length\(btrim\(label\)\) between 1 and 40/i);
  assert.match(sql, /length\(btrim\(recipient_name\)\) between 1 and 120/i);
  assert.match(sql, /length\(btrim\(phone\)\) between 3 and 32/i);
  assert.match(sql, /country_code = upper\(country_code\)/i);
  assert.match(sql, /customer_addresses_customer_idx/i);
  assert.match(sql, /customer_addresses_one_default_per_customer_uidx/i);
});

test("customer address table keeps anon closed and authenticated access behind RLS", () => {
  assert.match(sql, /alter table public\.customer_addresses enable row level security/i);
  assert.match(sql, /revoke all on table public\.customer_addresses from public, anon, authenticated/i);
  assert.match(sql, /grant select, insert, update, delete on table public\.customer_addresses to authenticated/i);
  assert.match(sql, /grant all on table public\.customer_addresses to service_role/i);
  assert.match(sql, /customers\.auth_user_id = \(select auth\.uid\(\)\)/i);
});

test("authenticated CRUD has complete ownership checks", () => {
  assert.match(sql, /create policy customer_addresses_select_own[\s\S]*for select[\s\S]*using/i);
  assert.match(sql, /create policy customer_addresses_insert_own[\s\S]*for insert[\s\S]*with check/i);
  assert.match(sql, /create policy customer_addresses_update_own[\s\S]*for update[\s\S]*using[\s\S]*with check/i);
  assert.match(sql, /create policy customer_addresses_delete_own[\s\S]*for delete[\s\S]*using/i);
});

test("saved-address slice does not mutate transactional commerce domains", () => {
  for (const table of ["inventory_items", "orders", "order_items", "payments", "refunds", "raffles", "raffle_entries"]) {
    assert.doesNotMatch(sql, new RegExp(`(?:insert\\s+into|update|delete\\s+from)\\s+public\\.${table}\\b`, "i"));
  }
  assert.doesNotMatch(sql, /security definer|user_metadata|raw_user_meta_data|http_request|net\.http/i);
});

test("address timestamps reuse the existing commerce trigger", () => {
  assert.match(sql, /create trigger customer_addresses_set_updated_at/i);
  assert.match(sql, /execute function public\.commerce_set_updated_at\(\)/i);
});
