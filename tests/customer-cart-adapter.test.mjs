import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";
import { createSupabaseCustomerCartRepository } from "../src/lib/supabase/customer-cart-repository.ts";

const AUTH_USER_ID = "11111111-1111-4111-8111-111111111111";
const PRODUCT_ID = "22222222-2222-4222-8222-222222222222";

function createClient(data = { state: "empty", currency: "VND", lines: [], unavailableLineCount: 0 }) {
  const calls = [];
  return {
    calls,
    client: {
      async rpc(name, args) {
        calls.push({ name, args });
        return data instanceof Error ? Promise.reject(data) : { data, error: null };
      },
    },
  };
}

test("customer cart adapter calls only the three fixed RPC signatures", async () => {
  const { client, calls } = createClient();
  const repository = createSupabaseCustomerCartRepository(client);
  await repository.read(AUTH_USER_ID);
  await repository.setLine({
    authUserId: AUTH_USER_ID,
    verifiedEmail: "maker@example.com",
    productId: PRODUCT_ID,
    variantId: null,
    requestedQuantity: 3,
  });
  await repository.removeLine({ authUserId: AUTH_USER_ID, productId: PRODUCT_ID, variantId: null });
  assert.deepEqual(calls.map((call) => call.name), [
    "read_verified_customer_cart",
    "set_verified_customer_cart_line",
    "remove_verified_customer_cart_line",
  ]);
  assert.deepEqual(calls[0].args, { p_auth_user_id: AUTH_USER_ID });
  assert.equal(calls[1].args.p_verified_email, "maker@example.com");
  assert.equal(calls[1].args.p_requested_quantity, 3);
  assert.equal(calls[2].args.p_product_id, PRODUCT_ID);
});

test("customer cart adapter fails closed on RPC errors and missing output", async () => {
  for (const response of [
    { data: null, error: { code: "42501" } },
    { data: undefined, error: null },
  ]) {
    const repository = createSupabaseCustomerCartRepository({ async rpc() { return response; } });
    await assert.rejects(repository.read(AUTH_USER_ID), /Customer cart persistence failed/);
  }
  const thrown = createSupabaseCustomerCartRepository({ async rpc() { throw new Error("private"); } });
  await assert.rejects(thrown.read(AUTH_USER_ID), /private/);
});

test("server identity and privileged adapters remain fresh-user, server-only and independently gated", () => {
  const identity = readFileSync("src/lib/supabase/customer-cart-identity-server.ts", "utf8");
  const server = readFileSync("src/lib/supabase/customer-cart-server.ts", "utf8");
  const proxy = readFileSync("src/proxy.ts", "utf8");
  assert.match(identity, /import "server-only"/);
  assert.match(identity, /auth\.getUser\(\)/);
  assert.match(identity, /isAuthSessionMissingError/);
  assert.doesNotMatch(identity, /getSession\(|user_metadata/);
  assert.match(server, /COMMERCE_CUSTOMER_AUTH_ENABLED/);
  assert.match(server, /COMMERCE_CUSTOMER_CART_ENABLED/);
  assert.match(server, /SUPABASE_SECRET_KEY/);
  assert.doesNotMatch(server, /NEXT_PUBLIC_SUPABASE_(?:SECRET|SERVICE)/);
  assert.match(proxy, /"\/api\/cart"/);
});
