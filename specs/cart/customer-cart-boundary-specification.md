# Verified Customer Cart Boundary Specification

## Document metadata

- **Status:** `PRODUCTION_MIGRATION_APPLIED_RUNTIME_OFF`
- **Date:** 2026-09-19
- **Roadmap phase:** Phase 6 — Cart and customer identity
- **Depends on:** guest-cart service, Customer Auth, atomic guest-cart merge,
  and `CART-UI-01`
- **Approval gate:** `CART-CUSTOMER-BOUNDARY-01`
- **Runtime default:** all Commerce and raffle runtime flags remain false

## Purpose

Complete the missing ownership boundary between the existing guest-first Cart
UI and the active cart attached to a verified customer. After this slice, the
same private `/cart` experience may read and mutate either:

- the guest cart identified by the opaque `HttpOnly` cookie; or
- the customer cart identified by a fresh, server-verified Supabase Auth
  subject mapped to `customers.auth_user_id`.

This boundary must make the post-login state coherent. A completed guest-cart
merge clears the guest credential, so `/cart` must be able to continue from the
customer-owned cart instead of appearing empty.

## User outcomes

1. A signed-out visitor continues to see and edit the guest cart.
2. A verified customer sees the active cart attached to their Auth subject on
   the same device or another signed-in device.
3. Quantity changes and removal affect only that verified customer's cart.
4. A customer with no active cart sees the existing empty state. Viewing the
   page does not create a customer or cart.
5. The first valid customer `set_line` mutation may create the minimal customer
   and active cart atomically.
6. If a guest credential remains after a failed login-time merge, Cart shows a
   bounded synchronization state and offers an explicit retry. A GET request
   never performs the merge.
7. After a successful retry, the guest cookie is cleared and the page reloads
   from the customer cart.

## Identity resolution contract

The server resolves exactly one of three identity states before reading or
mutating cart data:

| State | Meaning | Cart behavior |
| --- | --- | --- |
| `anonymous` | No authenticated customer session is present | Use the guest-cookie boundary when guest cart runtime is enabled |
| `verified_customer` | Supabase Auth has freshly confirmed a user ID and normalized email | Use only the customer-cart boundary |
| `identity_unavailable` | A session appears present but cannot be verified, or Auth configuration fails | Fail closed; do not fall back to the guest cart |

Authorization uses the verified Auth user ID only. Email is accepted solely as
a verified contact value when creating a previously absent minimal customer.
Request bodies, query strings, `user_metadata`, local storage and guest cookies
must never supply customer ownership.

When Customer Auth runtime is disabled, existing Auth cookies are inert and the
guest boundary retains its current behavior. Once Customer Auth runtime is
enabled, a verified customer must never silently fall back to guest ownership
because customer-cart runtime, persistence or identity verification is
unavailable.

## Ownership and cart lifecycle

- A customer cart is resolved through `customers.auth_user_id` and the single
  active `carts.customer_id` row.
- An active customer cart past `expires_at` is not readable. The next valid
  customer mutation may atomically mark it expired and create a fresh cart.
- Empty-page reads do not create or reactivate rows.
- Customer activity extends the active cart by the approved 30-day inactivity
  window.
- Cart lines remain purchase intent only. They do not reserve inventory, lock
  price, create an order or authorize payment.
- Published product and active variant membership are revalidated at mutation
  time. The Cart presentation continues to re-read current public catalog name,
  media and USD price after the approved `CART-USD-01` amendment.

## Guest-to-customer synchronization

The existing OTP verification path remains the first merge attempt. If a
verified customer reaches `/cart` while the guest cookie is still present:

- do not display the guest cart as though it were customer-owned;
- do not combine carts in application memory;
- do not retry merge during the server-rendered GET;
- present one generic synchronization state without revealing whether the
  failure was an identity collision, consumed token or backend fault;
- allow an explicit same-origin POST retry through the existing Cart request
  boundary;
- clear the guest cookie only after the existing atomic merge reports
  `merged`;
- preserve both the verified session and guest cookie on every failure.

The retry is idempotent through the existing private merge receipt. A different
Auth subject replay remains non-enumerating.

## Request behavior

The existing `POST /api/cart` remains the only browser mutation route. It keeps
the current exact-origin, JSON content type, custom request header, 4 KiB body,
source limiter, private/no-store response and generic failure requirements.

