import assert from "node:assert/strict";
import test from "node:test";
import { createCustomerCartService } from "../src/features/cart/customer-cart-service.ts";

const IDENTITY = {
  authUserId: "11111111-1111-4111-8111-111111111111",
  email: "Maker@Example.COM",
};
const PRODUCT_ID = "22222222-2222-4222-8222-222222222222";
const VARIANT_ID = "33333333-3333-4333-8333-333333333333";
const CART = {
  state: "cart",
  currency: "USD",
  expiresAt: "2026-10-19T12:00:00.000Z",
  lines: [{ productId: PRODUCT_ID, variantId: VARIANT_ID, requestedQuantity: 2 }],
  unavailableLineCount: 1,
};

test("customer cart is default-off before identity or repository work", async () => {
  let called = false;
  const service = createCustomerCartService({
    enabled: false,
    repository: { read: async () => { called = true; }, setLine: async () => {}, removeLine: async () => {} },
  });
  assert.deepEqual(await service.read(IDENTITY), { ok: false, code: "runtime_disabled" });
  assert.equal(called, false);
});

test("customer cart validates verified identity and maps bounded documents", async () => {
  const received = [];
  const service = createCustomerCartService({
    enabled: true,
    repository: {
      async read(authUserId) {
        received.push({ action: "read", authUserId });
        return CART;
      },
      async setLine(input) {
        received.push({ action: "set", input });
        return CART;
      },
      async removeLine(input) {
        received.push({ action: "remove", input });
        return { state: "empty", currency: "USD", lines: [], unavailableLineCount: 0 };
      },
    },
  });

  assert.deepEqual(await service.read(IDENTITY), {
    ok: true,
    cart: {
      currency: "USD",
      expiresAt: CART.expiresAt,
      lines: CART.lines,
      unavailableLineCount: 1,
    },
  });
  assert.equal((await service.setLine(IDENTITY, {
    productId: PRODUCT_ID,
    variantId: VARIANT_ID,
    requestedQuantity: 2,
  })).ok, true);
  assert.deepEqual(await service.removeLine(IDENTITY, {
    productId: PRODUCT_ID,
    variantId: VARIANT_ID,
  }), { ok: true, cart: null });
  assert.equal(received[1].input.verifiedEmail, "maker@example.com");
  assert.doesNotMatch(JSON.stringify(await service.read(IDENTITY)), /authUserId|email|customerId|cartId/);
});

test("customer cart preserves generic domain failures and rejects malformed output", async () => {
  for (const [document, expected] of [
    [{ state: "catalog_selection_unavailable" }, "catalog_selection_unavailable"],
    [{ state: "identity_conflict" }, "identity_conflict"],
    [{ state: "cart", currency: "USD", expiresAt: "invalid", lines: [], unavailableLineCount: 0 }, "runtime_unavailable"],
    [{ state: "cart", currency: "USD", expiresAt: CART.expiresAt, lines: Array(51).fill(CART.lines[0]), unavailableLineCount: 0 }, "runtime_unavailable"],
  ]) {
    const service = createCustomerCartService({
      enabled: true,
      repository: { read: async () => document, setLine: async () => document, removeLine: async () => document },
    });
    assert.deepEqual(await service.read(IDENTITY), { ok: false, code: expected });
  }
});

test("invalid identity, invalid line and repository exceptions fail closed", async () => {
  const service = createCustomerCartService({
    enabled: true,
    repository: {
      async read() { throw new Error("private detail"); },
      async setLine() { throw new Error("private detail"); },
      async removeLine() { throw new Error("private detail"); },
    },
  });
  assert.deepEqual(await service.read({ ...IDENTITY, authUserId: "request-controlled" }), {
    ok: false,
    code: "runtime_unavailable",
  });
  assert.deepEqual(await service.setLine(IDENTITY, {
    productId: PRODUCT_ID,
    variantId: null,
    requestedQuantity: 100,
  }), { ok: false, code: "runtime_unavailable" });
  assert.deepEqual(await service.read(IDENTITY), { ok: false, code: "runtime_unavailable" });
});
