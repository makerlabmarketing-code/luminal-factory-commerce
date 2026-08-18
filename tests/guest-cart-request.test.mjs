import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";
import {
  createGuestCartRateLimitKey,
  getGuestCartRequestEnvironment,
  getGuestCartSourceIdentifier,
  GUEST_CART_REQUEST_HEADER,
  GUEST_CART_REQUEST_HEADER_VALUE,
  handleGuestCartRequest,
} from "../src/features/cart/guest-cart-request.ts";

const ORIGIN = "https://luminalfactory.com";
const PRODUCT_ID = "11111111-1111-4111-8111-111111111111";
const VARIANT_ID = "22222222-2222-4222-8222-222222222222";
const RATE_SECRET = "0123456789abcdef0123456789abcdef";
const CART = {
  currency: "VND",
  expiresAt: "2026-09-13T04:00:00.000Z",
  lines: [],
  unavailableLineCount: 0,
};

function readyEnvironment() {
  return getGuestCartRequestEnvironment({
    COMMERCE_GUEST_CART_ENABLED: "true",
    COMMERCE_GUEST_CART_ALLOWED_ORIGINS: ORIGIN,
    COMMERCE_GUEST_CART_RATE_LIMIT_SECRET: RATE_SECRET,
  });
}

function createRequest(body, headers = {}) {
  return new Request(`${ORIGIN}/api/cart`, {
    method: "POST",
    headers: {
      "content-type": "application/json",
      origin: ORIGIN,
      "sec-fetch-site": "same-origin",
      [GUEST_CART_REQUEST_HEADER]: GUEST_CART_REQUEST_HEADER_VALUE,
      ...headers,
    },
    body: typeof body === "string" ? body : JSON.stringify(body),
  });
}

function createService(overrides = {}) {
  const calls = { create: 0, read: 0, setLine: 0, removeLine: 0 };
  return {
    calls,
    service: {
      async create() {
        calls.create += 1;
        return { ok: true, guestToken: "sensitive-cookie-token", cart: CART };
      },
      async read() {
        calls.read += 1;
        return { ok: true, cart: CART };
      },
      async setLine() {
        calls.setLine += 1;
        return { ok: true, cart: CART };
      },
      async removeLine() {
        calls.removeLine += 1;
        return { ok: true, cart: CART };
      },
      ...overrides,
    },
  };
}

function createRateLimiter(result = "allowed") {
  const calls = [];
  return {
    calls,
    rateLimiter: {
      async consume(input) {
        calls.push(input);
        return typeof result === "function" ? result(input) : result;
      },
    },
  };
}

function dependencies(overrides = {}) {
  const { service } = createService();
  const { rateLimiter } = createRateLimiter();
  return {
    environment: readyEnvironment(),
    service,
    rateLimiter,
    sourceIdentifier: "203.0.113.10",
    ...overrides,
  };
}

test("environment is default-off and rejects wildcard, path or short rate-limit secrets", () => {
  assert.deepEqual(getGuestCartRequestEnvironment({}), { ready: false, code: "runtime_disabled" });
  for (const origin of ["*", "http://luminalfactory.com", `${ORIGIN}/shop`]) {
    assert.deepEqual(
      getGuestCartRequestEnvironment({
        COMMERCE_GUEST_CART_ENABLED: "true",
        COMMERCE_GUEST_CART_ALLOWED_ORIGINS: origin,
        COMMERCE_GUEST_CART_RATE_LIMIT_SECRET: RATE_SECRET,
      }),
      { ready: false, code: "runtime_unavailable" },
    );
  }
  assert.deepEqual(
    getGuestCartRequestEnvironment({
      COMMERCE_GUEST_CART_ENABLED: "true",
      COMMERCE_GUEST_CART_ALLOWED_ORIGINS: ORIGIN,
      COMMERCE_GUEST_CART_RATE_LIMIT_SECRET: "too-short",
    }),
    { ready: false, code: "runtime_unavailable" },
  );
});

