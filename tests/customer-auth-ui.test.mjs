import assert from "node:assert/strict";
import { existsSync, readFileSync } from "node:fs";
import test from "node:test";

const read = (path) => readFileSync(path, "utf8");

test("Account route is dynamic, private-search and default-off", () => {
  const page = read("src/app/account/page.tsx");
  assert.match(page, /dynamic = "force-dynamic"/);
  assert.match(page, /robots: \{ index: false, follow: false \}/);
  assert.match(page, /getCustomerAuthEnvironment/);
  assert.match(page, /Account chưa được mở trên môi trường này/);
  assert.match(page, /environment\.ready && siteKey/);
  assert.equal(existsSync("src/app/account/loading.tsx"), true);
});

test("Account OTP form uses explicit Turnstile and accessible staged controls", () => {
  const panel = read("src/features/auth/customer-account-panel.tsx");
  const client = read("src/features/auth/customer-auth-client.ts");
  assert.match(panel, /turnstile\/v0\/api\.js\?render=explicit/);
  assert.match(panel, /size: "flexible"/);
  assert.match(panel, /"expired-callback"/);
  assert.match(panel, /"error-callback"/);
  assert.match(panel, /type="email"/);
  assert.match(panel, /autoComplete="one-time-code"/);
  assert.match(panel, /inputMode="numeric"/);
  assert.match(panel, /aria-live="polite"/);
  assert.match(panel, /role="alert"/);
  assert.match(client, /cache: "no-store"/);
  assert.match(client, /CUSTOMER_AUTH_REQUEST_HEADER = "x-luminal-auth-request"/);
  assert.match(client, /CUSTOMER_AUTH_REQUEST_HEADER_VALUE = "1"/);
  assert.match(client, /customerAuthResponseSchema\.safeParse/);
  assert.doesNotMatch(`${panel}\n${client}`, /console\.|localStorage|sessionStorage/);
});

test("Account session refresh is limited to Account routes and remains runtime-gated", () => {
  const proxyEntry = read("src/proxy.ts");
  const proxyService = read("src/lib/supabase/customer-auth-proxy.ts");
  assert.match(proxyEntry, /"\/account\/:path\*"/);
  assert.match(proxyEntry, /"\/api\/account\/:path\*"/);
  assert.match(proxyService, /COMMERCE_CUSTOMER_AUTH_ENABLED/);
  assert.match(proxyService, /request\.cookies\.set/);
  assert.match(proxyService, /response\.cookies\.set/);
  assert.match(proxyService, /auth\.getClaims\(\)/);
  assert.doesNotMatch(proxyService, /getSession\(/);
});
