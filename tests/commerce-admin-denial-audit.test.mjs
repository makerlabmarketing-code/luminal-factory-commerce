import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

const verifier = readFileSync("src/features/management/commerce-admin-verifier.ts", "utf8");
const runtime = readFileSync("src/features/management/commerce-admin-route-runtime.ts", "utf8");
const migration = readFileSync(
  "supabase/migrations/20260929020152_add_bounded_commerce_admin_denial_audit.sql",
  "utf8",
);

test("only a validated signature can label a denial as replay", () => {
  const replayReturn = verifier.indexOf('return { ok: false, reason: "replay"');
  assert.ok(replayReturn > verifier.indexOf("const signatureMatches"));
  assert.ok(replayReturn > verifier.indexOf("credential.allowedScopes.has(scope)"));
  assert.match(runtime, /verification\.reason === "replay" \? verification\.identity\.keyId : ""/);
  assert.match(runtime, /"AUTHENTICATION_FAILED"/);
  assert.doesNotMatch(runtime, /p_key_id: request\.headers/);
});

test("public denials cannot create unbounded audit identities", () => {
  assert.match(migration, /primary key \(bucket_at, category, key_id\)/);
  assert.match(migration, /date_bin\('10 minutes'/);
  assert.match(migration, /on conflict \(bucket_at, category, key_id\) do nothing/);
  assert.match(migration, /category = 'authentication_failed' and key_id = ''/);
  assert.match(runtime, /denialSampleAttempts\.get\(localKey\) === bucket/);
  assert.match(migration, /alter table private\.commerce_admin_denial_samples enable row level security/);
  assert.match(migration, /security invoker/);
  assert.match(migration, /revoke execute on function public\.record_commerce_admin_denial_sample\(text, text\)[\s\S]*from public, anon, authenticated/);
  assert.match(migration, /grant execute on function public\.record_commerce_admin_denial_sample\(text, text\)[\s\S]*to service_role/);
});
