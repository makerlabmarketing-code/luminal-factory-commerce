import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import ts from "typescript";

const origin = "https://luminalfactory.com";
const preview = "https://preview.luminalfactory.com";
const calls = [];
const runtime = { env: { COMMERCE_SAVED_ADDRESSES_ENABLED: "true" } };
const source = ts.transpileModule(
  readFileSync("src/features/account/customer-address-request.ts", "utf8"),
  { compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022 } },
).outputText;
const mod = { exports: {} };
new Function("require", "module", "exports", "process", source)((name) => {
  if (name === "server-only") return {};
  if (name === "zod") return { z: { ZodError: class extends Error {} } };
  if (name === "@/features/auth/customer-auth-request") {
    return { getCustomerAuthEnvironment: () => ({
      ready: true, allowedOrigins: new Set([origin, preview]),
    }) };
  }
  if (name === "@/features/account/customer-address-contract") {
    return { customerAddressMutationSchema: {
      safeParse: body => ({ success: true, data: body }),
    } };
  }
  if (name === "@/features/account/customer-address-server") {
    return {
      listCustomerAddresses: async () => { calls.push("list"); return []; },
      saveCustomerAddress: async () => { calls.push("save"); },
      deleteCustomerAddress: async () => { calls.push("delete"); },
      setDefaultCustomerAddress: async () => { calls.push("default"); },
    };
  }
  throw new Error("Unexpected request dependency: " + name);
}, mod, mod.exports, runtime);
const { handleAddressRequest } = mod.exports;

function request(method = "POST", opts = {}) {
  const headers = {
    origin: opts.origin ?? origin,
    "sec-fetch-site": opts.site ?? "same-origin",
    "x-luminal-address-request": "1",
    "content-type": "application/json",
    ...opts.headers,
  };
  return new Request((opts.urlOrigin ?? origin) + "/api/account/addresses", {
    method,
    headers,
    ...(method === "POST" ? { body: JSON.stringify({ action: "delete", id: "a" }) } : {}),
  });
}

test("address mutation accepts only its actual request origin, not another allowlisted origin", async () => {
  calls.length = 0;
  const denied = await handleAddressRequest(request("POST", { origin: preview }));
  assert.equal(denied.status, 403);
  assert.deepEqual(calls, []);
  const allowed = await handleAddressRequest(request());
  assert.equal(allowed.status, 200);
  assert.deepEqual(calls, ["delete"]);
});

test("address endpoint rejects cross-host GET origins but allows browser GET without Origin", async () => {
  calls.length = 0;
  const denied = await handleAddressRequest(request("GET", { origin: preview }));
  assert.equal(denied.status, 403);
  assert.deepEqual(calls, []);
  const noOrigin = request("GET");
  noOrigin.headers.delete("origin");
  const allowed = await handleAddressRequest(noOrigin);
  assert.equal(allowed.status, 200);
  assert.deepEqual(calls, ["list"]);
});

test("address mutation rejects invalid and oversized declared request lengths before any write", async () => {
  for (const value of ["invalid", "-1", "1.5", "Infinity", "999999999999999999"]) {
    calls.length = 0;
    const response = await handleAddressRequest(request("POST", { headers: { "content-length": value } }));
    assert.ok(response.status === 400 || response.status === 413);
    assert.deepEqual(calls, []);
  }
});

test("address feature flag still fails closed even on a valid request", async () => {
  runtime.env.COMMERCE_SAVED_ADDRESSES_ENABLED = "false";
  try {
    calls.length = 0;
    const response = await handleAddressRequest(request());
    assert.equal(response.status, 404);
    assert.deepEqual(calls, []);
  } finally {
    runtime.env.COMMERCE_SAVED_ADDRESSES_ENABLED = "true";
  }
});
