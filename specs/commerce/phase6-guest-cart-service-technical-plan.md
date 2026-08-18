# Phase 6 Guest Cart Server Service Technical Plan

## Document metadata

- **Status:** `CODE_COMPLETE_RUNTIME_DISABLED`
- **Date:** 2026-08-14
- **Depends on:** applied Slice A schema and `phase6-cart-identity-schema-rls-technical-plan.md`
- **Runtime exposure:** the later `POST /api/cart` boundary now exists but remains default-off and fail-closed until isolated staging configuration is approved; no Cart UI is connected

## Scope

Implement the trusted server-side guest-cart service boundary only:

- generate 32 random bytes and encode them as an opaque base64url cookie token;
- persist/query only its SHA-256 `bytea` representation;
- create, read, set and remove guest-cart lines through an injected repository;
- accept quantities from 1 through 99;
- require the product to be published and an optional variant to be active and belong to that product;
- treat expired, altered and unknown credentials identically;
- hide unavailable catalog lines from the public cart view while reporting a count for later customer messaging;
- refresh the 30-day inactivity boundary on mutations and at most once per 24 hours on reads;
- keep persistence behind the server-only Commerce secret key and an exact runtime flag.

This slice does not read inventory, reserve stock, snapshot price, create orders/payments, collect PII, configure Auth, call ERP or expose a request endpoint.

## Runtime gate

`COMMERCE_GUEST_CART_ENABLED` must equal `true` before the adapter creates a Supabase client. Missing/false values return `runtime_disabled`. If enabled without both the Commerce URL and `SUPABASE_SECRET_KEY`, the service fails closed as `runtime_unavailable`.

The secret key is never public, never prefixed with `NEXT_PUBLIC_` and is not required while the flag remains false. The current production environment must remain false/unconfigured until the request-boundary and staging gates pass.

## Trust and response boundary

The service returns no database cart ID or token hash. Cart creation returns the raw token only to the future trusted request boundary so it can be placed directly into an `HttpOnly` cookie; it must never be serialized into JSON, logged or rendered. Other operations accept the cookie value internally and return only currency, expiry, allowed line identifiers/quantity and the unavailable-line count.

Persistence selects only required cart, cart-line and catalog-publication fields. The repository does not reference inventory, orders, payments, refunds or commerce events. Absolute quantity updates retry one partial-unique-index race once, so request retry does not increment quantities accidentally.

## Validation

Behavior tests cover:

- disabled and misconfigured fail-closed behavior;
- token entropy/format, deterministic hash and production cookie attributes;
- no cart ID/hash in the returned cart view;
- generic altered/unknown/expired credential failure;
- cross-guest isolation;
- quantity and published product/variant validation;
- removal, unavailable-line reconciliation and bounded inactivity writes;
- static denial of public secret names, token logging and inventory/order/payment authority.

## Follow-up boundary

The request boundary is now implemented and reviewed in `phase6-guest-cart-request-boundary-technical-plan.md` with:

1. a POST-only Route Handler;
2. exact-origin/content-type validation and CSRF handling;
3. `HttpOnly`, `SameSite=Lax`, `Path=/`, production-`Secure` cookie set/clear behavior;
4. fail-closed cart-creation/mutation rate-limit contracts;
5. generic response mapping, `Cache-Control: private, no-store` and log-redaction tests;
6. an explicit staging configuration/negative-authorization gate.

The durable Supabase rate-limit adapter and migration are code-complete. On 2026-08-15 the exact migration passed production rollback validation, was applied once as `20260815022728_add_guest_cart_rate_limits`, and passed database postflight with zero retained counters. The isolated staging runbook and guarded smoke verifier are now code-complete without any configured secret or runtime activation. Staging execution and production activation remain separate explicit approvals.
