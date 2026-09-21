import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

const migrationPath = "supabase/migrations/20260921001942_use_usd_for_cart.sql";
const migration = readFileSync(migrationPath, "utf8");
const normalizer = readFileSync("src/features/cart/cart-catalog-normalizer.ts", "utf8");
const runtimeFiles = [
  "src/features/cart/cart-page-contract.ts",
  "src/features/cart/cart-page-view.ts",
  "src/features/cart/customer-cart-service.ts",
  "src/features/cart/guest-cart-request.ts",
  "src/features/cart/guest-cart-service.ts",
  "src/lib/supabase/guest-cart-server.ts",
].map((path) => readFileSync(path, "utf8")).join("\n");

test("Cart migration changes the persisted invariant from VND to USD", () => {
  assert.match(migration, /update public\.carts[\s\S]+set currency = 'USD'[\s\S]+where currency = 'VND'/i);
  assert.match(migration, /alter column currency set default 'USD'/i);
  assert.match(migration, /carts_currency_check check \(currency = 'USD'\) not valid/i);
  assert.match(migration, /validate constraint carts_currency_check/i);
});

test("verified customer Cart RPCs remain invoker-only and emit USD", () => {
  for (const signature of [
    "read_verified_customer_cart\\(uuid\\)",
    "set_verified_customer_cart_line\\(uuid, text, uuid, uuid, integer\\)",
    "remove_verified_customer_cart_line\\(uuid, uuid, uuid\\)",
  ]) {
    assert.match(migration, new RegExp(`revoke execute on function public\\.${signature}\\s+from public, anon, authenticated`, "i"));
    assert.match(migration, new RegExp(`grant execute on function public\\.${signature}\\s+to service_role`, "i"));
  }
  assert.equal((migration.match(/security invoker/gi) ?? []).length, 3);
  assert.equal((migration.match(/set search_path = ''/gi) ?? []).length, 3);
  assert.doesNotMatch(migration, /security definer/i);
  assert.match(migration, /'currency', 'USD'/);
  assert.match(migration, /'active',\s+'USD'/);
});

test("Cart presentation treats 70 USD as 7000 cents", () => {
  assert.match(normalizer, /currency: z\.literal\("USD"\)/);
  assert.match(normalizer, /amountMinor \/ 100/);
  assert.match(normalizer, /currency: "USD"/);
  assert.doesNotMatch(runtimeFiles, /"VND"/);
});

test("USD migration does not expand transactional or browser authority", () => {
  assert.doesNotMatch(migration, /(?:insert into|update|delete from) public\.(?:products|product_prices|inventory_items|orders|payments|refunds|raffles|raffle_entries)/i);
  assert.doesNotMatch(migration, /create policy|grant (?:select|insert|update|delete|all) on table/i);
  assert.doesNotMatch(migration, /COMMERCE_[A-Z_]+\s*=\s*true/);
});
