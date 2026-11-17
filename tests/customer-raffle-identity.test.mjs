import test from "node:test";
import assert from "node:assert/strict";
import { resolveRaffleCustomerOwner } from "../src/features/account/raffle-customer-identity.ts";

const identity = {
  id: "auth-user-a", email: "Alice@Example.com",
  emailConfirmedAt: "2026-11-17T00:00:00Z",
};
const customer = {
  id: "customer-a", email: "alice@example.com", authUserId: "auth-user-a",
};

test("accepts only the exact Auth user bound to the verified customer", () => {
  assert.equal(resolveRaffleCustomerOwner(identity, customer), "customer-a");
});

test("rejects a different Auth user even when emails match", () => {
  assert.equal(resolveRaffleCustomerOwner(
    { ...identity, id: "auth-user-b" }, customer,
  ), null);
});

test("rejects unverified email even when customer ID and email match", () => {
  assert.equal(resolveRaffleCustomerOwner(
    { ...identity, emailConfirmedAt: null }, customer,
  ), null);
});

test("retains history after a verified account email change when auth ID is stable", () => {
  assert.equal(resolveRaffleCustomerOwner(
    { ...identity, email: "new@example.com" }, customer,
  ), "customer-a");
});

test("rejects missing identities, customers and empty emails", () => {
  assert.equal(resolveRaffleCustomerOwner(null, customer), null);
  assert.equal(resolveRaffleCustomerOwner(identity, null), null);
  assert.equal(resolveRaffleCustomerOwner(
    { ...identity, email: "" }, customer,
  ), null);
});
