# Verified Customer Cart Boundary Technical Plan

## Document metadata

- **Status:** `PRODUCTION_MIGRATION_APPLIED_RUNTIME_OFF`
- **Date:** 2026-09-19
- **Specification:** `customer-cart-boundary-specification.md`
- **Approval gate:** `CART-CUSTOMER-BOUNDARY-01`
- **Runtime default:** `COMMERCE_CUSTOMER_CART_ENABLED=false`

## Existing gap

`/cart` and `POST /api/cart` currently resolve only `lf_guest_cart`. The
login-time merge can convert that cart to a customer-owned row and clear the
cookie, but there is no server service that reads or mutates the resulting
customer cart. Enabling Auth, merge and Cart together would therefore make a
successful merge appear to lose the cart from the UI.

## Proposed application boundaries

### 1. Verified identity resolver

Add one server-only resolver backed by the cookie-aware `@supabase/ssr` client.
It returns the discriminated union `anonymous | verified_customer |
identity_unavailable`.

- Use a fresh `auth.getUser()` result for the identity required by customer
  cart operations.
- Normalize and validate the confirmed email only for minimal customer
  creation; never use it to select ownership.
- Treat an explicitly absent session as `anonymous`.
- Treat malformed, expired-but-unrefreshable or otherwise unverifiable session
  state as `identity_unavailable` when Auth runtime is enabled.
- Keep Proxy `getClaims()` for refresh/protection behavior, but do not pass an
  unverified session object into the cart service.

### 2. Customer cart domain service

Create an injected service parallel to the guest-cart service. Its public
operations are `read`, `setLine` and `removeLine`, each accepting only the
verified identity from the resolver. It returns the same sanitized cart-view
shape used by presentation so catalog enrichment remains shared.

The service is enabled only when Customer Auth and customer cart gates are both
exact `true`. Missing repository/configuration, invalid output and persistence
errors fail closed as `runtime_unavailable`.

### 3. Identity-aware page composition

Refactor `getServerCartPageView()` into a small orchestrator:

1. If Auth runtime is disabled, preserve the current guest-only flow.
2. Resolve identity once when Auth runtime is enabled.
3. On `identity_unavailable`, render unavailable and perform no cart read.
4. On `anonymous`, call the guest service if guest runtime is enabled.
5. On `verified_customer`, never call the guest service.
6. If the verified request also has `lf_guest_cart`, return `sync_required`
   without reading either cart until the explicit merge finishes.
7. Otherwise read the customer cart and reuse the existing catalog
   presentation adapter.

### 4. Identity-aware POST route

Keep the existing request parser, CSRF/origin boundary, rate limiter, response
headers and cookie writer. Route the parsed action only after identity has been
resolved once.

- verified customer: `read`, `set_line`, `remove_line` use customer service;
- anonymous: existing guest service behavior;
- `identity_unavailable`: generic 503 with no fallback;
- verified `create`: generic conflict/unavailable result, never a guest cart;
- verified `merge_guest`: call the existing merge service and clear the guest
  cookie only on `merged`.

The existing source-based request/mutation limiter remains the outer endpoint
limit for this first integrated slice. No new limiter table or vendor is added.

## Database boundary

Prepare one CLI-created migration only after approval. It adds no table or
browser policy. It adds three fixed-signature, service-role-only invoker RPCs:

1. `read_verified_customer_cart(uuid)`
2. `set_verified_customer_cart_line(uuid,text,uuid,uuid,integer)`
3. `remove_verified_customer_cart_line(uuid,uuid,uuid)`

Exact names/signatures remain provisional until `supabase migration new` and
generated-type review, but their responsibilities are fixed by this plan.

### Read RPC

- Resolve `customers.id` only from `auth_user_id`.
- Resolve at most one active, unexpired customer cart.
- Return one bounded JSON object with currency, expiry and at most 50 line
  identities/quantities; return an explicit empty result when no cart exists.
- Never create, touch or reactivate rows.
- Never return customer ID, cart ID, email or Auth user ID.

### Set-line RPC

- Validate the subject, verified normalized email, product, optional variant
  and quantity.
- Take a subject advisory transaction lock before resolving/creating the
  customer and cart.
- Resolve ownership by `auth_user_id`; reject normalized-email collision rather
  than attach by email.
- If the existing active cart is expired, lock it, mark it `expired`, then
  create/reuse the one valid active cart.
- Lock the parent cart before line mutation.
- Revalidate published product and active variant membership in the database.
- Upsert the logical line through the existing partial uniqueness contracts,
  set the requested quantity exactly, and extend cart activity/expiry.
- Return the same bounded sanitized cart document as the read RPC.

### Remove-line RPC

- Resolve the customer only by verified subject.
- Lock the unexpired active parent cart.
- Delete only the matching logical line belonging to that cart.
- Treat a missing cart/line idempotently and return an empty/current sanitized
  view.
