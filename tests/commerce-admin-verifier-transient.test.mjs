import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

const runtime = readFileSync("src/features/management/commerce-admin-route-runtime.ts", "utf8");

test("verifier and nonce storage exceptions respond as retryable 503 without trusting the request", () => {
  assert.match(runtime, /verifyCommerceAdminRequest\(/);
  assert.match(runtime, /\)\.catch\(\(\) => null\)/);
  assert.match(runtime, /if \(!verification\) \{/);
  assert.match(runtime, /503,\s*"VERIFICATION_UNAVAILABLE"/);
  assert.match(runtime, /"Commerce Admin verification temporarily unavailable\.",\s*true/);
  assert.match(runtime, /if \(!verification\.ok\) \{/);
  assert.match(runtime, /401,\s*"AUTHENTICATION_FAILED"/);
});

test("a valid signature still consumes a single replay nonce and failed signatures never bypass verification", () => {
  assert.match(runtime, /consume_commerce_admin_nonce/);
  assert.match(runtime, /verifyCommerceAdminRequest\(/);
  assert.match(runtime, /buildCredentials\(environment\)/);
  assert.match(runtime, /const isReplay = verification\.reason === "replay"/);
  assert.match(runtime, /const rawBodyText = new TextDecoder\(\)\.decode\(rawBody\)/);
});
