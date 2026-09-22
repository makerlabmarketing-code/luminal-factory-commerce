import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

const read = (path) => readFileSync(path, "utf8");
const forward = read("specs/raffle/sql/20260922_raffle_erp_lifecycle_forward.sql");
const rollback = read("specs/raffle/sql/20260922_raffle_erp_lifecycle_rollback.sql");
const validation = read("specs/raffle/sql/20260922_raffle_erp_lifecycle_validation.sql");

test("raffle ERP schema draft isolates entrant and order shipping PII", () => {
  assert.match(forward, /private\.raffle_entry_shipping_addresses/);
  assert.match(forward, /private\.order_shipping_addresses/);
  assert.match(forward, /enable row level security/i);
  assert.match(forward, /revoke all[\s\S]*anon, authenticated/i);
  assert.match(forward, /country_code char\(2\)/);
});

test("test raffles are excluded from the public raffle policy", () => {
  assert.match(forward, /add column is_test boolean not null default false/);
  assert.match(forward, /not is_test[\s\S]*is_published/);
});

test("winner allocation is separate from entries and keeps transition evidence", () => {
  assert.match(forward, /create table public\.raffle_winner_allocations/);
  assert.match(forward, /raffle_entry_id uuid not null references public\.raffle_entries/);
  assert.match(forward, /PAYMENT_PENDING/);
  assert.match(forward, /REALLOCATED/);
  assert.match(forward, /create table public\.raffle_winner_allocation_events/);
  assert.match(forward, /order_id uuid unique references public\.orders/);
});

test("v2 guest entry keeps the existing entry boundary and adds shipping atomically", () => {
  assert.match(forward, /submit_guest_raffle_entry_v2/);
  assert.match(forward, /from public\.submit_guest_raffle_entry/);
  assert.match(forward, /insert into private\.raffle_entry_shipping_addresses/);
  assert.match(forward, /grant execute[\s\S]*service_role/);
  assert.match(forward, /revoke execute[\s\S]*anon, authenticated/);
});

test("rollback refuses destructive cleanup after live lifecycle rows exist", () => {
  assert.match(rollback, /rollback refused: live rows exist/);
  assert.match(rollback, /drop function if exists public\.submit_guest_raffle_entry_v2/);
  assert.match(validation, /has_function_privilege\('anon'/);
  assert.match(validation, /winner_allocations/);
  assert.match(validation, /entry_shipping/);
});
