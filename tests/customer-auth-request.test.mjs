import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";
import {
  CUSTOMER_AUTH_REQUEST_HEADER,
  CUSTOMER_AUTH_REQUEST_HEADER_VALUE,
  createCustomerAuthRateLimitKey,
  getCustomerAuthEnvironment,
  getCustomerAuthSourceIdentifier,
  handleCustomerAuthRequest,
} from "../src/features/auth/customer-auth-request.ts";

const ORIGIN = "https://luminalfactory.com";
const RATE_SECRET = "0123456789abcdef0123456789abcdef";

function readyEnvironment() {
  return getCustomerAuthEnvironment({
    COMMERCE_CUSTOMER_AUTH_ENABLED: "true",
    COMMERCE_CUSTOMER_AUTH_ALLOWED_ORIGINS: ORIGIN,
    NEXT_PUBLIC_SUPABASE_URL: "https://example.supabase.co",
    NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY: "public-key",
    NEXT_PUBLIC_CLOUDFLARE_TURNSTILE_SITE_KEY: "turnstile-site-key",
    COMMERCE_CUSTOMER_AUTH_RATE_LIMIT_SECRET: RATE_SECRET,
  });
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

function createRequest(body, headers = {}) {
  return new Request(`${ORIGIN}/api/account/auth`, {
    method: "POST",
    headers: {
      "content-type": "application/json",
      origin: ORIGIN,
      "sec-fetch-site": "same-origin",
      [CUSTOMER_AUTH_REQUEST_HEADER]: CUSTOMER_AUTH_REQUEST_HEADER_VALUE,
      ...headers,
    },
    body: typeof body === "string" ? body : JSON.stringify(body),
  });
}

function createService(overrides = {}) {
  const calls = { requestOtp: [], verifyOtp: [] };
  return {
    calls,
    service: {
      async requestOtp(input) {
        calls.requestOtp.push(input);
        return true;
      },
      async verifyOtp(input) {
        calls.verifyOtp.push(input);
        return true;
      },
      ...overrides,
    },
  };
}

test("customer Auth is default-off and requires complete isolated configuration", () => {
  assert.deepEqual(getCustomerAuthEnvironment({}), { ready: false, code: "runtime_disabled" });
  for (const missing of [
    "COMMERCE_CUSTOMER_AUTH_ALLOWED_ORIGINS",
    "NEXT_PUBLIC_SUPABASE_URL",
    "NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY",
    "NEXT_PUBLIC_CLOUDFLARE_TURNSTILE_SITE_KEY",
    "COMMERCE_CUSTOMER_AUTH_RATE_LIMIT_SECRET",
  ]) {
    const environment = {
      COMMERCE_CUSTOMER_AUTH_ENABLED: "true",
      COMMERCE_CUSTOMER_AUTH_ALLOWED_ORIGINS: ORIGIN,
      NEXT_PUBLIC_SUPABASE_URL: "https://example.supabase.co",
      NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY: "public-key",
      NEXT_PUBLIC_CLOUDFLARE_TURNSTILE_SITE_KEY: "turnstile-site-key",
      COMMERCE_CUSTOMER_AUTH_RATE_LIMIT_SECRET: RATE_SECRET,
    };
    delete environment[missing];
    assert.deepEqual(getCustomerAuthEnvironment(environment), { ready: false, code: "runtime_unavailable" });
  }
});

test("customer Auth rejects unsafe origins and Supabase endpoints", () => {
  for (const [origin, supabaseUrl] of [
    ["*", "https://example.supabase.co"],
    ["http://luminalfactory.com", "https://example.supabase.co"],
    [`${ORIGIN}/account`, "https://example.supabase.co"],
    [ORIGIN, "http://example.supabase.co"],
    [ORIGIN, "https://user@example.supabase.co"],
  ]) {
    assert.deepEqual(getCustomerAuthEnvironment({
      COMMERCE_CUSTOMER_AUTH_ENABLED: "true",
      COMMERCE_CUSTOMER_AUTH_ALLOWED_ORIGINS: origin,
      NEXT_PUBLIC_SUPABASE_URL: supabaseUrl,
      NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY: "public-key",
      NEXT_PUBLIC_CLOUDFLARE_TURNSTILE_SITE_KEY: "turnstile-site-key",
      COMMERCE_CUSTOMER_AUTH_RATE_LIMIT_SECRET: RATE_SECRET,
    }), { ready: false, code: "runtime_unavailable" });
  }
});

test("disabled Auth short-circuits without reading input or calling the provider", async () => {
  const { service, calls } = createService();
  const outcome = await handleCustomerAuthRequest(new Request(`${ORIGIN}/api/account/auth`, { method: "POST" }), {
    environment: { ready: false, code: "runtime_disabled" },
    service,
  });
  assert.deepEqual(outcome, { status: 404, body: { ok: false, code: "auth_unavailable" } });
  assert.deepEqual(calls, { requestOtp: [], verifyOtp: [] });
});

test("Auth limiter keys hide raw email and source identifiers", () => {
  assert.equal(
    getCustomerAuthSourceIdentifier(new Headers({ "x-forwarded-for": "203.0.113.10, 198.51.100.2" })),
    "203.0.113.10",
  );
  assert.equal(getCustomerAuthSourceIdentifier(new Headers({ "x-forwarded-for": "invalid" })), undefined);
  const emailKey = createCustomerAuthRateLimitKey(RATE_SECRET, "email", "maker@example.com");
  const sourceKey = createCustomerAuthRateLimitKey(RATE_SECRET, "source", "203.0.113.10");
  assert.match(emailKey, /^[0-9a-f]{64}$/);
  assert.match(sourceKey, /^[0-9a-f]{64}$/);
  assert.notEqual(emailKey, sourceKey);
  assert.doesNotMatch(`${emailKey}${sourceKey}`, /maker|example|203\.0\.113/);
});

test("Auth request boundary rejects cross-origin, unsupported content and missing CSRF header", async () => {
  const { service } = createService();
  const invalidRequests = [
    createRequest({ action: "verify_otp", email: "maker@example.com", token: "123456" }, { origin: "https://evil.example" }),
    createRequest({ action: "verify_otp", email: "maker@example.com", token: "123456" }, { "content-type": "text/plain" }),
    createRequest({ action: "verify_otp", email: "maker@example.com", token: "123456" }, { [CUSTOMER_AUTH_REQUEST_HEADER]: "0" }),
    createRequest({ action: "verify_otp", email: "maker@example.com", token: "123456" }, { "sec-fetch-site": "cross-site" }),
  ];
  for (const request of invalidRequests) {
    assert.deepEqual(await handleCustomerAuthRequest(request, dependencies({ service })), {
      status: 403,
      body: { ok: false, code: "invalid_request" },
    });
  }
});

test("OTP request requires CAPTCHA, normalizes email and returns no identity data", async () => {
  const { service, calls } = createService();
  const outcome = await handleCustomerAuthRequest(createRequest({
    action: "request_otp",
    email: "Maker@Example.COM",
    captchaToken: "verified-turnstile-token",
  }), dependencies({ service }));

  assert.deepEqual(outcome, { status: 202, body: { ok: true, state: "otp_sent" } });
  assert.deepEqual(calls.requestOtp, [{
    email: "maker@example.com",
    captchaToken: "verified-turnstile-token",
  }]);
  assert.doesNotMatch(JSON.stringify(outcome.body), /maker@example|user|session|token/i);

  const missingCaptcha = await handleCustomerAuthRequest(createRequest({
    action: "request_otp",
    email: "maker@example.com",
    captchaToken: "short",
  }), dependencies({ service }));
  assert.deepEqual(missingCaptcha, { status: 400, body: { ok: false, code: "invalid_request" } });
});

test("OTP verification accepts only six digits and maps provider failures generically", async () => {
  const { service, calls } = createService();
  const outcome = await handleCustomerAuthRequest(createRequest({
    action: "verify_otp",
    email: "maker@example.com",
    token: "123456",
  }), dependencies({ service }));
  assert.deepEqual(outcome, { status: 200, body: { ok: true, state: "authenticated" } });
  assert.deepEqual(calls.verifyOtp, [{ email: "maker@example.com", token: "123456" }]);

  for (const token of ["12345", "1234567", "abcdef"]) {
    const invalid = await handleCustomerAuthRequest(createRequest({
      action: "verify_otp",
      email: "maker@example.com",
      token,
    }), dependencies({ service }));
    assert.deepEqual(invalid, { status: 400, body: { ok: false, code: "invalid_request" } });
  }

  const rejected = createService({ async verifyOtp() { return false; } });
  assert.deepEqual(await handleCustomerAuthRequest(createRequest({
    action: "verify_otp",
    email: "maker@example.com",
    token: "123456",
  }), dependencies({ service: rejected.service })), {
    status: 400,
    body: { ok: false, code: "invalid_or_expired_otp" },
  });
});

test("Auth initiation and verification apply distinct durable limits before provider calls", async () => {
  const { service, calls: serviceCalls } = createService();
  const allowed = createRateLimiter();
  await handleCustomerAuthRequest(createRequest({
    action: "request_otp",
    email: "maker@example.com",
    captchaToken: "verified-turnstile-token",
  }), dependencies({ service, rateLimiter: allowed.rateLimiter }));
  assert.deepEqual(allowed.calls.map((call) => call.bucket), ["otp_source_hour", "otp_email_15m"]);
  assert.equal(serviceCalls.requestOtp.length, 1);

  const limited = createRateLimiter((input) => input.bucket === "otp_email_15m" ? "limited" : "allowed");
  const limitedOutcome = await handleCustomerAuthRequest(createRequest({
    action: "request_otp",
    email: "maker@example.com",
    captchaToken: "verified-turnstile-token",
  }), dependencies({ service, rateLimiter: limited.rateLimiter }));
  assert.deepEqual(limitedOutcome, { status: 429, body: { ok: false, code: "rate_limited" } });
  assert.equal(serviceCalls.requestOtp.length, 1);

  const unavailable = createRateLimiter("unavailable");
  const unavailableOutcome = await handleCustomerAuthRequest(createRequest({
    action: "verify_otp",
    email: "maker@example.com",
    token: "123456",
  }), dependencies({ service, rateLimiter: unavailable.rateLimiter }));
  assert.deepEqual(unavailableOutcome, { status: 503, body: { ok: false, code: "auth_unavailable" } });
  assert.equal(serviceCalls.verifyOtp.length, 0);
});

test("route and server adapter keep Auth dynamic, private and fresh-user verified", () => {
  const route = readFileSync("src/app/api/account/auth/route.ts", "utf8");
  const adapter = readFileSync("src/lib/supabase/customer-auth-server.ts", "utf8");
  const limiter = readFileSync("src/lib/supabase/customer-auth-rate-limit-server.ts", "utf8");
  assert.match(route, /dynamic = "force-dynamic"/);
  assert.match(route, /private, no-store/);
  assert.match(adapter, /createServerClient/);
  assert.match(adapter, /captchaToken/);
  assert.match(adapter, /shouldCreateUser: true/);
  assert.match(adapter, /auth\.getUser\(\)/);
  assert.match(limiter, /consume_customer_auth_rate_limit/);
  assert.doesNotMatch(`${route}\n${adapter}`, /SUPABASE_SECRET_KEY|service_role|user_metadata/);
});

test("customer Auth limiter migration is private, fixed-policy and cleanup-bounded", () => {
  const migration = readFileSync(
    "supabase/migrations/20260826091055_add_customer_auth_rate_limits.sql",
    "utf8",
  );
  assert.match(migration, /create table private\.customer_auth_rate_limits/);
  assert.match(migration, /alter table private\.customer_auth_rate_limits enable row level security/);
  assert.match(migration, /security invoker/);
  assert.match(migration, /when 'otp_email_15m' then 3/);
  assert.match(migration, /when 'otp_source_hour' then 10/);
  assert.match(migration, /revoke execute[\s\S]*from public, anon, authenticated/);
  assert.match(migration, /commerce-customer-auth-rate-limit-cleanup/);
  assert.doesNotMatch(migration, /raw_email|email_address|source_ip|security definer/i);
});
