import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";
import { createCustomerCartMergeService } from "../src/features/cart/customer-cart-merge.ts";
import { createGuestCartToken, hashGuestCartToken } from "../src/features/cart/guest-cart-service.ts";

const AUTH_USER_ID = "11111111-1111-4111-8111-111111111111";

function createRepository(result = {
  state: "merged",
  unavailableLineCount: 0,
  cappedLineCount: 0,
}) {
  const calls = [];
  return {
    calls,
    repository: {
      async mergeGuestCart(input) {
        calls.push(input);
        if (result instanceof Error) throw result;
        return result;
      },
    },
  };
}

test("customer cart merge is default-off before identity, token or persistence work", async () => {
  const { repository, calls } = createRepository();
  const service = createCustomerCartMergeService({
    enabled: false,
    repository,
    hashGuestToken: hashGuestCartToken,
  });
  assert.deepEqual(await service.merge({ authUserId: "invalid", email: "invalid" }, "invalid"), {
    ok: false,
    code: "runtime_disabled",
  });
  assert.equal(calls.length, 0);
});

test("enabled merge fails closed without its atomic repository", async () => {
  const service = createCustomerCartMergeService({ enabled: true });
  assert.deepEqual(await service.merge({ authUserId: AUTH_USER_ID, email: "maker@example.com" }, undefined), {
    ok: false,
    code: "runtime_unavailable",
  });
});

test("verified login without a guest cookie creates no customer or empty cart", async () => {
  const { repository, calls } = createRepository();
  const service = createCustomerCartMergeService({
    enabled: true,
    repository,
    hashGuestToken: hashGuestCartToken,
  });
  assert.deepEqual(await service.merge({ authUserId: AUTH_USER_ID, email: "maker@example.com" }, undefined), {
    ok: true,
    state: "no_guest_cart",
  });
  assert.equal(calls.length, 0);
});

test("merge validates verified identity, normalizes contact email and hashes the guest credential", async () => {
  const guestToken = createGuestCartToken();
  const { repository, calls } = createRepository({
    state: "merged",
    unavailableLineCount: 2,
    cappedLineCount: 1,
  });
  const service = createCustomerCartMergeService({
    enabled: true,
    repository,
    hashGuestToken: hashGuestCartToken,
  });
  assert.deepEqual(await service.merge({ authUserId: AUTH_USER_ID, email: "Maker@Example.COM" }, guestToken), {
    ok: true,
    state: "merged",
    unavailableLineCount: 2,
    cappedLineCount: 1,
  });
  assert.deepEqual(calls, [{
    authUserId: AUTH_USER_ID,
    verifiedEmail: "maker@example.com",
    guestTokenHash: hashGuestCartToken(guestToken),
  }]);
  assert.doesNotMatch(JSON.stringify(calls), new RegExp(guestToken));

  for (const identity of [
    { authUserId: "invalid", email: "maker@example.com" },
    { authUserId: AUTH_USER_ID, email: "invalid" },
  ]) {
    assert.deepEqual(await service.merge(identity, guestToken), {
      ok: false,
      code: "runtime_unavailable",
    });
  }
  assert.equal(calls.length, 1);
});

test("invalid, unknown and cross-subject guest credentials remain non-enumerating", async () => {
  const unavailable = createRepository({ state: "cart_unavailable" });
  const service = createCustomerCartMergeService({
    enabled: true,
    repository: unavailable.repository,
    hashGuestToken: hashGuestCartToken,
  });
  assert.deepEqual(await service.merge({ authUserId: AUTH_USER_ID, email: "maker@example.com" }, "invalid"), {
    ok: false,
    code: "cart_unavailable",
  });
  assert.deepEqual(await service.merge(
    { authUserId: AUTH_USER_ID, email: "maker@example.com" },
    createGuestCartToken(),
  ), {
    ok: false,
    code: "cart_unavailable",
  });
});

test("identity conflicts and persistence failures fail closed without private identifiers", async () => {
  const guestToken = createGuestCartToken();
  const conflict = createRepository({ state: "identity_conflict" });
  const conflictService = createCustomerCartMergeService({
    enabled: true,
    repository: conflict.repository,
    hashGuestToken: hashGuestCartToken,
  });
  assert.deepEqual(await conflictService.merge(
    { authUserId: AUTH_USER_ID, email: "maker@example.com" },
    guestToken,
  ), {
    ok: false,
    code: "identity_conflict",
  });

  const failed = createRepository(new Error("private persistence detail"));
  const failedService = createCustomerCartMergeService({
    enabled: true,
    repository: failed.repository,
    hashGuestToken: hashGuestCartToken,
  });
  assert.deepEqual(await failedService.merge(
    { authUserId: AUTH_USER_ID, email: "maker@example.com" },
    guestToken,
  ), {
    ok: false,
    code: "runtime_unavailable",
  });
});

test("malformed persistence counts are rejected and merge authority stays narrow", async () => {
  const malformed = createRepository({
    state: "merged",
    unavailableLineCount: -1,
    cappedLineCount: Number.NaN,
  });
  const service = createCustomerCartMergeService({
    enabled: true,
    repository: malformed.repository,
    hashGuestToken: hashGuestCartToken,
  });
  assert.deepEqual(await service.merge(
    { authUserId: AUTH_USER_ID, email: "maker@example.com" },
    createGuestCartToken(),
  ), {
    ok: false,
    code: "runtime_unavailable",
  });

  const source = readFileSync("src/features/cart/customer-cart-merge.ts", "utf8");
  assert.match(source, /hashGuestToken/);
  assert.doesNotMatch(source, /inventory_items|orders|payments|refunds|raffle|user_metadata|console\./);
});
