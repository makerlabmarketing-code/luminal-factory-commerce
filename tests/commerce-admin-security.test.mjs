import assert from "node:assert/strict";
import { createHash, createHmac } from "node:crypto";
import { readFileSync } from "node:fs";
import test from "node:test";

const envSource = readFileSync("src/features/management/commerce-admin-env.ts", "utf8");
const verifierSource = readFileSync("src/features/management/commerce-admin-verifier.ts", "utf8");
const vector = JSON.parse(readFileSync("specs/integration/lfc-hmac-v1-test-vector.json", "utf8"));

function hmac(secret, canonicalRequest) {
  return createHmac("sha256", Buffer.from(secret, "utf8")).update(canonicalRequest, "utf8").digest("hex");
}

test("shared lfc-hmac-v1 vector is self-consistent", () => {
  const bodyHash = createHash("sha256").update(vector.request.rawBodyUtf8, "utf8").digest("hex");
  assert.equal(bodyHash, vector.request.bodySha256);
  assert.equal(hmac(vector.test_secret_utf8, vector.canonicalRequest), vector.expectedHmacSha256Hex);
});

test("tampering any signed field changes the compatibility signature", () => {
  const tampered = [
    vector.canonicalRequest.replace(vector.request.path, `${vector.request.path}-tampered`),
    vector.canonicalRequest.replace("commerce.hero.publish", "commerce.hero.write"),
    vector.canonicalRequest.replace("user_erp_123", "user_erp_124"),
    vector.canonicalRequest.replace("luminal_factory", "luminal_factory_other"),
    vector.canonicalRequest.replace("POST", "PUT"),
    vector.canonicalRequest.replace("luminal-commerce-production", "luminal-commerce-preview"),
  ];

  for (const canonicalRequest of tampered) {
    assert.notEqual(hmac(vector.test_secret_utf8, canonicalRequest), vector.expectedHmacSha256Hex);
  }

  const tamperedBodyHash = createHash("sha256").update(`${vector.request.rawBodyUtf8} `, "utf8").digest("hex");
  assert.notEqual(tamperedBodyHash, vector.request.bodySha256);
});

test("Commerce Admin environment stays server-only, default-off and rotation-ready", () => {
  assert.match(envSource, /import "server-only"/);
  assert.match(envSource, /COMMERCE_ADMIN_INTEGRATION_ENABLED === "true"/);
  assert.match(envSource, /if \(!parsed\.enabled\) return \{ enabled: false \}/);
  assert.match(envSource, /COMMERCE_ADMIN_HMAC_CURRENT_KEY_ID/);
  assert.match(envSource, /COMMERCE_ADMIN_HMAC_CURRENT_SECRET_BASE64/);
  assert.match(envSource, /COMMERCE_ADMIN_HMAC_PREVIOUS_KEY_ID/);
  assert.match(envSource, /COMMERCE_ADMIN_HMAC_PREVIOUS_SECRET_BASE64/);
  assert.match(envSource, /current HMAC key ids must differ/i);
  assert.match(envSource, /at least \$\{COMMERCE_ADMIN_MIN_SECRET_BYTES\} bytes/);
  assert.doesNotMatch(envSource, /NEXT_PUBLIC_/);
});

test("verifier consumes replay state only after HMAC and credential authorization", () => {
  const signatureCheck = verifierSource.indexOf("const signatureMatches");
  const activeCheck = verifierSource.indexOf("if (!credential.active)");
  const scopeCheck = verifierSource.indexOf("credential.allowedScopes.has(scope)");
  const replayConsume = verifierSource.indexOf("dependencies.replayStore.consume");

  assert.ok(signatureCheck >= 0);
  assert.ok(activeCheck > signatureCheck);
  assert.ok(scopeCheck > activeCheck);
  assert.ok(replayConsume > scopeCheck);
  assert.match(verifierSource, /timingSafeEqual/);
  assert.match(verifierSource, /DUMMY_SECRET/);
});
