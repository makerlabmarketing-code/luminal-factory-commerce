# Phase 6 Integrated Customer Cart Production Smoke Runbook

## Document metadata

- **Status:** `PREPARED_APPROVAL_REQUIRED`
- **Date:** 2026-09-20
- **Application target:** `https://luminalfactory.com` on one exact deployed
  `master` source
- **Database target:** Luminal Factory Commerce only
- **Approval gate:** `CART-INTEGRATED-SMOKE-01`
- **Runtime before and after:** every Commerce and raffle runtime flag is `false`

## Purpose and bounded scope

Prove one complete customer-cart transition through the deployed application:

1. an anonymous browser creates one guest cart and one valid direct-shop line;
2. the approved retained test identity completes email OTP verification;
3. login-time merge atomically converts the guest cart to verified ownership;
4. `/cart` reads and mutates that cart only through the verified Auth subject;
5. sign-out, runtime rollback and exact fixture cleanup restore the baseline.

This smoke does not authorize saved addresses, checkout, orders, payments,
inventory reservation, raffle entry, ERP mutation, new dependencies or source
changes. A cart remains purchase intent only.

## Approval boundary

The disabled baseline is read-only. Do not enable runtime, send an OTP, create
or mutate a cart, or clean up database rows until the owner explicitly approves
`CART-INTEGRATED-SMOKE-01`.

The approval must cover one short Production activation window, one OTP email,
one guest cart, one cart line, one verified customer/cart transition, bounded
line mutations, exact cleanup and immediate restoration of all flags to
`false`. It does not become standing authority for later smokes.

## Required pre-existing configuration

The following values must already be valid for Production without printing
their secret contents:

- `NEXT_PUBLIC_SUPABASE_URL` and the publishable key target the Commerce project;
- server-only `SUPABASE_SECRET_KEY` targets the same project;
- `COMMERCE_GUEST_CART_ALLOWED_ORIGINS=https://luminalfactory.com`;
- `COMMERCE_CUSTOMER_AUTH_ALLOWED_ORIGINS=https://luminalfactory.com`;
- distinct server-only guest-cart and customer-Auth rate-limit secrets;
- the reviewed Turnstile public key and Supabase Auth Turnstile secret;
- approved custom SMTP capable of delivering one six-digit OTP.

Never copy secrets, OTPs, cookies, guest tokens, raw limiter keys or session
tokens into Git, chat, screenshots, CI output or application logs.

## Mandatory catalog prerequisite

The smoke needs exactly one owner-approved, already-published direct-shop
product and active variant combination because guest/customer cart writes
revalidate published catalog membership.

Stop if no such catalog row exists. Do not create, publish or repurpose a
temporary Production product under this approval. Record only the chosen
product/variant IDs in the private operator session; do not change price,
publication, media, inventory or product content.

## Read-only preflight

1. Require a clean source and record the full local, GitHub `master` and Vercel
   Production SHA. All three trees must represent the same reviewed source.
2. Require GitHub quality success and Vercel Production `READY` for that SHA.
3. Confirm these runtime gates are exactly `false`:
   - `COMMERCE_GUEST_CART_ENABLED`;
   - `COMMERCE_CUSTOMER_AUTH_ENABLED`;
   - `COMMERCE_CUSTOMER_CART_MERGE_ENABLED`;
   - `COMMERCE_CUSTOMER_CART_ENABLED`;
   - customer-address, raffle-detail and raffle-entry gates.
4. Confirm `/cart` and `/account` return their disabled private/no-store,
   noindex states. `POST /api/cart` and the Auth API must fail closed without
   cookie mutation.
5. Record aggregate baselines for customers, carts, cart items, merge receipts,
   Auth sessions and relevant limiter rows. Do not print identities or hashes.
6. Confirm the three verified-cart RPCs and merge RPC retain service-role-only
   execute grants; browser roles remain denied from cart tables and RPCs.
7. Confirm the retained signed-out OTP-smoke Auth identity is available for the
   owner. Do not create or delete an Auth user during preflight.
8. Select one approved published direct-shop product/variant prerequisite.

Stop on source drift, unexpected rows/sessions, missing configuration, grant or
RLS drift, absent catalog prerequisite, a non-READY deployment, or any already
enabled runtime.

## Enabled Production window — separate approval required

