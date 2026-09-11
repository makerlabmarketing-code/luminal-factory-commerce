import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

const migration = readFileSync(
  "supabase/migrations/20260911091500_add_commerce_admin_security_persistence.sql",
  "utf8",
);

test("Commerce Admin replay persistence is private, atomic and fixed-retention", () => {
  assert.match(migration, /create table private\.commerce_admin_replay_nonces/i);
  assert.match(migration, /primary key \(key_id, nonce\)/i);
  assert.match(migration, /on conflict \(key_id, nonce\) do nothing/i);
  assert.match(migration, /interval '10 minutes'/i);
  assert.match(migration, /security invoker/i);
  assert.match(migration, /revoke execute on function public\.consume_commerce_admin_nonce/i);
  assert.match(migration, /grant execute on function public\.consume_commerce_admin_nonce[\s\S]*service_role/i);
  assert.doesNotMatch(migration, /security definer/i);
});

test("Commerce Admin audit storage is append-only for application credentials", () => {
  assert.match(migration, /create table private\.commerce_admin_audit_events/i);
  assert.match(migration, /grant select, insert on table private\.commerce_admin_audit_events to service_role/i);
  assert.doesNotMatch(migration, /grant[^;]*update[^;]*commerce_admin_audit_events/i);
  assert.doesNotMatch(migration, /grant[^;]*delete[^;]*commerce_admin_audit_events/i);
  assert.match(migration, /outcome in \('denied', 'succeeded', 'failed'\)/i);
  assert.match(migration, /record_commerce_admin_audit_event/i);
});

test("browser roles cannot access replay or audit internals", () => {
  assert.match(migration, /revoke all on schema private from public, anon, authenticated/i);
  assert.match(migration, /revoke all on table private\.commerce_admin_replay_nonces from public, anon, authenticated/i);
  assert.match(migration, /revoke all on table private\.commerce_admin_audit_events from public, anon, authenticated/i);
  assert.match(migration, /alter table private\.commerce_admin_replay_nonces enable row level security/i);
  assert.match(migration, /alter table private\.commerce_admin_audit_events enable row level security/i);
});

test("security persistence cleanup is bounded and database-owned", () => {
  assert.match(migration, /commerce-admin-replay-cleanup/i);
  assert.match(migration, /commerce-admin-audit-cleanup/i);
  assert.match(migration, /interval '180 days'/i);
  assert.doesNotMatch(migration, /p_retention|retention_days|retention_minutes/i);
});

test("Commerce Admin security migration does not mutate transactional commerce domains", () => {
  assert.doesNotMatch(migration, /\b(update|insert into|delete from|alter table|drop table)\s+public\.(orders|payments|refunds|inventory_items|carts|cart_items|customers)\b/i);
  assert.doesNotMatch(migration, /raffle/i);
});
