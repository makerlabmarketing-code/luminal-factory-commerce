import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";
import { createSupabaseGuestCartRateLimiter } from "../src/lib/supabase/guest-cart-rate-limit-server.ts";

const migrationPath = "supabase/migrations/20260814075546_add_guest_cart_rate_limits.sql";
const sql = readFileSync(migrationPath, "utf8");
const executableSql = sql.replace(/^--.*$/gm, "");
const KEY = "a".repeat(64);

function createClient(response) {
  const calls = [];
  return {
    calls,
    client: {
      async rpc(name, args) {
        calls.push({ name, args });
        return typeof response === "function" ? response() : response;
      },
    },
  };
}

test("stores only keyed source hashes in a private default-deny table", () => {
  assert.match(sql, /create schema if not exists private/i);
  assert.match(sql, /create table private\.guest_cart_rate_limits/i);
  assert.match(sql, /source_key_hash ~ '\^\[0-9a-f\]\{64\}\$'/i);
  assert.match(sql, /alter table private\.guest_cart_rate_limits enable row level security/i);
  assert.match(sql, /revoke all on schema private from public, anon, authenticated/i);
  assert.match(sql, /revoke all on table private\.guest_cart_rate_limits from public, anon, authenticated/i);
  assert.match(sql, /grant select, insert, update, delete on table private\.guest_cart_rate_limits to service_role/i);
  assert.doesNotMatch(executableSql, /\b(ip|email|guest_token|customer_id|user_id)\b/i);
  assert.doesNotMatch(executableSql, /create policy/i);
});

test("database function owns fixed policy and increments atomically", () => {
  assert.match(sql, /when 'request' then 240/i);
  assert.match(sql, /when 'create' then 20/i);
  assert.match(sql, /when 'mutation' then 120/i);
  assert.match(sql, /date_trunc\('hour',[\s\S]+at time zone 'UTC'/i);
  assert.match(sql, /on conflict \(source_key_hash, bucket, window_started_at\)[\s\S]+do update/i);
  assert.match(sql, /request_count = private\.guest_cart_rate_limits\.request_count \+ 1/i);
  assert.match(sql, /where private\.guest_cart_rate_limits\.request_count < v_limit/i);
  assert.doesNotMatch(sql, /p_limit|p_window/i);
});

test("RPC is invoker-only and executable only by the server role", () => {
  assert.match(sql, /security invoker/i);
  assert.match(sql, /set search_path = ''/i);
  assert.doesNotMatch(executableSql, /security definer/i);
  assert.match(
    sql,
    /revoke execute on function public\.consume_guest_cart_rate_limit\(text, text\)[\s\S]+from public, anon, authenticated/i,
  );
  assert.match(
    sql,
    /grant execute on function public\.consume_guest_cart_rate_limit\(text, text\)[\s\S]+to service_role/i,
  );
});

test("cleanup uses versionless Supabase Cron inside the existing database", () => {
  assert.match(sql, /create extension if not exists pg_cron;/i);
  assert.doesNotMatch(sql, /create extension[^;]+version/i);
  assert.match(sql, /cron\.schedule\([\s\S]+commerce-guest-cart-rate-limit-cleanup/i);
  assert.match(sql, /delete from private\.guest_cart_rate_limits[\s\S]+expires_at <= statement_timestamp\(\)/i);
});

test("adapter maps database boolean results and forwards no policy override", async () => {
  for (const [data, expected] of [[true, "allowed"], [false, "limited"]]) {
    const { client, calls } = createClient({ data, error: null });
    const limiter = createSupabaseGuestCartRateLimiter(client);
    assert.equal(await limiter.consume({ key: KEY, bucket: "create" }), expected);
    assert.deepEqual(calls, [{
      name: "consume_guest_cart_rate_limit",
      args: { p_key_hash: KEY, p_bucket: "create" },
    }]);
  }
});

test("adapter fails closed on database errors, malformed results and throws", async () => {
  const responses = [
    { data: null, error: { code: "42501" } },
    { data: null, error: null },
    () => { throw new Error("database unavailable"); },
  ];
  for (const response of responses) {
    const { client } = createClient(response);
    const limiter = createSupabaseGuestCartRateLimiter(client);
    assert.equal(await limiter.consume({ key: KEY, bucket: "request" }), "unavailable");
  }
});
