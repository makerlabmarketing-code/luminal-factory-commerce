import assert from "node:assert/strict";
import { existsSync, readFileSync } from "node:fs";
import test from "node:test";

const read = (path) => readFileSync(path, "utf8");

test("raffle detail route stays thin, dynamic and server-rendered", () => {
  const routePath = "src/app/raffle/[slug]/page.tsx";
  assert.equal(existsSync(routePath), true);
  const route = read(routePath);
  assert.match(route, /params: Promise<\{ slug: string \}>/);
  assert.match(route, /await params/);
  assert.match(route, /getPublishedRaffleBySlug/);
  assert.match(route, /notFound\(\)/);
  assert.match(route, /dynamic = "force-dynamic"/);
  assert.doesNotMatch(route, /createClient|\.from\(|\.rpc\(/);
});

test("raffle runtime is independently default-off and server-only", () => {
  const request = read("src/features/raffle/raffle-entry-request.ts");
  const server = read("src/lib/supabase/raffle-entry-server.ts");
  const detail = read("src/features/raffle/raffle-detail-service.ts");
  assert.match(request, /COMMERCE_RAFFLE_ENTRY_ENABLED/);
  assert.match(request, /runtime_disabled/);
  assert.match(detail, /COMMERCE_RAFFLE_DETAIL_ENABLED/);
  assert.match(server, /import "server-only"/);
  assert.match(server, /SUPABASE_SECRET_KEY/);
  assert.match(server, /COMMERCE_RAFFLE_ENTRY_TURNSTILE_SECRET/);
  assert.doesNotMatch(read("src/features/raffle/raffle-entry-form.tsx"), /SUPABASE_SECRET_KEY|TURNSTILE_SECRET/);
});

test("raffle adapters use the canonical Production-generated contract", () => {
  const types = read("src/lib/supabase/database.types.ts");
  const server = read("src/lib/supabase/raffle-entry-server.ts");
  const detail = read("src/features/raffle/raffle-detail-service.ts");
  assert.match(types, /raffles:/);
  assert.match(types, /raffle_entries:/);
  assert.match(types, /submit_guest_raffle_entry:/);
  assert.match(types, /consume_raffle_entry_rate_limit:/);
  assert.match(server, /import type \{ Database \}/);
  assert.match(detail, /import type \{ Database \}/);
  assert.doesNotMatch(server, /type RaffleEntryDatabase =/);
});

test("raffle request boundary rejects cross-site and oversized input", () => {
  const request = read("src/features/raffle/raffle-entry-request.ts");
  const route = read("src/app/api/raffle-entry/route.ts");
  assert.match(request, /RAFFLE_ENTRY_REQUEST_MAX_BYTES = 8 \* 1024/);
  assert.match(request, /contentType !== "application\/json"/);
  assert.match(request, /allowedOrigins\.has\(origin\)/);
  assert.match(request, /sec-fetch-site/);
  assert.match(request, /RAFFLE_ENTRY_REQUEST_HEADER/);
  assert.match(route, /private, no-store/);
  assert.match(route, /export async function POST/);
  assert.doesNotMatch(route, /export async function GET/);
});

test("raffle entry requires captcha and durable source/email limits before mutation", () => {
  const request = read("src/features/raffle/raffle-entry-request.ts");
  const server = read("src/lib/supabase/raffle-entry-server.ts");
  assert.match(request, /source_hour/);
  assert.match(request, /email_raffle_15m/);
  assert.match(request, /captchaVerifier\.verify/);
  assert.match(server, /turnstile\/v0\/siteverify/);
  assert.match(server, /result\.success === true/);
  assert.match(server, /result\.action === "raffle_entry"/);
  assert.match(server, /result\.hostname === expectedHostname/);
  assert.match(server, /submit_guest_raffle_entry/);
});

test("raffle form communicates non-transactional and duplicate semantics", () => {
  const form = read("src/features/raffle/raffle-entry-form.tsx");
  const detail = read("src/features/raffle/raffle-detail.tsx");
  assert.match(form, /Entry không phải order/);
  assert.match(form, /already_entered/);
  assert.match(form, /Mã tham chiếu/);
  assert.match(form, /rulesAccepted/);
  assert.match(form, /aria-live="polite"/);
  assert.match(detail, /Máy chủ và database quyết định/);
  assert.doesNotMatch(`${form}\n${detail}`, /createOrder|reserveInventory|payment provider|winner selection algorithm/i);
});