Supported behavior becomes identity-aware:

- `create` is guest-only and is rejected for a verified customer;
- `read`, `set_line` and `remove_line` route to the verified customer boundary
  when a verified subject exists, otherwise to the guest boundary;
- `merge_guest` is accepted only for a verified subject with a guest cookie and
  requires the independent merge runtime gate;
- an identity verification or customer persistence failure returns a generic
  service-unavailable response and never attempts a guest mutation.

The browser never receives the Auth user ID, customer ID, cart ID, guest token
or token hash as part of the cart payload.

## Runtime gates

Introduce `COMMERCE_CUSTOMER_CART_ENABLED`, enabled only by the exact value
`true`.

- customer cart read/mutation requires both Customer Auth and customer cart
  runtime;
- guest behavior continues to require guest-cart runtime;
- guest-to-customer retry additionally requires merge runtime;
- the complete integrated smoke requires Customer Auth, guest cart, customer
  cart and merge gates together;
- saved addresses, raffle detail/entry, checkout, order, payment and inventory
  flags remain independent and false.

An invalid flag combination must be visible as a closed/unavailable state, not
silently compensated for by a different ownership mode.

## Presentation states

The existing unavailable, empty, ready, stale-line and incomplete-estimate
states remain. Add only:

- `sync_required` for a verified session that still carries the guest cart
  credential;
- generic retry pending/success/failure feedback for the explicit merge action.

The synchronization state must be keyboard accessible, include a polite live
region, work at 390px/768px/1440px and remain usable without motion.

## Security and privacy requirements

- Auth identity is freshly confirmed on the server. Do not authorize from an
  unverified cookie session object.
- No browser grant or RLS policy is added for `carts` or `cart_items`; browser
  roles remain default-deny.
- Privileged Supabase credentials remain server-only.
- Fixed-signature database operations enforce subject-to-customer ownership,
  catalog validity, active-cart status, line uniqueness and quantity bounds.
- Database functions use `SECURITY INVOKER`, an empty `search_path`, explicit
  schema qualification and explicit `EXECUTE` revocation from `PUBLIC`, `anon`
  and `authenticated`.
- Cart routes remain dynamic, private, no-store and `noindex`.
- Logs, analytics, URLs and public errors exclude identity, email, cart IDs,
  cookie values and cart contents.

## Non-goals

- Checkout, orders, payments, inventory reservation or discounts.
- Global Cart/Account navigation.
- Address selection or shipping calculation.
- Customer profile editing or browser-direct cart access.
- Cross-device recovery of an anonymous guest cart.
- Raffle/customer identity linking.
- ERP writes or shared-code restructuring.
- Runtime activation, Production migration, secret edits or live data in this
  approval.

## Acceptance criteria

- Guest behavior remains backward compatible while Auth is disabled.
- A verified subject can read and mutate only their active customer cart.
- A verified session never falls back to the guest boundary on failure.
- Viewing an empty customer cart creates no row.
- First valid customer line mutation is atomic and concurrency safe.
- Expired customer carts cannot be read or mutated as active carts.
- Explicit merge retry is POST-only, idempotent and clears the guest cookie only
  after success.
- Public payloads and failures expose no private identifier.
- Cart presentation still treats current catalog data as display/estimate only.
- All runtime flags remain false after implementation and validation.

## Approval boundary

Implementation is blocked until the owner approves:

`CART-CUSTOMER-BOUNDARY-01`

That approval authorizes local, default-off code and migration preparation only.
It does not authorize Production SQL, runtime activation, a live Auth/cart
smoke, Vercel environment changes, checkout, payment, order or inventory work.

## Approval record

The owner approved `CART-CUSTOMER-BOUNDARY-01` on 2026-09-19. The approval is
used only for local default-off implementation and migration preparation.

The owner approved `CART-CUSTOMER-PROD-MIGRATION-01` on 2026-09-19. The exact
migration passed transactional rollback validation and was applied to Commerce
Production as `20260919140429_verified_customer_cart_boundary`. Grants,
service-role behavior, concurrency, cleanup and advisors passed. Generated
types now include the three RPC signatures. All runtime flags remain false;
push, deploy and integrated runtime smoke remain separate gates.