1. Obtain explicit `CART-INTEGRATED-SMOKE-01` approval.
2. Change only the four required runtime gates to exact `true`:
   - `COMMERCE_GUEST_CART_ENABLED`;
   - `COMMERCE_CUSTOMER_AUTH_ENABLED`;
   - `COMMERCE_CUSTOMER_CART_MERGE_ENABLED`;
   - `COMMERCE_CUSTOMER_CART_ENABLED`.
3. Keep addresses, raffle detail/entry, checkout, order, payment and inventory
   functionality disabled. Redeploy the same source once and prove its SHA and
   `READY` state.
4. In a fresh browser profile, create exactly one guest cart through the
   same-origin POST boundary, then set exactly one approved line to quantity 1.
5. Open `/cart`; require one enriched line, current catalog facts, a complete
   USD estimate and no customer identifier, cart ID or guest credential in the
   browser payload.
6. Open `/account`, complete Turnstile and request exactly one OTP for the
   approved retained test identity. The owner enters the six-digit OTP only in
   the browser.
7. Require verification to perform one atomic merge, clear the guest cookie and
   preserve the authenticated session. A refresh must show the same line from
   verified customer ownership without a `sync_required` loop.
8. Through the existing Cart controls, set the line to quantity 2, refresh, set
   it back to 1, then remove it. Require confirmed server state after each step,
   no duplicate logical line and an empty verified cart at the end.
9. Sign out locally and require `/account` to return to the email step. Do not
   request another OTP or exercise rate limits.

## Immediate runtime rollback

1. Restore the four enabled gates to exact `false` and redeploy the identical
   source once before database cleanup.
2. Re-prove the deployment SHA and `READY` state.
3. Confirm `/cart`, `/account`, Cart POST and Auth POST are disabled again and
   do not mutate cookies or data.
4. Confirm every address and raffle runtime remains false and no checkout,
   order, payment or inventory surface became available.

If the rollback deployment fails, stop application interaction, keep the
intended values false, preserve non-secret evidence and treat recovery as the
only active task.

## Exact cleanup and postflight

Cleanup is part of the same approved smoke and must target only IDs recorded for
this run. Never truncate tables or delete by a broad time range.

1. Resolve the exact merge receipt, customer cart and customer created/used by
   the approved Auth subject and smoke guest cart inside the private operator
   session.
2. Delete the exact smoke receipt, empty cart and customer in dependency order.
   Do not delete the retained Auth user.
3. Remove only exact smoke limiter rows when they can be proven by recorded
   keyed identifiers; otherwise leave bounded hashed counters to their reviewed
   expiry jobs and record the aggregate delta.
4. Prove customers, carts, cart items and merge receipts returned to baseline;
   Auth sessions are zero and the retained Auth user remains signed out.
5. Prove orders, payments, refunds, shipments, inventory, addresses, raffle
   rows and ERP-owned data did not change.
6. Recheck RPC/table grants, RLS, cleanup jobs, Supabase advisors, Vercel runtime
   errors and application-origin browser console output.
7. Record only aggregate evidence, exact source/deployment IDs and the final
   disabled flag state in the operator handoff.

## Stop conditions

Stop without retrying, broadening scope or deleting unrelated data if:

- the approved catalog row changes or becomes unavailable;
- more than one OTP, guest cart, customer cart, customer or merge receipt is
  created;
- identity verification is unavailable or a verified session falls back to
  guest ownership;
- merge leaves the guest cookie, loops on `sync_required`, duplicates or loses
  the line;
- quantity/remove state is stale after a confirmed response;
- any order, payment, reservation, address or raffle row changes;
- a credential, OTP, cookie, token, raw PII or limiter key appears in logs;
- exact cleanup cannot identify its own rows.

Any retained fixture requires a new, separately approved targeted cleanup. Do
not improvise a destructive repair during the smoke.

## Success criteria

The smoke passes only when the anonymous-to-verified transition, customer-only
read/mutation, sign-out, runtime rollback and exact cleanup all pass; Production
returns to the original aggregate baseline; Vercel reports no application
runtime error; and every Commerce and raffle runtime flag is again `false`.

Passing this smoke completes the Phase 6 cart/customer identity boundary. It
does not approve saved addresses or Phase 7 checkout/payment work.
