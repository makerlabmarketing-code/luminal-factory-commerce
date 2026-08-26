# Phase 6 Customer Auth Staging Runbook

## Document metadata

- **Status:** `PREPARED_APPROVAL_REQUIRED`
- **Date:** 2026-08-26
- **Target:** one exact-head, non-production Vercel Preview for Luminal Factory Commerce
- **Runtime default:** `COMMERCE_CUSTOMER_AUTH_ENABLED=false`

## Purpose and bounded scope

Validate the default-off Account foundation, one email OTP login, Cloudflare Turnstile enforcement, cookie-backed session refresh and local sign-out without enabling Production Auth or attaching customer, cart, address, order, payment or raffle data.

This runbook does not authorize execution. The enabled portion creates an Auth user and sends email, so it requires explicit owner approval after the exact Preview and operator-owned test email are identified.

## Required configuration

- Supabase custom SMTP and CAPTCHA protection are configured for the Commerce project and have passed operator review.
- The Cloudflare Turnstile widget allows the selected Preview hostname.
- Vercel Preview has `NEXT_PUBLIC_CLOUDFLARE_TURNSTILE_SITE_KEY` as public Config, not Secret.
- Preview has the existing Commerce Supabase URL and publishable key.
- Preview has server-only `COMMERCE_CUSTOMER_AUTH_ALLOWED_ORIGINS` set to the exact Preview origin and a distinct 32-plus-character `COMMERCE_CUSTOMER_AUTH_RATE_LIMIT_SECRET`.
- Preview starts with `COMMERCE_CUSTOMER_AUTH_ENABLED=false`; Production remains false or absent.

Do not place the Turnstile secret, Supabase secret key, SMTP password, OTP or rate-limit secret in source, logs, workflow inputs, screenshots or chat.

## Exact-head preflight

1. Record the full branch commit SHA and require the Preview source SHA to match it exactly.
2. Require Vercel to classify the deployment as Preview, never Production.
3. Require the stable Preview origin used by `COMMERCE_CUSTOMER_AUTH_ALLOWED_ORIGINS` to resolve to that exact deployment.
4. Confirm Production guest cart and customer Auth remain false or absent.
5. Confirm the operator-owned test email and the expected Auth-user baseline without printing unrelated identities.
6. Confirm carts, cart items and customers have no unexpected rows. Never delete unexpected data to make the smoke pass.

## Disabled probe

With Preview runtime false, submit one syntactically valid same-origin `POST /api/account/auth`. Require:

- HTTP `404` with generic `auth_unavailable`;
- private/no-store response behavior;
- zero Auth-user, customer, cart and cart-item changes;
- zero customer-Auth limiter rows.

Stop if the disabled boundary performs provider or database work.

## Enabled smoke — separate approval required

1. Change only the exact Preview branch runtime to `COMMERCE_CUSTOMER_AUTH_ENABLED=true` and redeploy once.
2. Re-prove exact source SHA, Preview classification and allowed origin.
3. Open `/account`, complete Turnstile and request exactly one OTP for the approved operator-owned email.
4. Enter the received six-digit OTP exactly once and require the page to show an authenticated session for that email.
5. Refresh `/account` and require the cookie-backed session to remain authenticated.
6. Sign out through the Account control and require `/account` to return to the email step.
7. Confirm no customer, address, cart, cart-item, order, payment or raffle row was created or attached.
8. Record only aggregate limiter/Auth evidence; never record the OTP, session cookie or raw source identifier.

Do not test rate limits by sending repeated real emails. Database threshold behavior is already covered by the applied limiter migration.

## Runtime rollback and postflight

1. Restore the branch-scoped Preview runtime to `COMMERCE_CUSTOMER_AUTH_ENABLED=false` and redeploy the same exact source once.
2. Repeat the disabled probe and require `404 auth_unavailable` with no writes.
3. Confirm Production Auth and guest cart remain false or absent.
4. Reconcile the one test Auth user separately. Deleting it is destructive and requires explicit approval after sign-out; do not remove it implicitly in this runbook.
5. Leave customer RLS, cart attachment, saved addresses and Production navigation disconnected.

## Stop conditions

Stop without retrying or broadening scope if:

- Preview source differs from the selected full SHA;
- deployment is Production or origin is not exactly allowlisted;
- Turnstile reports an unauthorized hostname or invalid site key;
- OTP email is not delivered through the approved sender;
- more than one OTP email or Auth user is created;
- any customer/cart/business row changes;
- cookies, OTPs, raw email/source limiter identifiers or secrets appear in logs.
