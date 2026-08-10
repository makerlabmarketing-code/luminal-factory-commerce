import assert from "node:assert/strict";
import fs from "node:fs";
import test from "node:test";

const migrationPath = "supabase/migrations/20260810044500_create_commerce_core.sql";
const sql = fs.readFileSync(migrationPath, "utf8");

const requiredTables = [
  "products",
  "product_variants",
  "product_media",
  "product_prices",
  "inventory_items",
  "raffles",
  "customers",
  "orders",
  "order_items",
  "payments",
  "refunds",
  "commerce_events",
];

for (const table of requiredTables) {
  test(`creates ${table}`, () => {
    assert.match(sql, new RegExp(`create table public\\.${table}\\b`, "i"));
    assert.match(sql, new RegExp(`alter table public\\.${table} enable row level security`, "i"));
  });
}

test("keeps payment status derived from payments and refunds", () => {
  assert.match(sql, /create or replace view public\.order_payment_summary/i);
  assert.match(sql, /payment_status/i);
  assert.doesNotMatch(sql, /create table public\.orders[\s\S]*?payment_status\s+text/i);
});

test("does not publicly grant sensitive commerce tables", () => {
  const publicGrantLine = sql.match(/grant select on table ([^;]+) to anon, authenticated;/i)?.[1] ?? "";
  for (const sensitive of ["inventory_items", "customers", "orders", "order_items", "payments", "refunds", "commerce_events"]) {
    assert.doesNotMatch(publicGrantLine, new RegExp(`public\\.${sensitive}\\b`, "i"));
  }
});

test("raffle persistence is presentation metadata only", () => {
  for (const forbiddenTable of ["raffle_entries", "raffle_participants", "raffle_tickets", "raffle_winners", "raffle_draws"]) {
    assert.doesNotMatch(sql, new RegExp(`create table public\\.${forbiddenTable}\\b`, "i"));
  }
});

test("uses integer minor units for money", () => {
  assert.match(sql, /amount_minor bigint/i);
  assert.doesNotMatch(sql, /\b(real|double precision|money)\b/i);
});
