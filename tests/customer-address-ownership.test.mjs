import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { createRequire } from "node:module";
import ts from "typescript";

const require = createRequire(import.meta.url);
const users = {
  alice: { id: "auth-a", email: "alice@example.com", email_confirmed_at: "2026-11-18T00:00:00Z" },
  bob: { id: "auth-b", email: "bob@example.com", email_confirmed_at: "2026-11-18T00:00:00Z" },
};
let currentUser = users.alice;
const customers = [
  { id: "customer-a", auth_user_id: "auth-a" },
  { id: "customer-b", auth_user_id: "auth-b" },
];
const addresses = [
  { id: "address-a", customer_id: "customer-a", label: "Alice private address" },
  { id: "address-b", customer_id: "customer-b", label: "Bob private address" },
];
const queries = [];

function selectFrom(table) {
  const conditions = {};
  const builder = {
    select() { return builder; },
    eq(column, value) { conditions[column] = value; return builder; },
    order() { return builder; },
    async maybeSingle() {
      queries.push({ table, conditions: { ...conditions } });
      return { data: customers.find(row => Object.entries(conditions).every(([k, v]) => row[k] === v)) ?? null, error: null };
    },
    async limit() {
      queries.push({ table, conditions: { ...conditions } });
      return { data: addresses.filter(row => Object.entries(conditions).every(([k, v]) => row[k] === v)), error: null };
    },
  };
  return builder;
}
const client = {
  auth: { async getUser() { return { data: { user: currentUser }, error: null }; } },
  from: selectFrom,
};
const compiled = ts.transpileModule(readFileSync("src/features/account/customer-address-server.ts", "utf8"), {
  compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022, esModuleInterop: true },
}).outputText;
const mod = { exports: {} };
new Function("require", "module", "exports", compiled)((name) => {
  if (name === "server-only") return {};
  if (name === "@supabase/ssr") return { createServerClient: () => client };
  if (name === "next/headers") return { cookies: async () => ({ getAll: () => [] }) };
  if (name === "@/features/auth/customer-auth-request") return { getCustomerAuthEnvironment: () => ({ ready: true }) };
  if (name === "@/features/auth/verified-customer-identity") return {
    getVerifiedCustomerIdentity: user => user?.id && user?.email_confirmed_at
      ? { authUserId: user.id, email: user.email } : null,
  };
  if (name === "@/features/account/customer-address-contract") return {
    customerAddressSchema: { parse: value => value },
  };
  return require(name);
}, mod, mod.exports);
const { getAddressContext, listCustomerAddresses } = mod.exports;

const previousUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const previousKey = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;
process.env.NEXT_PUBLIC_SUPABASE_URL = "https://test.supabase.co";
process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY = "test-publishable-key";
const priorFlag = process.env.COMMERCE_SAVED_ADDRESSES_ENABLED;
test.after(() => {
  if (previousUrl === undefined) delete process.env.NEXT_PUBLIC_SUPABASE_URL;
  else process.env.NEXT_PUBLIC_SUPABASE_URL = previousUrl;
  if (previousKey === undefined) delete process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;
  else process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY = previousKey;
  if (priorFlag === undefined) delete process.env.COMMERCE_SAVED_ADDRESSES_ENABLED;
  else process.env.COMMERCE_SAVED_ADDRESSES_ENABLED = priorFlag;
});
process.env.COMMERCE_SAVED_ADDRESSES_ENABLED = "true";

test("verified Customer A reads only own addresses", async () => {
  currentUser = users.alice;
  queries.length = 0;
  assert.deepEqual((await listCustomerAddresses()).map(row => row.id), ["address-a"]);
  assert.deepEqual(queries, [
    { table: "customers", conditions: { auth_user_id: "auth-a" } },
    { table: "customer_addresses", conditions: { customer_id: "customer-a" } },
  ]);
});

test("verified Customer B never sees Customer A address", async () => {
  currentUser = users.bob;
  queries.length = 0;
  assert.deepEqual((await listCustomerAddresses()).map(row => row.id), ["address-b"]);
  assert.deepEqual(queries[1], { table: "customer_addresses", conditions: { customer_id: "customer-b" } });
});

test("unverified Auth session cannot resolve address context", async () => {
  currentUser = { ...users.alice, email_confirmed_at: null };
  queries.length = 0;
  assert.equal(await getAddressContext(), null);
  assert.deepEqual(queries, []);
  await assert.rejects(() => listCustomerAddresses(), /Address service unavailable/);
});

test("a verified user without customer binding cannot query another customer's addresses", async () => {
  currentUser = { ...users.alice, id: "auth-unknown" };
  queries.length = 0;
  assert.deepEqual(await listCustomerAddresses(), []);
  assert.deepEqual(queries, [{ table: "customers", conditions: { auth_user_id: "auth-unknown" } }]);
});

test("saved addresses are feature-gated even for verified sessions", async () => {
  currentUser = users.alice;
  process.env.COMMERCE_SAVED_ADDRESSES_ENABLED = "false";
  queries.length = 0;
  assert.equal(await getAddressContext(), null);
  assert.deepEqual(queries, []);
  process.env.COMMERCE_SAVED_ADDRESSES_ENABLED = "true";
});
