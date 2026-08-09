import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

const read = (path) => readFileSync(new URL(`../${path}`, import.meta.url), "utf8");

const page = read("src/app/commission/page.tsx");
const discovery = read("src/features/commission/commission-discovery.tsx");
const form = read("src/features/commission/commission-inquiry-form.tsx");
const schema = read("src/features/commission/commission-inquiry-schema.ts");
const route = read("src/app/api/commission-inquiry/route.ts");
const envExample = read(".env.example");

test("commission page gates inquiry availability from server-only transport env", () => {
  assert.match(page, /RESEND_API_KEY/);
  assert.match(page, /COMMISSION_INQUIRY_FROM_EMAIL/);
  assert.match(page, /COMMISSION_INQUIRY_TO_EMAIL/);
  assert.match(page, /CommissionDiscovery content=\{content\} inquiryEnabled=\{inquiryEnabled\}/);
});

test("commission discovery includes the inquiry form without changing request semantics", () => {
  assert.match(discovery, /CommissionInquiryForm enabled=\{inquiryEnabled\}/);
  assert.match(discovery, /không tạo order, quote, payment/);
});

test("form exposes only the approved first-slice fields and truthful success copy", () => {
  for (const field of ["name", "email", "category", "projectSummary", "referenceUrl", "timingContext", "budgetContext", "privacyAccepted"]) {
    assert.match(form, new RegExp(`name=\\"${field}\\"`));
  }
  assert.match(form, /crypto\.randomUUID\(\)/);
  assert.match(form, /studio review/);
  assert.doesNotMatch(form, /type=\"file\"/);
});

test("server validation and Resend transport are fail-closed and idempotent", () => {
  assert.match(schema, /z\.string\(\)\.uuid\(\)/);
  assert.match(schema, /privacyAccepted: z\.literal\(true\)/);
  assert.match(schema, /website: z\.string\(\)\.max\(0\)/);
  assert.match(route, /transport_unavailable/);
  assert.match(route, /https:\/\/api\.resend\.com\/emails/);
  assert.match(route, /Idempotency-Key/);
  assert.match(route, /reply_to: input\.email/);
  assert.doesNotMatch(route, /supabase/i);
});

test("commission transport secrets remain server-only in the environment contract", () => {
  assert.match(envExample, /^RESEND_API_KEY=/m);
  assert.match(envExample, /^COMMISSION_INQUIRY_FROM_EMAIL=/m);
  assert.match(envExample, /^COMMISSION_INQUIRY_TO_EMAIL=/m);
  assert.doesNotMatch(envExample, /NEXT_PUBLIC_RESEND/);
});
