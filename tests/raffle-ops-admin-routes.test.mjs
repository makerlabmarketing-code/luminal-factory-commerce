import assert from "node:assert/strict";
import { existsSync, readFileSync } from "node:fs";
import test from "node:test";

const read = (path) => readFileSync(path, "utf8");

test("Raffle Ops management exposes entries, winner, payment, fulfillment and result boundaries", () => {
  const expected = [
    "src/app/api/admin/v1/raffles/[id]/entries/route.ts",
    "src/app/api/admin/v1/raffles/[id]/winner-allocations/route.ts",
    "src/app/api/admin/v1/raffles/[id]/winner-allocations/[allocationId]/confirm/route.ts",
    "src/app/api/admin/v1/raffles/[id]/winner-allocations/[allocationId]/confirm-payment/route.ts",
    "src/app/api/admin/v1/raffles/[id]/winner-allocations/[allocationId]/fulfillment/route.ts",
    "src/app/api/admin/v1/raffles/[id]/winner-allocations/[allocationId]/complete/route.ts",
    "src/app/api/admin/v1/raffles/[id]/winner-allocations/[allocationId]/cancel/route.ts",
    "src/app/api/admin/v1/raffles/[id]/winner-allocations/[allocationId]/reallocate/route.ts",
    "src/app/api/admin/v1/raffles/[id]/results/publish/route.ts",
  ];
  for (const path of expected) assert.equal(existsSync(path), true, path);
});

test("Raffle Ops routes require least-privilege scopes", () => {
  assert.match(read("src/app/api/admin/v1/raffles/[id]/entries/route.ts"), /commerce\.raffle\.entry\.read/);
  assert.match(read("src/app/api/admin/v1/raffles/[id]/winner-allocations/route.ts"), /commerce\.raffle\.winner\.manage/);
  assert.match(read("src/app/api/admin/v1/raffles/[id]/winner-allocations/[allocationId]/confirm-payment/route.ts"), /commerce\.raffle\.payment\.manage/);
  assert.match(read("src/app/api/admin/v1/raffles/[id]/winner-allocations/[allocationId]/fulfillment/route.ts"), /commerce\.raffle\.fulfillment\.manage/);
  assert.match(read("src/app/api/admin/v1/raffles/[id]/results/publish/route.ts"), /commerce\.raffle\.result\.publish/);
});

test("Winner persistence stays Commerce-owned and server-only", () => {
  const migration = read("supabase/migrations/20260922074248_add_raffle_ops_admin_rpcs.sql");
  assert.match(migration, /private\.commerce_admin_idempotency_receipts/);
  assert.match(migration, /manage_raffle_winner_allocation/);
  assert.match(migration, /manual_bank_transfer/);
  assert.match(migration, /private\.order_shipping_addresses/);
  assert.match(migration, /order_paid/);
  assert.match(migration, /publish_raffle_result/);
  assert.match(migration, /revoke execute[\s\S]*anon, authenticated/i);
});

test("Private raffle test and Home raffle remain default-off", () => {
  const env = read(".env.example");
  assert.match(env, /COMMERCE_HOME_RAFFLE_ENABLED=false/);
  assert.match(env, /COMMERCE_RAFFLE_TEST_ENABLED=false/);
  assert.match(env, /COMMERCE_RAFFLE_TEST_ACCESS_TOKEN=/);
});
