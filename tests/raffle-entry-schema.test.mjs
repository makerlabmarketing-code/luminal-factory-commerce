import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

const migration = readFileSync(
  "supabase/migrations/20260918063545_create_raffle_entry_foundation.sql",
  "utf8",
);

test("raffle migration keeps event, entry and abuse state separate", () => {
  assert.match(migration, /create table public\.raffles/);
  assert.match(migration, /create table public\.raffle_entries/);
  assert.match(migration, /create table private\.raffle_entry_rate_limits/);
  assert.match(migration, /product_id uuid references public\.products\(id\) on delete restrict/);
  assert.match(migration, /raffle_id uuid not null references public\.raffles\(id\) on delete restrict/);
  assert.doesNotMatch(migration, /create table public\.(?:raffle_winners|raffle_draws)|order_id|payment_id|inventory_id/);
});
test("raffle entry constraints make duplicate and retry races database-safe", () => {
  assert.match(migration, /unique \(raffle_id, email_normalized\)/);
  assert.match(migration, /unique \(raffle_id, request_token_hash\)/);
  assert.match(migration, /request_fingerprint_hash/);
  assert.match(migration, /pg_advisory_xact_lock/);
  assert.match(migration, /for update/);
  assert.match(migration, /v_raffle\.status <> 'OPEN'/);
  assert.match(migration, /v_now < v_raffle\.opens_at/);
  assert.match(migration, /v_now >= v_raffle\.closes_at/);
  assert.match(migration, /raffle entry request token conflict/);
});

test("raffle RLS exposes only published events and keeps entrants private", () => {
  assert.equal((migration.match(/enable row level security/g) ?? []).length, 3);
  assert.match(migration, /Public can read published raffles/);
  assert.match(migration, /grant select on table public\.raffles to anon, authenticated/);
  assert.match(migration, /revoke all on table public\.raffle_entries from public, anon, authenticated/);
  assert.match(migration, /revoke all on table private\.raffle_entry_rate_limits from public, anon, authenticated/);
  assert.doesNotMatch(migration, /create policy[\s\S]*on public\.raffle_entries/);
});

test("raffle RPCs are invoker-only and service-role-only", () => {
  assert.match(migration, /create function public\.submit_guest_raffle_entry/);
  assert.match(migration, /create function public\.consume_raffle_entry_rate_limit/);
  assert.equal((migration.match(/security invoker/g) ?? []).length, 2);
  assert.doesNotMatch(migration, /security definer/i);
  assert.match(migration, /revoke execute on function public\.submit_guest_raffle_entry[\s\S]*from public, anon, authenticated/);
  assert.match(migration, /grant execute on function public\.submit_guest_raffle_entry[\s\S]*to service_role/);
  assert.match(migration, /grant execute on function public\.consume_raffle_entry_rate_limit[\s\S]*to service_role/);
});

test("raffle limiter stores keyed hashes and has bounded cleanup", () => {
  assert.match(migration, /bucket in \('source_hour', 'email_raffle_15m'\)/);
  assert.match(migration, /key_hash ~ '\^\[0-9a-f\]\{64\}\$'/);
  assert.match(migration, /commerce-raffle-entry-rate-limit-cleanup/);
  assert.match(migration, /delete from private\.raffle_entry_rate_limits/);
  assert.doesNotMatch(migration, /ip_address|raw_email|captcha_token/);
});