test("source address becomes a keyed hash and is never used as the limiter key", () => {
  const headers = new Headers({ "x-forwarded-for": "203.0.113.10, 198.51.100.3" });
  assert.equal(getGuestCartSourceIdentifier(headers), "203.0.113.10");
  assert.equal(getGuestCartSourceIdentifier(new Headers({ "x-forwarded-for": "not-an-ip" })), undefined);
  const key = createGuestCartRateLimitKey(RATE_SECRET, "203.0.113.10");
  assert.match(key, /^[0-9a-f]{64}$/);
  assert.doesNotMatch(key, /203\.0\.113\.10/);
  assert.notEqual(key, createGuestCartRateLimitKey(RATE_SECRET, "203.0.113.11"));
});

test("disabled runtime short-circuits before request parsing or service access", async () => {
  const { service, calls } = createService();
  const outcome = await handleGuestCartRequest(new Request(`${ORIGIN}/api/cart`, { method: "POST" }), {
    environment: { ready: false, code: "runtime_disabled" },
    service,
  });
  assert.deepEqual(outcome, { status: 404, body: { ok: false, code: "cart_unavailable" } });
  assert.deepEqual(calls, { create: 0, read: 0, setLine: 0, removeLine: 0 });
});

test("request boundary rejects cross-origin, unsupported content and missing CSRF header", async () => {
  const invalidRequests = [
    createRequest({ action: "read" }, { origin: "https://evil.example" }),
    createRequest({ action: "read" }, { "content-type": "text/plain" }),
    createRequest({ action: "read" }, { "content-type": "application/jsonp" }),
    createRequest({ action: "read" }, { [GUEST_CART_REQUEST_HEADER]: "0" }),
    createRequest({ action: "read" }, { "sec-fetch-site": "cross-site" }),
  ];
  for (const request of invalidRequests) {
    const outcome = await handleGuestCartRequest(request, dependencies());
    assert.deepEqual(outcome, { status: 403, body: { ok: false, code: "invalid_request" } });
  }
});

test("missing source, service or durable limiter fails closed", async () => {
  for (const missing of ["sourceIdentifier", "service", "rateLimiter"]) {
    const input = dependencies();
    delete input[missing];
    const outcome = await handleGuestCartRequest(createRequest({ action: "read" }), input);
    assert.deepEqual(outcome, { status: 503, body: { ok: false, code: "service_unavailable" } });
  }
});

test("limiter unavailable and exhausted requests stop before the cart service", async () => {
  for (const limiterResult of ["unavailable", "limited"]) {
    const { service, calls } = createService();
    const { rateLimiter } = createRateLimiter(limiterResult);
    const outcome = await handleGuestCartRequest(createRequest({ action: "create" }), dependencies({
      service,
      rateLimiter,
    }));
    assert.equal(outcome.status, limiterResult === "limited" ? 429 : 503);
    assert.deepEqual(calls, { create: 0, read: 0, setLine: 0, removeLine: 0 });
  }
});

test("thrown limiter and service failures become generic unavailable responses", async () => {
  const throwingLimiter = createRateLimiter(() => {
    throw new Error("limiter detail must not escape");
  });
  const limiterOutcome = await handleGuestCartRequest(
    createRequest({ action: "read" }),
    dependencies({ rateLimiter: throwingLimiter.rateLimiter }),
  );
  assert.deepEqual(limiterOutcome, { status: 503, body: { ok: false, code: "service_unavailable" } });

  const { service } = createService({
    async read() {
      throw new Error("database detail must not escape");
    },
  });
  const serviceOutcome = await handleGuestCartRequest(
    createRequest({ action: "read" }),
    dependencies({ service, guestToken: "cookie-token" }),
  );
  assert.deepEqual(serviceOutcome, { status: 503, body: { ok: false, code: "service_unavailable" } });
});

test("create uses request plus creation buckets and keeps the raw token out of JSON", async () => {
  const { service, calls } = createService();
  const { rateLimiter, calls: limiterCalls } = createRateLimiter();
  const outcome = await handleGuestCartRequest(createRequest({ action: "create" }), dependencies({
    service,
    rateLimiter,
  }));

  assert.equal(outcome.status, 201);
  assert.equal(outcome.guestTokenToSet, "sensitive-cookie-token");
  assert.doesNotMatch(JSON.stringify(outcome.body), /sensitive-cookie-token|guestToken/);
  assert.deepEqual(limiterCalls.map((call) => call.bucket), ["request", "create"]);
  assert.equal(calls.create, 1);
});

