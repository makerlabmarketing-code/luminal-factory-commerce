import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

const contract = readFileSync("src/features/management/commerce-admin-contract.ts", "utf8");
const spec = readFileSync("specs/integration/erp-commerce-management-boundary.md", "utf8");

test("ERP Commerce management contract keeps privileged ownership on Commerce server", () => {
  assert.match(spec, /separate Supabase projects/i);
  assert.match(spec, /Commerce service-role key in ERP client code/i);
  assert.match(spec, /Commerce Admin API \/ management boundary/i);
  assert.doesNotMatch(contract, /SUPABASE_SECRET_KEY|service_role|createClient|NEXT_PUBLIC_/);
});

test("Homepage Hero management contract exposes explicit least-privilege scopes", () => {
  for (const scope of ["commerce.hero.read", "commerce.hero.write", "commerce.hero.publish"]) {
    assert.match(contract, new RegExp(scope.replaceAll(".", "\\.")));
  }
  assert.match(contract, /CommerceAdminAuthorizer/);
  assert.match(contract, /requiredScopes/);
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

test("Drive remains import-only and management routes stay non-live in preparation", () => {
  assert.match(spec, /Drive is not a runtime fallback or CDN/i);
  assert.match(spec, /These routes are not live yet/i);
  assert.match(spec, /explicit approval before enabling the Production runtime flag/i);
});
