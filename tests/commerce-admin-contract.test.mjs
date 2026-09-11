import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

const contract = readFileSync("src/features/management/commerce-admin-contract.ts", "utf8");
const security = readFileSync("src/features/management/commerce-admin-security-contract.ts", "utf8");
const spec = readFileSync("specs/integration/erp-commerce-management-boundary.md", "utf8");

test("ERP Commerce management contract keeps privileged ownership on Commerce server", () => {
  assert.match(spec, /separate Supabase projects/i);
  assert.match(spec, /Commerce service-role key or the ERP→Commerce HMAC secret in browser\/client code/i);
  assert.match(spec, /Commerce Admin API \/ management boundary/i);
  assert.doesNotMatch(contract + security, /SUPABASE_SECRET_KEY|service_role|createClient|NEXT_PUBLIC_/);
});

test("Homepage Hero management contract exposes explicit least-privilege scopes", () => {
  for (const scope of ["commerce.hero.read", "commerce.hero.write", "commerce.hero.publish"]) {
    assert.match(contract, new RegExp(scope.replaceAll(".", "\\.")));
  }
  assert.match(contract, /CommerceAdminAuthorizer/);
  assert.match(contract, /requiredScopes/);
  assert.match(spec, /Hero credential must not automatically gain Order write authority/i);
});

test("Homepage Hero mutations are strict and keep database bounds at the API edge", () => {
  assert.match(contract, /create_draft/);
  assert.match(contract, /update_draft/);
  assert.match(contract, /publish/);
  assert.match(contract, /unpublish/);
  assert.match(contract, /\.strict\(\)/);
  assert.match(contract, /HOMEPAGE_HERO_ASSET_MAX_BYTES = 10 \* 1024 \* 1024/);
  assert.match(spec, /10 MB/i);
});

test("management transport locks HMAC integrity fields and a short freshness window", () => {
  assert.match(security, /COMMERCE_ADMIN_SIGNATURE_VERSION = "lfc-hmac-v1"/);
  assert.match(security, /COMMERCE_ADMIN_SIGNATURE_ALGORITHM = "HMAC-SHA256"/);
  assert.match(security, /COMMERCE_ADMIN_MAX_CLOCK_SKEW_SECONDS = 90/);
  assert.match(security, /COMMERCE_ADMIN_MIN_SECRET_BYTES = 32/);
  for (const field of [
    "clientId",
    "keyId",
    "audience",
    "requestId",
    "timestamp",
    "nonce",
    "actorId",
    "workspaceId",
    "scope",
    "method",
    "path",
    "contentType",
    "bodySha256",
  ]) {
    assert.match(security, new RegExp(`input\\.${field}`));
  }
  assert.match(spec, /exact raw request-body bytes before JSON parsing/i);
  assert.match(spec, /constant-time/i);
});

test("management transport requires replay resistance, rotation and TLS hardening", () => {
  assert.match(spec, /\(keyId, nonce\) pair has not already been accepted/i);
  assert.match(spec, /Nonce acceptance must be atomic/i);
  assert.match(spec, /process-local in-memory set is not sufficient/i);
  assert.match(spec, /overlapping key rotation/i);
  assert.match(spec, /revoked key fails closed immediately/i);
  assert.match(spec, /disabling TLS certificate verification/i);
  assert.match(spec, /plain HTTP/i);
});

test("Drive remains import-only and management routes stay non-live in preparation", () => {
  assert.match(spec, /Drive is not a runtime fallback or CDN/i);
  assert.match(spec, /These routes are not live yet/i);
  assert.match(spec, /explicit approval before enabling the Production integration runtime flag/i);
  assert.match(spec, /no ERP→Commerce request is sent/i);
});
