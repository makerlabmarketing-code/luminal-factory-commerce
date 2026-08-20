import assert from "node:assert/strict";
import { createHash } from "node:crypto";
import { pathToFileURL } from "node:url";
import { createClient } from "@supabase/supabase-js";

const EXPECTED_SUPABASE_ORIGIN = "https://bkmbhcfokobmhfzgsfzh.supabase.co";
const GUEST_CART_COOKIE_NAME = "lf_guest_cart";
const GUEST_CART_REQUEST_HEADER = "x-luminal-cart-request";
const GUEST_CART_REQUEST_HEADER_VALUE = "1";
const VERCEL_PROTECTION_BYPASS_HEADER = "x-vercel-protection-bypass";
const WRITE_CONFIRMATION = "I_UNDERSTAND_THIS_CREATES_AND_DELETES_ONE_STAGING_CART";
const blockedHosts = new Set([
  "luminalfactory.com",
  "luminal-factory-commerce-duy-s-projects4.vercel.app",
  "luminal-factory-commerce-git-master-duy-s-projects4.vercel.app",
]);

export function parseStagingTarget(rawValue) {
  const value = rawValue?.trim();
  if (!value) throw new Error("COMMERCE_GUEST_CART_STAGING_URL is required.");

  const url = new URL(value);
  if (
    url.protocol !== "https:" ||
    url.username ||
    url.password ||
    url.pathname !== "/" ||
    url.search ||
    url.hash ||
    !url.hostname.endsWith(".vercel.app") ||
    blockedHosts.has(url.hostname)
  ) {
    throw new Error("The target must be an isolated HTTPS Vercel Preview origin, never production.");
  }

  return url;
}

export function extractGuestCartToken(setCookie) {
  const match = setCookie?.match(new RegExp(`(?:^|,\\s*)${GUEST_CART_COOKIE_NAME}=([^;]+)`));
  return match?.[1] ?? null;
}

export function hashGuestCartTokenForCleanup(token) {
  if (!/^[A-Za-z0-9_-]{43}$/.test(token)) throw new Error("The staging cookie token is malformed.");
  const decoded = Buffer.from(token, "base64url");
  if (decoded.length !== 32 || decoded.toString("base64url") !== token) {
    throw new Error("The staging cookie token is malformed.");
  }
  return `\\x${createHash("sha256").update(decoded).digest("hex")}`;
}

async function postCart(target, body, options = {}) {
  const origin = options.origin ?? target.origin;
  const headers = {
    "content-type": "application/json",
    origin,
    "sec-fetch-site": origin === target.origin ? "same-origin" : "cross-site",
    [GUEST_CART_REQUEST_HEADER]: GUEST_CART_REQUEST_HEADER_VALUE,
  };
  if (options.protectionBypassSecret) {
    headers[VERCEL_PROTECTION_BYPASS_HEADER] = options.protectionBypassSecret;
  }
  if (options.cookie) headers.cookie = `${GUEST_CART_COOKIE_NAME}=${options.cookie}`;
  if (options.omitRequestHeader) delete headers[GUEST_CART_REQUEST_HEADER];

  return fetch(new URL("/api/cart", target), {
    method: "POST",
    headers,
    body: JSON.stringify(body),
    redirect: "manual",
  });
}

export function assertNoStoreResponse(response) {
  const cacheControl = response.headers.get("cache-control") ?? "";
  const directives = new Set(
    cacheControl
      .split(",")
      .map((directive) => directive.trim().toLowerCase())
      .filter(Boolean),
  );

  assert.equal(directives.has("no-store"), true, "The application response must be no-store.");
  assert.equal(directives.has("public"), false, "The application response must not be public-cacheable.");
  assert.equal(
    [...directives].some((directive) => directive.startsWith("s-maxage=")),
    false,
    "The application response must not define a shared-cache lifetime.",
  );
}

export function assertApplicationResponse(response) {
  const setCookie = response.headers.get("set-cookie") ?? "";
  if (response.status === 401 && /(?:^|[,;]\s*)_vercel_sso_nonce=/i.test(setCookie)) {
    throw new Error(
      "The Preview is blocked by Vercel Deployment Protection. Configure an Automation Bypass secret and expose it to this verifier only as VERCEL_AUTOMATION_BYPASS_SECRET.",
    );
  }
}

async function readJsonResponse(response) {
  assertApplicationResponse(response);
  assert.match(response.headers.get("content-type") ?? "", /^application\/json\b/i);
  const body = await response.json();
  // Vercel may remove the redundant `private` directive while preserving `no-store`.
  assertNoStoreResponse(response);
  assert.equal(response.headers.get("x-content-type-options"), "nosniff");
  return body;
}

export async function verifyDisabledStaging(target, environment = process.env) {
  const response = await postCart(target, { action: "create" }, {
    origin: "https://disabled-probe.invalid",
    protectionBypassSecret: environment.VERCEL_AUTOMATION_BYPASS_SECRET?.trim(),
  });
  const body = await readJsonResponse(response);
  assert.equal(response.status, 404);
  assert.deepEqual(body, { ok: false, code: "cart_unavailable" });
}

