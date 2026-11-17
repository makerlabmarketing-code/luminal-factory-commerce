import test from "node:test";
import assert from "node:assert/strict";
import { resolveRaffleHistory } from "../src/features/account/raffle-history-policy.ts";

const published = {
  title: "Meowhe",
  slug: "meowhe",
  is_test: false,
  is_published: true,
  results_published_at: null,
  status: "CLOSED",
};
const record = (overrides = {}) => ({
  id: "entry-1",
  created_at: "2026-11-01T00:00:00Z",
  raffles: { ...published, ...overrides },
});
const allocations = [{ raffle_entry_id: "entry-1", status: "PAYMENT_PENDING" }];
const now = Date.parse("2026-11-17T00:00:00Z");

test("does not leak selection before results have been published", () => {
  const items = resolveRaffleHistory([record()], allocations, now);
  assert.equal(items[0].outcome, "entered");
  assert.equal(items[0].fulfillmentStatus, null);
});

test("ignores release results scheduled for the future", () => {
  const items = resolveRaffleHistory(
    [record({ results_published_at: "2026-11-18T00:00:00Z" })],
    allocations,
    now,
  );
  assert.equal(items[0].outcome, "entered");
  assert.equal(items[0].fulfillmentStatus, null);
});

test("shows selected and fulfillment state only after publication", () => {
  const items = resolveRaffleHistory(
    [record({ results_published_at: "2026-11-16T00:00:00Z" })],
    allocations,
    now,
  );
  assert.equal(items[0].outcome, "selected");
  assert.equal(items[0].fulfillmentStatus, "PAYMENT_PENDING");
});

test("shows not selected when published results have no allocation", () => {
  const items = resolveRaffleHistory(
    [record({ results_published_at: "2026-11-16T00:00:00Z" })],
    [],
    now,
  );
  assert.equal(items[0].outcome, "not_selected");
});

test("excludes test and unpublished releases even if caller includes them", () => {
  const items = resolveRaffleHistory([
    record({ is_test: true }),
    record({ is_published: false }),
  ], allocations, now);
  assert.deepEqual(items, []);
});

test("does not expose shipping data from Raffle records", () => {
  const item = resolveRaffleHistory(
    [{ ...record(), address_line_1: "private", contact_email: "private@example.com" }],
    [], now,
  )[0];
  assert.equal("address_line_1" in item, false);
  assert.equal("contact_email" in item, false);
});

test("fails closed on invalid clock value", () => {
  assert.deepEqual(resolveRaffleHistory([record()], allocations, Number.NaN), []);
});
