# Phase 6 Guest Cart Request Boundary Technical Plan

## Document metadata

- **Status:** `CODE_COMPLETE_STAGING_RUNBOOK_READY`
- **Date:** 2026-08-14
- **Runtime:** `DEFAULT_OFF_FAIL_CLOSED`
- **Endpoint:** `POST /api/cart`
- **Depends on:** `phase6-guest-cart-service-technical-plan.md`

## Scope

Connect the internal guest-cart service to one thin POST-only Next.js Route Handler while preserving the disabled runtime gate.

Accepted action bodies are strictly limited to:

- `{ "action": "create" }`;
- `{ "action": "read" }`;
- `{ "action": "set_line", "productId", "variantId?", "requestedQuantity" }`;
- `{ "action": "remove_line", "productId", "variantId?" }`.

There is no GET, PUT, PATCH or DELETE handler. The request body is limited to 4 KiB and Zod rejects unknown fields.

## Request protection

Before any Supabase client or cart service is reached, the boundary requires:

1. `COMMERCE_GUEST_CART_ENABLED=true` exactly;
2. an exact HTTPS origin from `COMMERCE_GUEST_CART_ALLOWED_ORIGINS` (localhost HTTP only for development);
3. `Content-Type: application/json`;
4. `X-Luminal-Cart-Request: 1`, preventing ordinary cross-site form submission;
5. `Sec-Fetch-Site: same-origin` when the browser provides that header;
6. a valid Vercel-forwarded source IP transformed into an HMAC-SHA-256 key with `COMMERCE_GUEST_CART_RATE_LIMIT_SECRET`;
7. an available durable rate limiter.

The limiter contract enforces 240 total requests/hour, 20 cart creations/hour and 120 mutations/hour per keyed source. Missing source identity, configuration, service or limiter returns `service_unavailable` without a cart write. Exhaustion returns generic `rate_limited`.

A process-local limiter is explicitly rejected because Vercel functions scale horizontally. The reviewed zero-recurring-cost direction uses the existing Supabase Postgres database: a private default-deny counter table, a service-role-only `SECURITY INVOKER` RPC and hourly Supabase Cron cleanup. The database owns the fixed limits, so application input cannot raise them.

The server adapter is code-complete and maps RPC errors, thrown failures or malformed results to `unavailable`. The reviewed limiter migration was applied on 2026-08-15 as `20260815022728_add_guest_cart_rate_limits`; generated production types now own its RPC signature. Runtime remains default-off because no staging or production server-only configuration has been added.

## Cookie and response contract

Successful creation places the raw token directly into `lf_guest_cart` with `HttpOnly`, `SameSite=Lax`, `Path=/`, 30-day max age and `Secure` in production. The token is never present in the JSON body. Altered, expired and unknown credentials return the same `cart_unavailable` response and clear the cookie.

All responses use:

- `Cache-Control: private, no-store, max-age=0`;
- `Pragma: no-cache`;
- `Vary: Cookie, Origin`;
- `X-Content-Type-Options: nosniff`.

The endpoint returns no database cart ID, token hash, raw token, stack trace or internal Supabase error.

## Validation

Behavior and static tests prove:

- runtime-disabled short-circuit occurs before parsing/service access;
- wildcard/path/insecure production origins and short HMAC secrets fail configuration;
- cross-origin, non-JSON, missing custom-header and cross-site requests are rejected;
- raw source IP is replaced with a stable keyed hash;
- missing/exhausted/unavailable rate limiting stops the service;
- the adapter sends only the HMAC key and bucket, never a client-controlled limit;
- the migration statically enforces atomic upsert, fixed policy, least privilege and expiry cleanup;
- create is idempotent for an already valid cookie;
- raw token is cookie-only, not JSON;
- invalid credentials request cookie clearing;
- line actions are bounded and receive request/mutation limits;
- the route exports POST only and remains private/no-store.

## Remaining gate

1. Review `phase6-guest-cart-staging-runbook.md` and keep the staging verifier inert until configuration approval.
2. Configure only one branch-scoped Preview origin and server secrets, with the runtime flag false first.
3. Run the non-mutating disabled probe.
4. Obtain separate approval before enabling Preview and running the bounded create/delete smoke.
5. Complete negative authorization, concurrency, cookie, cleanup, advisor and runtime-error postflight.
6. Production runtime activation remains a separate explicit approval.
