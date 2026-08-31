# Phase 6 Customer Auth Production Smoke Runbook

## Document metadata

- **Status:** `PREPARED_PRODUCTION_ACTIVATION_APPROVAL_REQUIRED`
- **Date:** 2026-08-28
- **Application target:** `https://luminalfactory.com` on the exact deployed
  `master` commit
- **Approved test identity:** `tungduy165@gmail.com`
- **Runtime before and after:** `COMMERCE_CUSTOMER_AUTH_ENABLED=false`

## Purpose and bounded scope

Validate exactly one email-OTP login, Cloudflare Turnstile enforcement,
cookie-backed session refresh and local sign-out against the early Production
storefront. This runbook follows the owner's single-branch delivery policy, but
it does not itself authorize enabling Production Auth or sending email.

The enabled window requires a new explicit approval because it changes a live
security boundary, sends one external email and may create one Supabase Auth
user. It does not authorize customer linking, guest-cart attachment, saved
addresses, orders, payments, raffle identity or global Account navigation.

## Required Production configuration

Configure values only in Vercel Production:

- existing Commerce `NEXT_PUBLIC_SUPABASE_URL` and publishable key;
- `NEXT_PUBLIC_CLOUDFLARE_TURNSTILE_SITE_KEY` as public Config;
- `COMMERCE_CUSTOMER_AUTH_ALLOWED_ORIGINS=https://luminalfactory.com`;
- a distinct server-only `COMMERCE_CUSTOMER_AUTH_RATE_LIMIT_SECRET` of at least
  32 characters;
- `COMMERCE_CUSTOMER_AUTH_ENABLED=false` for the disabled baseline.

Supabase Auth must have the reviewed custom SMTP and Turnstile secret. The
Turnstile hostname allowlist must include `luminalfactory.com`. Never put the
SMTP password, Turnstile secret, OTP, session cookie or rate-limit secret in
Git, screenshots, application logs or chat.

## Preflight and disabled baseline

1. Require a clean `master`; record the full local, GitHub and Vercel source SHA
   and prove all three are identical.
2. Require GitHub quality checks and Vercel Production deployment status
   `READY` for that SHA.
3. Confirm `/account` returns HTTP 200, stays `noindex`, and reports the disabled
   account state.
4. Submit one syntactically valid same-origin sign-out request. Require HTTP 404
   `auth_unavailable`, private/no-store behavior and no `Set-Cookie` mutation.
5. Read aggregate Supabase baselines for Auth users, customers, carts, cart
   items and customer-Auth limiter rows. Never print unrelated identities or
   delete unexpected data to make the baseline pass.
6. Confirm the configured SMTP sender can deliver to the approved test address.
   Supabase's default SMTP restrictions are not an acceptable substitute for
   this check.

Stop if source SHAs differ, the deployment is not Production `READY`, runtime is
already enabled, configuration is incomplete or the disabled request performs
provider/database work.

## Enabled OTP smoke — separate approval required

1. Obtain explicit approval to enable customer Auth on Production for this one
   bounded smoke.
2. Change only `COMMERCE_CUSTOMER_AUTH_ENABLED=true` and redeploy the same
   source once. Re-prove the exact SHA and `READY` state.
3. Open `/account`, complete Turnstile and request exactly one OTP for
   `tungduy165@gmail.com`.
4. The owner enters the six-digit OTP in the browser; the OTP is never pasted
   into chat or recorded in logs.
5. Require the page to show the verified email, refresh once and confirm the
   cookie-backed session remains authenticated.
6. Sign out using the Account control and require the route to return to the
   email step.
7. Confirm no customer, cart, cart-item, address, order, payment or raffle row
   was created or attached. Record only aggregate Auth and limiter evidence.

Do not test delivery or rate limits by requesting additional real emails.

## Immediate runtime rollback and postflight

1. Restore `COMMERCE_CUSTOMER_AUTH_ENABLED=false` and redeploy the same source
   once.
2. Repeat the disabled route and API probes; require the original disabled
   behavior and no session-cookie mutation.
3. Confirm guest-cart runtime also remains false and no customer/business row
   changed.
4. Reconcile the one test Auth user separately. Deleting it is destructive and
   needs explicit approval after sign-out; never remove it implicitly.
5. Inspect Production runtime errors and Supabase Auth logs without exposing the
   email, OTP, tokens, cookies or raw limiter identifiers.

## Stop conditions

Stop without retrying or broadening scope if:

- more than one OTP email or Auth user is created;
- Turnstile rejects the hostname or site key;
- the OTP email is not delivered through the approved custom SMTP sender;
- any customer/cart/business row changes;
- response caching, session isolation or sign-out behaves unexpectedly;
- any credential, OTP, session token or raw PII appears in logs.
