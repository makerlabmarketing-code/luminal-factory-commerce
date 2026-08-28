# Phase 6 Identity and Cart Architecture Decision

## Document metadata

- **Status:** `APPROVED_FOR_TECHNICAL_PLANNING`
- **Date:** 2026-08-13
- **Implementation status:** `SLICE_B_AUTH_UI_CODE_COMPLETE_STAGING_APPROVAL_REQUIRED`
- **Approval boundary:** The owner separately approved and completed the inert Slice A schema/service boundary. Production runtime activation, Auth configuration, customer-data access and later migrations still require their applicable privacy/security gate.

## Context

Phase 4 created a default-deny customer/order foundation with nullable `customers.auth_user_id`. Phase 5 connected the public Shop to published catalog reads without introducing customer identity or mutations. Phase 6 must now define a guest cart, an optional customer account, address ownership, and the transition between guest and authenticated state.

This decision must preserve existing domain boundaries:

- a cart is purchase intent, not an inventory reservation or order;
- a customer account is not an ERP staff identity;
- a raffle entry remains guest-email based in its approved first slice;
- matching email text alone must never link private records;
- payment capture and order creation remain Phase 7 concerns.

## Decision

Adopt a two-boundary identity model:

1. **Guest cart identity:** a server-issued opaque cart token in a dedicated `HttpOnly`, `Secure` in production, `SameSite=Lax` cookie. Persist only a cryptographic hash of the token. The browser never receives a database row identifier or privileged Supabase credential as proof of cart ownership.
2. **Permanent customer identity:** Supabase Auth with `@supabase/ssr`, PKCE, and cookie-backed sessions. The first account method is email OTP/magic-link class authentication; password and social providers are deferred until a separate need is approved.
3. **Customer profile link:** one permanent Auth user may link to at most one `customers` row through `customers.auth_user_id`. The Auth subject, not mutable email metadata, is the authorization key.
4. **Server-mediated mutations:** guest cart operations and identity transitions run through validated Server Actions or Route Handlers and a narrowly scoped trusted persistence boundary. Guest cart tables are not directly writable or enumerable through public Data API roles.
5. **Customer-owned reads:** authenticated account/order/address reads use the verified Auth subject plus ownership predicates. `TO authenticated` alone is never sufficient authorization.

## Why Supabase anonymous sign-in is not the guest-cart identity

Supabase anonymous users are valid authenticated users and can support carts, but they use the `authenticated` Postgres role, require every affected policy to distinguish the `is_anonymous` claim, create durable Auth records, need abuse protection, and currently have no automatic cleanup. They also introduce account-link and existing-account merge conflicts before Luminal needs those capabilities.

An opaque server cart token gives the current storefront a smaller first boundary:

- no Auth record is created for browsing or adding an item;
- guest cart access is not coupled to customer-account RLS;
- the cookie can be rotated or revoked independently;
- the cart remains recoverably ephemeral and contains no contact/address data;
- account creation stays optional until a customer explicitly requests it.

This is a deliberate first implementation choice, not a claim that Supabase anonymous sign-in is insecure or permanently forbidden. Reconsider it only if a future cross-device guest identity requirement outweighs the added lifecycle and policy complexity.

## Session and authorization contract

### Guest cart cookie

- Generate at least 256 bits of cryptographically secure randomness.
- Store the raw token only in the cookie; store a one-way hash in persistence.
- Use `HttpOnly`, `SameSite=Lax`, `Path=/`, and `Secure` outside localhost.
- Rotate the token after successful account attachment and other ownership-boundary changes.
- Apply an inactivity expiry and server-side cleanup policy; the exact retention period must be approved in the privacy review before migration.
- Never log the raw token, include it in a URL, expose it to analytics, or return it in JSON.

### Permanent Auth session

- Use `@supabase/ssr` for Next.js cookie session handling and PKCE flows.
- Treat account and customer-data routes as dynamic, private, non-cacheable responses.
- Use `getClaims()` for normal verified identity checks and `getUser()` where fresh server-confirmed user state or revocation sensitivity is required.
- Never authorize from `getSession()`'s embedded user object alone.
- Never use `user_metadata` for authorization; use the verified Auth subject and database ownership.
- Keep customer and ERP staff authorization completely separate.

### Request protection

- Validate every mutation input at the server boundary.
- Enforce origin/CSRF protections appropriate to cookie-authenticated mutations.
- Apply rate limits to cart creation, Auth initiation, OTP verification, and merge operations.
- Return generic authentication and ownership failures that do not enumerate accounts or carts.
- Do not place customer PII, OTPs, session tokens, or cart tokens in application logs.

## Persistence direction

The first migration plan may introduce the following concepts after direct schema inspection:

### `carts`

- opaque UUID primary key for internal relations;
- nullable `customer_id` for an attached permanent customer;
- nullable guest-token hash while the cart is guest-owned;
- state such as `active`, `converted`, `abandoned`, or `expired`;
- currency and timestamps;
- expiry/last-activity timestamp;
- constraints ensuring one valid ownership mode and bounded active-cart behavior.

### `cart_items`

- cart and product/variant references;
- positive requested quantity;
- timestamps;
- uniqueness for one logical product/variant line per cart.

Cart rows must not store contact email, shipping address, payment details, or mutable price snapshots. Displayed price and availability are re-read from authoritative catalog data. Final price, stock, reservation, order, and payment rules are deferred to their trusted checkout boundary.

### `customer_addresses`

