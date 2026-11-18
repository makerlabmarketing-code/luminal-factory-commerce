import test from "node:test";
import assert from "node:assert/strict";
import { getVerifiedCustomerIdentity } from "../src/features/auth/verified-customer-identity.ts";

const user = {
  id: "auth-user-1",
  email: " Maker@Example.COM ",
  email_confirmed_at: "2026-11-18T00:00:00Z",
};

test("a verified Supabase Auth user resolves to a normalized customer identity", () => {
  assert.deepEqual(getVerifiedCustomerIdentity(user), {
    authUserId: "auth-user-1",
    email: "maker@example.com",
  });
});

test("OTP must match the exact normalized verified email", () => {
  assert.deepEqual(getVerifiedCustomerIdentity(user, "maker@example.com"), {
    authUserId: "auth-user-1",
    email: "maker@example.com",
  });
  assert.equal(getVerifiedCustomerIdentity(user, "other@example.com"), null);
  assert.equal(getVerifiedCustomerIdentity(user, "Maker@Example.COM"), null);
});

test("rejects unconfirmed, empty, or missing Supabase identities", () => {
  assert.equal(getVerifiedCustomerIdentity({ ...user, email_confirmed_at: null }), null);
  assert.equal(getVerifiedCustomerIdentity({ ...user, email: null }), null);
  assert.equal(getVerifiedCustomerIdentity({ ...user, email: " " }), null);
  assert.equal(getVerifiedCustomerIdentity({ ...user, id: "" }), null);
  assert.equal(getVerifiedCustomerIdentity(null), null);
});

test("never uses an email without confirmation even when caller expects the same email", () => {
  assert.equal(getVerifiedCustomerIdentity(
    { ...user, email_confirmed_at: null }, "maker@example.com"
  ), null);
});
