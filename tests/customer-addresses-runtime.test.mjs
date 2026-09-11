import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

const read = (path) => readFileSync(path, "utf8");
const contract = read("src/features/account/customer-address-contract.ts");
const service = read("src/features/account/customer-address-server.ts");
const request = read("src/features/account/customer-address-request.ts");
const panel = read("src/features/account/customer-addresses-panel.tsx");
const route = read("src/app/api/account/addresses/route.ts");
const page = read("src/app/account/page.tsx");

test("saved addresses remain behind an independent default-off gate", () => {
  assert.match(service, /COMMERCE_SAVED_ADDRESSES_ENABLED !== "true"/);
  assert.match(request, /COMMERCE_SAVED_ADDRESSES_ENABLED !== "true"/);
  assert.match(page, /COMMERCE_SAVED_ADDRESSES_ENABLED === "true"/);
});

test("address access uses verified identity and explicit ownership", () => {
  assert.match(service, /client\.auth\.getUser\(\)/);
  assert.match(service, /eq\("auth_user_id", data\.user\.id\)/);
  assert.match(service, /eq\("customer_id", context\.customerId\)/);
  assert.doesNotMatch(service, /service_role|SUPABASE_SECRET_KEY|user_metadata/);
});

test("address request validates inputs and same-origin writes", () => {
  assert.match(request, /customerAddressMutationSchema\.safeParse/);
  assert.match(request, /environment\.allowedOrigins\.has\(origin\)/);
  assert.match(request, /x-luminal-address-request/);
  assert.match(request, /Buffer\.byteLength\(text, "utf8"\) > MAX_BYTES/);
  assert.match(route, /force-dynamic/);
  assert.match(request, /private, no-store/);
  assert.match(contract, /\.strict\(\)/);
  assert.match(contract, /toUpperCase\(\)/);
});

test("address form keeps browser address semantics instead of disabling autocomplete", () => {
  for (const token of ["name", "tel", "address-level1", "address-level2", "address-line1", "postal-code", "country"]) {
    assert.match(panel, new RegExp(`"${token}"`));
  }
  assert.doesNotMatch(panel, /autoComplete="off"/);
});

test("address feature has no transactional commerce mutations", () => {
  for (const name of ["orders", "payments", "refunds", "inventory_items", "raffles", "raffle_entries"]) {
    assert.doesNotMatch(service + request, new RegExp(`\\.from\\("${name}"\\)`));
  }
});
