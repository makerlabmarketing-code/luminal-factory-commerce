import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

const guestServer = readFileSync("src/lib/supabase/guest-cart-server.ts", "utf8");
const migration = readFileSync(
  "supabase/migrations/20260924030000_enforce_cart_raffle_product_boundary.sql",
  "utf8",
);
const smoke = readFileSync(
  "specs/cart/customer-cart-integrated-production-smoke-runbook.md",
  "utf8",
);

test("guest cart rejects artisan keycaps before line persistence", () => {
  assert.match(guestServer, /select\("id,product_type"\)/);
  assert.match(guestServer, /product\.product_type === "artisan_keycap"/);
});

test("database rejects artisan keycaps and customer-cart RPC returns unavailable", () => {
  assert.match(migration, /cart_items_reject_artisan_keycap/);
  assert.match(migration, /before insert or update of product_id on public\.cart_items/i);
  assert.match(migration, /products\.product_type = 'artisan_keycap'/);
  assert.match(migration, /products\.product_type <> 'artisan_keycap'/);
  assert.match(migration, /catalog_selection_unavailable/);
  assert.match(migration, /private\.verified_customer_cart_document/);
  assert.match(migration, /merge_verified_customer_guest_cart/);
  assert.match(migration, /v_unavailable := v_unavailable \+ 1/);
  assert.doesNotMatch(
    migration,
    /(?:insert into|update|delete from)\s+public\.(?:inventory_items|orders|payments|refunds|raffles|raffle_entries)/i,
  );
});

test("integrated cart smoke requires a non-keycap cart product", () => {
  assert.match(smoke, /artisan keycap/i);
  assert.match(smoke, /raffle/i);
  assert.match(smoke, /non-keycap/i);
});