test("create with a valid cookie is idempotent and does not create another cart", async () => {
  const { service, calls } = createService();
  const outcome = await handleGuestCartRequest(createRequest({ action: "create" }), dependencies({
    service,
    guestToken: "existing-token",
  }));
  assert.equal(outcome.status, 200);
  assert.equal(outcome.guestTokenToSet, undefined);
  assert.equal(calls.read, 1);
  assert.equal(calls.create, 0);
});

test("invalid cart credentials are generic and request cookie clearing", async () => {
  const { service } = createService({
    async read() {
      return { ok: false, code: "cart_unavailable" };
    },
  });
  const outcome = await handleGuestCartRequest(createRequest({ action: "read" }), dependencies({
    service,
    guestToken: "altered-token",
  }));
  assert.deepEqual(outcome, {
    status: 404,
    body: { ok: false, code: "cart_unavailable" },
    clearGuestToken: true,
  });
});

test("line actions are validated, rate-limited and forwarded without extra authority", async () => {
  const received = [];
  const { service } = createService({
    async setLine(token, input) {
      received.push({ action: "set", token, input });
      return { ok: true, cart: CART };
    },
    async removeLine(token, input) {
      received.push({ action: "remove", token, input });
      return { ok: true, cart: CART };
    },
  });
  const { rateLimiter, calls } = createRateLimiter();
  const base = dependencies({ service, rateLimiter, guestToken: "cookie-token" });

  const setOutcome = await handleGuestCartRequest(createRequest({
    action: "set_line",
    productId: PRODUCT_ID,
    variantId: VARIANT_ID,
    requestedQuantity: 3,
  }), base);
  const removeOutcome = await handleGuestCartRequest(createRequest({
    action: "remove_line",
    productId: PRODUCT_ID,
    variantId: VARIANT_ID,
  }), base);
  assert.equal(setOutcome.status, 200);
  assert.equal(removeOutcome.status, 200);
  assert.deepEqual(calls.map((call) => call.bucket), ["request", "mutation", "request", "mutation"]);
  assert.deepEqual(received, [
    {
      action: "set",
      token: "cookie-token",
      input: { productId: PRODUCT_ID, variantId: VARIANT_ID, requestedQuantity: 3 },
    },
    {
      action: "remove",
      token: "cookie-token",
      input: { productId: PRODUCT_ID, variantId: VARIANT_ID },
    },
  ]);

  const invalid = await handleGuestCartRequest(createRequest({
    action: "set_line",
    productId: PRODUCT_ID,
    requestedQuantity: 100,
  }), base);
  assert.deepEqual(invalid, { status: 400, body: { ok: false, code: "invalid_request" } });
});

test("body is bounded to 4 KiB and rejects unknown fields", async () => {
  const oversized = await handleGuestCartRequest(
    createRequest(JSON.stringify({ action: "read", padding: "x".repeat(5000) })),
    dependencies(),
  );
  const unknownField = await handleGuestCartRequest(
    createRequest({ action: "read", unexpected: true }),
    dependencies(),
  );
  assert.deepEqual(oversized, { status: 400, body: { ok: false, code: "invalid_request" } });
  assert.deepEqual(unknownField, { status: 400, body: { ok: false, code: "invalid_request" } });
});

test("Next route is POST-only, private/no-store and durable-rate-limit fail-closed", () => {
  const route = readFileSync("src/app/api/cart/route.ts", "utf8");
  const limiter = readFileSync("src/lib/supabase/guest-cart-rate-limit-server.ts", "utf8");
  assert.match(route, /export async function POST/);
  assert.doesNotMatch(route, /export (?:async )?function (?:GET|PUT|PATCH|DELETE)/);
  assert.match(route, /private, no-store/);
  assert.match(route, /Vary: "Cookie, Origin"/);
  assert.match(route, /response\.cookies\.set/);
  assert.match(limiter, /COMMERCE_GUEST_CART_ENABLED/);
  assert.match(limiter, /consume_guest_cart_rate_limit/);
  assert.doesNotMatch(`${route}\n${limiter}`, /console\.|NEXT_PUBLIC_[A-Z0-9_]*(?:SECRET|RATE_LIMIT)/);
});
