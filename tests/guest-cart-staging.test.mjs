import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";
import {
  assertApplicationResponse,
  assertNoStoreResponse,
  extractGuestCartToken,
  hashGuestCartTokenForCleanup,
  parseStagingTarget,
} from "../scripts/verify-guest-cart-staging.mjs";

const validTarget = "https://luminal-factory-commerce-git-cart-staging-duy-s-projects4.vercel.app";

test("staging verifier accepts only an isolated Vercel Preview origin", () => {
  assert.equal(parseStagingTarget(validTarget).origin, validTarget);
  for (const target of [
    "https://luminalfactory.com",
    "https://luminal-factory-commerce-duy-s-projects4.vercel.app",
    "https://luminal-factory-commerce-git-master-duy-s-projects4.vercel.app",
    "http://preview.vercel.app",
    "https://preview.vercel.app/path",
    "https://user:pass@preview.vercel.app",
    "https://preview.example.com",
  ]) {
    assert.throws(() => parseStagingTarget(target));
  }
});

test("staging verifier extracts and hashes a valid cookie without exposing the raw token", () => {
  const token = Buffer.alloc(32, 7).toString("base64url");
  const setCookie = `lf_guest_cart=${token}; Path=/; Max-Age=2592000; Secure; HttpOnly; SameSite=Lax`;
  assert.equal(extractGuestCartToken(setCookie), token);
  assert.match(hashGuestCartTokenForCleanup(token), /^\\x[0-9a-f]{64}$/);
  assert.equal(extractGuestCartToken("another_cookie=value; Secure"), null);
  assert.throws(() => hashGuestCartTokenForCleanup("invalid"));
});

test("enabled staging mode is separately confirmed and always attempts exact cart cleanup", () => {
  const source = readFileSync("scripts/verify-guest-cart-staging.mjs", "utf8");
  assert.match(source, /ALLOW_GUEST_CART_STAGING_WRITES/);
  assert.match(source, /I_UNDERSTAND_THIS_CREATES_AND_DELETES_ONE_STAGING_CART/);
  assert.match(source, /finally\s*\{/);
  assert.match(source, /\.eq\("guest_token_hash", guestTokenHash\)/);
  assert.match(source, /data\?\.length !== 1/);
  assert.doesNotMatch(source, /console\.log\([^\n]*(?:guestToken|guestTokenHash|secretKey)/);
});

test("staging verifier accepts Vercel no-store normalization without allowing shared caching", () => {
  for (const cacheControl of ["private, no-store, max-age=0", "no-store, max-age=0"]) {
    const response = new Response("{}", { headers: { "cache-control": cacheControl } });
    assert.doesNotThrow(() => assertNoStoreResponse(response));
  }

  for (const cacheControl of ["private, max-age=0", "public, no-store", "no-store, s-maxage=60"]) {
    const response = new Response("{}", { headers: { "cache-control": cacheControl } });
    assert.throws(() => assertNoStoreResponse(response));
  }
});

test("staging verifier reports Vercel Deployment Protection before application assertions", () => {
  const protectedResponse = new Response("{}", {
    status: 401,
    headers: { "set-cookie": "_vercel_sso_nonce=opaque; Secure; HttpOnly; SameSite=Lax" },
  });
  assert.throws(
    () => assertApplicationResponse(protectedResponse),
    /VERCEL_AUTOMATION_BYPASS_SECRET/,
  );
});
