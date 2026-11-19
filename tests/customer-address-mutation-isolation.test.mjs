import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import ts from "typescript";

const customers = [
  { id: "customer-a", auth_user_id: "auth-a" },
  { id: "customer-b", auth_user_id: "auth-b" },
];
const initialAddresses = [
  { id: "address-a", customer_id: "customer-a", label: "Alice" },
  { id: "address-b", customer_id: "customer-b", label: "Bob" },
];
let addresses = initialAddresses.map(row => ({ ...row }));
let user = { id: "auth-a", email: "alice@example.com", email_confirmed_at: "2026-11-18T00:00:00Z" };
const queries = [];

function from(table) {
  const filters = {};
  let action = "read";
  let payload;
  const query = {
    select() { return query; },
    eq(field, value) { filters[field] = value; return query; },
    update(value) { action = "update"; payload = value; return query; },
    delete() { action = "delete"; return query; },
    insert(value) { action = "insert"; payload = value; return query; },
    async maybeSingle() {
      queries.push({ table, action, filters: { ...filters } });
      if (table !== "customers") throw Error("Unexpected table");
      const row = customers.find(c => Object.entries(filters).every(([k, v]) => c[k] === v));
      return { data: row ?? null, error: null };
    },
    async single() {
      queries.push({ table, action, filters: { ...filters } });
      if (table !== "customer_addresses") throw Error("Unexpected table");
      const index = addresses.findIndex(a => Object.entries(filters).every(([k, v]) => a[k] === v));
      if (action === "insert") {
        addresses.push({ ...payload, id: "new" });
        return { data: { id: "new" }, error: null };
      }
      if (index < 0) return { data: null, error: { code: "PGRST116" } };
      const id = addresses[index].id;
      if (action === "update") addresses[index] = { ...addresses[index], ...payload };
      if (action === "delete") addresses.splice(index, 1);
      return { data: { id }, error: null };
    },
  };
  return query;
}
const client = {
  auth: { async getUser() { return { data: { user }, error: null }; } },
  from,
};
const fixtureProcess = {
  env: {
    NEXT_PUBLIC_SUPABASE_URL: "https://fixture.supabase.co",
    NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY: "public-test-key",
    COMMERCE_SAVED_ADDRESSES_ENABLED: "true",
  },
};
const source = ts.transpileModule(
  readFileSync("src/features/account/customer-address-server.ts", "utf8"),
  { compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022 } },
).outputText;
const mod = { exports: {} };
new Function("require", "module", "exports", "process", source)((name) => {
  if (name === "server-only") return {};
  if (name === "@supabase/ssr") return { createServerClient: () => client };
  if (name === "next/headers") return { cookies: async () => ({ getAll: () => [] }) };
  if (name === "@/features/auth/customer-auth-request")
    return { getCustomerAuthEnvironment: () => ({ ready: true }) };
  if (name === "@/features/auth/verified-customer-identity")
    return { getVerifiedCustomerIdentity: u => u?.email_confirmed_at
      ? { authUserId: u.id, email: u.email } : null };
  if (name === "@/features/account/customer-address-contract")
    return { customerAddressSchema: { parse: value => value } };
  throw Error("Unexpected module: " + name);
}, mod, mod.exports, fixtureProcess);

const { saveCustomerAddress, setDefaultCustomerAddress, deleteCustomerAddress } = mod.exports;

test.beforeEach(() => {
  user = { id: "auth-a", email: "alice@example.com", email_confirmed_at: "2026-11-18T00:00:00Z" };
  addresses = initialAddresses.map(a => ({ ...a }));
  queries.length = 0;
});

test("Customer A cannot update, set default or delete Customer B address", async () => {
  await assert.rejects(
    () => saveCustomerAddress({ label: "Stolen" }, "address-b"),
    /Address could not be saved/,
  );
  await assert.rejects(
    () => setDefaultCustomerAddress("address-b"),
    /Address could not be updated/,
  );
  await assert.rejects(
    () => deleteCustomerAddress("address-b"),
    /Address could not be deleted/,
  );
  assert.deepEqual(addresses, initialAddresses);
  const addressWrites = queries.filter(q => q.table === "customer_addresses");
  assert.equal(addressWrites.length, 3);
  for (const write of addressWrites) {
    assert.equal(write.filters.id, "address-b");
    assert.equal(write.filters.customer_id, "customer-a");
  }
});

test("Customer A may edit own address and cannot change ownership through payload", async () => {
  await saveCustomerAddress({ label: "Alice updated", customer_id: "customer-b" }, "address-a");
  assert.equal(addresses[0].label, "Alice updated");
  assert.equal(addresses[0].customer_id, "customer-a");
  assert.equal(addresses[1].label, "Bob");
});

test("Customer B can manage only its own address", async () => {
  user = { id: "auth-b", email: "bob@example.com", email_confirmed_at: "2026-11-18T00:00:00Z" };
  await setDefaultCustomerAddress("address-b");
  assert.equal(addresses[1].is_default, true);
  await deleteCustomerAddress("address-b");
  assert.deepEqual(addresses, [initialAddresses[0]]);
  assert.deepEqual(queries.filter(q => q.table === "customer_addresses")
    .map(q => q.filters.customer_id), ["customer-b", "customer-b"]);
});

test("Unverified Auth identity cannot perform any address mutations", async () => {
  user = { ...user, email_confirmed_at: null };
  await assert.rejects(() => deleteCustomerAddress("address-a"), /Address service unavailable/);
  assert.deepEqual(queries, []);
  assert.deepEqual(addresses, initialAddresses);
});