- Extend activity only when an active cart was actually addressed.

### Function security

Every function is `SECURITY INVOKER`, has `SET search_path = ''`, uses fully
qualified identifiers, a short statement/lock timeout and bounded output.
Revoke execute from `PUBLIC`, `anon` and `authenticated`; grant only
`service_role`. Existing tables remain RLS-enabled and browser-denied.

The application passes `auth_user_id` only from its fresh Auth lookup. No
request field can reach the RPC subject parameter.

## Concurrency rules

- Acquire the subject advisory lock before customer/cart creation.
- Reuse the unique `customers.auth_user_id` and active-customer-cart indexes.
- Lock an existing cart before expiry transition or line mutation.
- Preserve the existing cart-item trigger that locks and revalidates the active
  parent cart.
- Use the matching partial unique index for variant or non-variant upsert.
- Keep network/catalog presentation work outside database locks.
- Customer mutation racing with guest merge serializes on the active customer
  cart parent lock and cannot create duplicate logical lines.

## Runtime configuration

Add only:

`COMMERCE_CUSTOMER_CART_ENABLED=false`

The server adapter also requires `NEXT_PUBLIC_SUPABASE_URL` and the existing
server-only `SUPABASE_SECRET_KEY`. No key is exposed to the browser. Integrated
merge retry additionally requires the existing Customer Auth, guest-cart and
merge flags.

## Planned code changes

- add verified cart identity resolver;
- add customer-cart contract/service, Supabase repository and server adapter;
- generalize the Cart page service over guest/customer sanitized reads;
- extend the Cart request handler with verified routing and `merge_guest`;
- add the bounded `sync_required` presentation/control;
- prepare migration and refresh generated types after an approved database
  application, not before;
- update authoritative architecture/Supabase references with the approved
  contract during implementation.

## Test matrix

- runtime disabled before Auth, cookie or database work;
- Auth disabled preserves current guest behavior;
- absent session routes to guest; verified session routes only to customer;
- unverifiable session never falls back to guest;
- request body cannot choose Auth/customer/cart IDs;
- read of missing/empty customer cart creates nothing;
- first set creates one customer/cart and line;
- normalized-email collision fails without attachment;
- set/remove cannot cross subjects;
- expired cart is unreadable and rotates only on mutation;
- published product/variant and 1–99 quantity checks remain authoritative;
- concurrent first writes produce one customer and one active cart;
- merge/write race produces one logical line without loss or duplication;
- explicit merge retry is same-origin, rate-limited and idempotent;
- cookie clears only on successful merge;
- `anon`/`authenticated` cannot execute RPCs or read cart tables;
- payloads/logs/errors exclude private identifiers;
- existing Cart catalog estimate and UI tests remain valid;
- `npm run check` and 390/768/1440 browser review pass.

## Delivery sequence after approval

1. Implement domain/application contracts and static tests default-off.
2. Create the migration with the installed Supabase CLI; do not invent its
   timestamp.
3. Run local/static security checks and transactional rollback validation.
4. Obtain `CART-CUSTOMER-PROD-MIGRATION-01` before applying SQL.
5. Run database grants, behavior, concurrency and advisor postflight.
6. Refresh generated types and connect the exact RPC signatures.
7. Run full local validation and commit the disabled implementation.
8. Obtain separate push/deploy approval and perform read-only Production checks
   with every Commerce and raffle flag false.
9. Prepare a distinct integrated runtime smoke runbook; enabling any flag still
   requires explicit approval and rollback steps.

## Explicit non-actions in this planning slice

No code, migration, Supabase data, Vercel environment, runtime flag, deployment,
checkout, payment, order, inventory, raffle or ERP change is authorized.

## Implementation checkpoint

`CART-CUSTOMER-BOUNDARY-01` was approved on 2026-09-19. Supabase CLI `2.117.0`
created `20260919123447_verified_customer_cart_boundary.sql`. The default-off
application boundary, three public invoker RPCs, private bounded document
helper, verified identity resolver, identity-aware POST routing and
`sync_required` UI were implemented locally. At that checkpoint the migration
was unapplied and generated Production types were intentionally unchanged.

The full repository gate passed with 259/259 tests, lint, TypeScript, static
security, zero Production dependency vulnerabilities and a successful Next.js
Production build.

`CART-CUSTOMER-PROD-MIGRATION-01` was approved on 2026-09-19. The exact SQL
passed rollback validation and was applied as
`20260919140429_verified_customer_cart_boundary`. Signature, invoker mode,
fixed search path, timeout, service-role grants, browser-role denial, bounded
behavior, concurrency, fixture cleanup and both advisor classes passed.
Production-generated types now include the three RPCs. Runtime activation,
push and deployment remain unapproved, and all runtime flags remain false.
