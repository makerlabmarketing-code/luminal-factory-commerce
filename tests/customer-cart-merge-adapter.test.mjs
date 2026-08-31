import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";
import { createSupabaseCustomerCartMergeRepository } from "../src/lib/supabase/customer-cart-merge-repository.ts";

const AUTH_USER_ID = "11111111-1111-4111-8111-111111111111";
const GUEST_TOKEN_HASH = "a".repeat(64);

function createClient(response) {
  const calls = [];
  return {
    calls,
    client: {
      async rpc(name, args) {
        calls.push({ name, args });
        if (response instanceof Error) throw response;
        return response;
      },
    },
  };
}

test("customer cart merge adapter calls only the generated fixed-signature RPC", async () => {
  const { client, calls } = createClient({
    data: [{ merge_state: "merged", unavailable_line_count: 2, capped_line_count: 1 }],
    error: null,
  });
  const repository = createSupabaseCustomerCartMergeRepository(client);

  assert.deepEqual(await repository.mergeGuestCart({
    authUserId: AUTH_USER_ID,
    verifiedEmail: "maker@example.com",
    guestTokenHash: GUEST_TOKEN_HASH,
  }), {
    state: "merged",
    unavailableLineCount: 2,
    cappedLineCount: 1,
  });
  assert.deepEqual(calls, [{
    name: "merge_verified_customer_guest_cart",
    args: {
      p_auth_user_id: AUTH_USER_ID,
      p_guest_token_hash: GUEST_TOKEN_HASH,
      p_verified_email: "maker@example.com",
    },
  }]);
});

test("customer cart merge adapter preserves generic unavailable and identity conflict states", async () => {
  for (const state of ["cart_unavailable", "identity_conflict"]) {
    const { client } = createClient({
      data: [{ merge_state: state, unavailable_line_count: 0, capped_line_count: 0 }],
      error: null,
    });
    const repository = createSupabaseCustomerCartMergeRepository(client);
    assert.deepEqual(await repository.mergeGuestCart({
      authUserId: AUTH_USER_ID,
      verifiedEmail: "maker@example.com",
      guestTokenHash: GUEST_TOKEN_HASH,
    }), { state });
  }
});

test("customer cart merge adapter fails closed on errors and malformed results", async () => {
  const responses = [
    { data: null, error: { code: "42501" } },
    { data: [], error: null },
    { data: [
      { merge_state: "merged", unavailable_line_count: 0, capped_line_count: 0 },
      { merge_state: "merged", unavailable_line_count: 0, capped_line_count: 0 },
    ], error: null },
    { data: [{ merge_state: "unknown", unavailable_line_count: 0, capped_line_count: 0 }], error: null },
    { data: [{ merge_state: "merged", unavailable_line_count: -1, capped_line_count: 0 }], error: null },
    new Error("private database detail"),
  ];

  for (const response of responses) {
    const { client } = createClient(response);
    const repository = createSupabaseCustomerCartMergeRepository(client);
    await assert.rejects(
      repository.mergeGuestCart({
        authUserId: AUTH_USER_ID,
        verifiedEmail: "maker@example.com",
        guestTokenHash: GUEST_TOKEN_HASH,
      }),
      /Customer cart merge persistence failed\./,
    );
  }
});

test("privileged client construction is server-only, triple-gated and scoped to the Auth route", () => {
  const server = readFileSync("src/lib/supabase/customer-cart-merge-server.ts", "utf8");
  const route = readFileSync("src/app/api/account/auth/route.ts", "utf8");
  const authProvider = readFileSync("src/lib/supabase/customer-auth-server.ts", "utf8");

  assert.match(server, /import "server-only"/);
  assert.match(server, /COMMERCE_CUSTOMER_AUTH_ENABLED/);
  assert.match(server, /COMMERCE_GUEST_CART_ENABLED/);
  assert.match(server, /COMMERCE_CUSTOMER_CART_MERGE_ENABLED/);
  assert.match(server, /SUPABASE_SECRET_KEY/);
  assert.doesNotMatch(server, /NEXT_PUBLIC_SUPABASE_(?:SECRET|SERVICE)/);
  assert.match(route, /getServerCustomerCartMergeService/);
  assert.match(route, /mergeGuestCart/);
  assert.doesNotMatch(authProvider, /getServerCustomerCartMergeService|mergeGuestCart/);
});