- belongs to one `customers` row;
- contains only approved fulfillment fields;
- remains default-deny until authenticated ownership policies and retention/deletion behavior are reviewed;
- is never copied into logs, analytics, public views, or cart records.

An order may later keep an immutable fulfillment snapshot, but that is a Phase 7 order/checkout contract and is not authorized here.

## Guest-to-account transition

When a guest signs in or creates an account:

1. verify the Auth identity;
2. resolve the guest cart by the hashed cookie token at the trusted server boundary;
3. resolve or create the customer profile by Auth subject, never by unverified email alone;
4. merge into the authenticated active cart transactionally;
5. combine identical lines using bounded quantity rules, while treating all quantities as requests rather than reservations;
6. mark the consumed guest cart non-active and rotate/delete its token;
7. return the resulting cart without exposing either prior ownership token.

The merge must be idempotent. If incompatible currency or invalid catalog lines are encountered, fail safely or drop only the invalid lines with an explicit customer-facing explanation; never silently create an order or reserve stock.

## Raffle identity boundary

The approved first raffle-entry slice continues to use normalized guest email and a database uniqueness constraint. It does not require an account and must not automatically attach an entry to a customer merely because email strings match.

A future account-to-raffle link requires a separate privacy and domain decision, proof of ownership, non-enumerating responses, and migration review.

## Data API, grants, and RLS direction

- Enable RLS on every new table in an exposed schema.
- Explicitly grant only the operations required by the chosen access path; new tables must not be assumed to be Data API-visible.
- Guest cart tables remain inaccessible to `anon` and direct browser writes by default.
- Authenticated policies must include ownership predicates such as the verified Auth subject mapped to `customers.auth_user_id`.
- `UPDATE` policies require both `USING` and `WITH CHECK`, plus the corresponding `SELECT` policy.
- Index columns used in ownership policies and active-cart lookups.
- Avoid `SECURITY DEFINER`; if a narrowly scoped function is later justified, keep it out of an exposed schema, revoke default `PUBLIC` execution, validate the caller inside it, and review with database advisors.

## Alternatives considered

### Supabase anonymous Auth for every guest

Deferred because it creates an Auth identity for low-intent browsing, complicates RLS role meaning and cleanup, and makes account conflict handling part of the first slice.

### Browser-local cart as the source of truth

Rejected because it is easy to tamper with, is not recoverable across normal server flows, and encourages browser-authoritative price/availability assumptions. Browser state may optimistically present a server cart but is never authoritative.

### Mandatory account before cart

Rejected because it adds unnecessary friction and conflicts with the approved guest-first commerce direction.

### Email as the universal customer key

Rejected because email can change, may be unverified, and must not become an authorization credential or silently join raffle/customer/order data.

## Implementation sequence and gates

1. **Privacy/security review:** approve cart retention, address fields/retention, Auth email copy, allowed redirects, rate limits, bot mitigation, and incident/logging rules.
2. **Schema and RLS plan:** inspect live schema; write migration, rollback, grants, policies, indexes, generated-type update, and advisor/test plan. Do not apply production SQL during planning.
3. **Guest cart slice:** implement server-mediated create/read/update/remove, expiry, token rotation, and tamper/authorization tests. No account UI yet.
4. **Account slice:** add Supabase SSR clients, email authentication, dynamic account routes, customer linking, sign-out, and authorization tests.
5. **Merge/address slice:** implement transactional cart merge and the separately approved minimal address contract.
6. **Staging verification:** exercise guest, sign-in, existing-account merge, sign-out, expired/tampered token, cross-user denial, cache isolation, rate limits, mobile, keyboard, and recovery paths before production approval.

## Explicit non-goals

- Applying a migration or changing live Supabase Auth settings.
- Creating account/cart UI in this documentation slice.
- Payment provider selection, payment capture, order creation, tax, shipping rates, or inventory reservation.
- Linking raffle entries to accounts.
- ERP employee authentication or ERP customer-data mutation.
- Social login, passwords, MFA, passkeys, anonymous Auth, or cross-device guest recovery.

## Current approval gate

The owner approved and completed the isolated Slice A guest-cart smoke: the guarded GitHub Actions run created and deleted exactly one cart, postflight returned to zero carts/items/Auth users, and the branch-scoped Preview runtime was restored to false. Slice B now contains a local default-off `/account` OTP/Turnstile UI, strict request boundary, cookie session refresh, verified-user presentation, local sign-out and durable keyed-hash limiter. The Auth limiter was applied once as `20260826105102_add_customer_auth_rate_limits` and passed zero-row postflight. The owner reported Supabase SMTP/Turnstile and Vercel Preview public-site-key configuration complete, but no exact-head end-to-end OTP smoke has run. Customer RLS, cart attachment, PII beyond the approved test email, addresses, global Account navigation and Production runtime remain disabled.

## Current official references

- Supabase Anonymous Sign-Ins: <https://supabase.com/docs/guides/auth/auth-anonymous>
- Supabase Next.js Auth guide: <https://supabase.com/docs/guides/getting-started/tutorials/with-nextjs>
- Supabase server package selection: <https://supabase.com/docs/guides/auth/choosing-a-server-package>
- Supabase Row Level Security: <https://supabase.com/docs/guides/database/postgres/row-level-security>
- Supabase 2026 Data API exposure change: <https://supabase.com/changelog/45329-breaking-change-tables-not-exposed-to-data-and-graphql-api-automatically>
