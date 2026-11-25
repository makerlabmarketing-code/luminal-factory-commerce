import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { createRequire } from "node:module";
import test from "node:test";
import ts from "typescript";

const requireModule = createRequire(import.meta.url);
const source = readFileSync("src/app/api/admin/v1/raffles/[id]/winner-allocations/[allocationId]/complete/route.ts", "utf8");
const compiled = ts.transpileModule(source, { compilerOptions: { module: ts.ModuleKind.CommonJS } }).outputText;
const id = "550e8400-e29b-41d4-a716-446655440000";
const allocationId = "550e8400-e29b-41d4-a716-446655440001";
const request = new Request("https://commerce.example");
const params = { params: Promise.resolve({ id, allocationId }) };

function load({ data = null, deny = false, error = null } = {}) {
  const calls = [];
  const query = {
    select: (...args) => { calls.push(["select", ...args]); return query; },
    eq: (...args) => { calls.push(["eq", ...args]); return query; },
    order: () => query,
    limit: count => { calls.push(["limit", count]); return query; },
    maybeSingle: async () => ({ data, error }),
  };
  const runtime = {
    authorizeCommerceAdminRoute: async (_request, scopes) => {
      assert.deepEqual(scopes, ["commerce.raffle.fulfillment.manage"]);
      return deny ? new Response(null, { status: 401 }) : {
        identity: { requestId: id },
        privilegedClient: { from: table => { calls.push(["from", table]); return query; } },
      };
    },
    commerceAdminSuccess: body => Response.json(body, { headers: { "Cache-Control": "no-store" } }),
    commerceAdminFailure: (_id, status) => new Response(null, { status }),
  };
  const resolved = {
    "@/features/management/commerce-admin-route-runtime": runtime,
    "@/features/management/raffle-ops-admin-contract": {},
    "@/features/management/raffle-ops-admin-service": {},
  };
  const route = { exports: {} };
  new Function("require", "exports", compiled)(name => resolved[name] ?? requireModule(name), route.exports);
  return { get: route.exports.GET, calls };
}

test("dispatch read checks scope and identifiers before querying", async () => {
  const blocked = load({ deny: true });
  assert.equal((await blocked.get(request, params)).status, 401);
  assert.equal(blocked.calls.length, 0);
  const invalid = load();
  assert.equal((await invalid.get(request, { params: Promise.resolve({ id, allocationId: "invalid" }) })).status, 400);
  assert.equal(invalid.calls.length, 0);
});

test("dispatch read projects only the latest completed event scoped to both IDs", async () => {
  const data = { note: "Carrier / TRACK-123", created_at: "2026-11-25T04:00:00Z", actor_id: "internal" };
  const { get, calls } = load({ data });
  const response = await get(request, params);
  assert.equal(response.headers.get("cache-control"), "no-store");
  assert.deepEqual(await response.json(), { tracking: { note: data.note, completedAt: data.created_at } });
  assert.deepEqual(calls, [["from", "raffle_winner_allocation_events"], ["select", "note,created_at"],
    ["eq", "allocation_id", allocationId], ["eq", "raffle_id", id], ["eq", "event_type", "completed"], ["limit", 1]]);
  assert.deepEqual(await (await load().get(request, params)).json(), { tracking: null });
  assert.equal((await load({ error: {} }).get(request, params)).status, 503);
});