async function deleteSmokeCart(supabase, guestTokenHash) {
  const { data, error } = await supabase
    .from("carts")
    .delete()
    .eq("guest_token_hash", guestTokenHash)
    .is("customer_id", null)
    .select("id");
  if (error || data?.length !== 1) throw new Error("Could not delete exactly one staging cart.");

  const { count, error: verifyError } = await supabase
    .from("carts")
    .select("id", { count: "exact", head: true })
    .eq("guest_token_hash", guestTokenHash);
  if (verifyError || count !== 0) throw new Error("Staging cart cleanup did not converge to zero.");
}

export async function verifyEnabledStaging(target, environment = process.env) {
  const supabaseUrl = environment.NEXT_PUBLIC_SUPABASE_URL?.trim();
  const secretKey = environment.SUPABASE_SECRET_KEY?.trim();
  if (supabaseUrl !== EXPECTED_SUPABASE_ORIGIN || !secretKey) {
    throw new Error("The exact Commerce Supabase URL and server-only secret key are required.");
  }
  if (environment.ALLOW_GUEST_CART_STAGING_WRITES !== WRITE_CONFIRMATION) {
    throw new Error("Explicit staging-write confirmation is required.");
  }

  const supabase = createClient(supabaseUrl, secretKey, {
    auth: { autoRefreshToken: false, detectSessionInUrl: false, persistSession: false },
  });
  let guestToken = null;
  let guestTokenHash = null;
  const protectionBypassSecret = environment.VERCEL_AUTOMATION_BYPASS_SECRET?.trim();

  try {
    const crossOrigin = await postCart(target, { action: "create" }, {
      origin: "https://cross-origin.invalid",
      protectionBypassSecret,
    });
    assert.equal(crossOrigin.status, 403);
    assert.deepEqual(await readJsonResponse(crossOrigin), { ok: false, code: "invalid_request" });

    const missingHeader = await postCart(target, { action: "create" }, {
      omitRequestHeader: true,
      protectionBypassSecret,
    });
    assert.equal(missingHeader.status, 403);
    assert.deepEqual(await readJsonResponse(missingHeader), { ok: false, code: "invalid_request" });

    const created = await postCart(target, { action: "create" }, { protectionBypassSecret });
    const createdBody = await readJsonResponse(created);
    assert.equal(created.status, 201);
    assert.equal(createdBody.ok, true);
    assert.deepEqual(createdBody.cart.lines, []);
    assert.equal("guestToken" in createdBody, false);

    const setCookie = created.headers.get("set-cookie") ?? "";
    guestToken = extractGuestCartToken(setCookie);
    if (!guestToken) throw new Error("The create response did not set a guest-cart cookie.");
    guestTokenHash = hashGuestCartTokenForCleanup(guestToken);
    if (
      !/HttpOnly/i.test(setCookie) ||
      !/SameSite=Lax/i.test(setCookie) ||
      !/Secure/i.test(setCookie) ||
      !/Max-Age=2592000/i.test(setCookie)
    ) {
      throw new Error("The staging cookie security contract differs from the reviewed contract.");
    }

    const idempotentCreate = await postCart(target, { action: "create" }, {
      cookie: guestToken,
      protectionBypassSecret,
    });
    assert.equal(idempotentCreate.status, 200);
    assert.equal((await readJsonResponse(idempotentCreate)).ok, true);
    if (extractGuestCartToken(idempotentCreate.headers.get("set-cookie"))) {
      throw new Error("Idempotent creation unexpectedly replaced the guest-cart cookie.");
    }

    const concurrentReads = await Promise.all(
      Array.from({ length: 5 }, () => postCart(target, { action: "read" }, {
        cookie: guestToken,
        protectionBypassSecret,
      })),
    );
    for (const response of concurrentReads) {
      assert.equal(response.status, 200);
      assert.equal((await readJsonResponse(response)).ok, true);
    }

    const replacement = guestToken.endsWith("A") ? "B" : "A";
    const tamperedToken = `${guestToken.slice(0, -1)}${replacement}`;
    const tampered = await postCart(target, { action: "read" }, {
      cookie: tamperedToken,
      protectionBypassSecret,
    });
    assert.equal(tampered.status, 404);
    assert.deepEqual(await readJsonResponse(tampered), { ok: false, code: "cart_unavailable" });
    assert.match(tampered.headers.get("set-cookie") ?? "", /Max-Age=0/i);
  } finally {
    if (guestTokenHash) await deleteSmokeCart(supabase, guestTokenHash);
    guestToken = null;
    guestTokenHash = null;
  }
}

async function main() {
  const target = parseStagingTarget(process.env.COMMERCE_GUEST_CART_STAGING_URL);
  const mode = process.argv.find((argument) => argument.startsWith("--mode="))?.slice(7);
  if (mode === "disabled") {
    await verifyDisabledStaging(target);
    console.log("Guest-cart staging disabled probe passed; no cart was created.");
    return;
  }
  if (mode === "enabled") {
    await verifyEnabledStaging(target);
    console.log("Guest-cart staging smoke passed; the test cart was deleted.");
    return;
  }
  throw new Error("Use --mode=disabled or --mode=enabled.");
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  main().catch((error) => {
    console.error(error instanceof Error ? error.message : "Guest-cart staging verification failed.");
    process.exitCode = 1;
  });
}
