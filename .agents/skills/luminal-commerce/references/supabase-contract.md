# Supabase Contract

## Ownership

This file is the authoritative owner of Supabase persistence, clients, authentication, RLS, data access boundaries, trusted enforcement, storage, generated database types, schema changes, and shared database assumptions.

Use `commerce-domain.md` for commerce concept meaning, lifecycle semantics, sale types, revenue rules, and domain change rules.

## Role of Supabase

Supabase is the planned shared backend platform for Luminal Factory commerce.

The storefront and ERP should eventually use the same Supabase project.

The shared backend may provide:

- PostgreSQL
- authentication
- storage
- row-level security
- generated database types

## Source of Truth

Persisted commerce state belongs in the database.

Examples:

- products
- variants
- raffles
- entries
- customers
- orders
- payments
- refunds
- shipments
- commission requests

The storefront must not maintain an independent duplicate commerce database.

## Storefront and ERP

The ERP is the operational back office.

The storefront is the public and customer-facing application.

Conceptual access:

    ERP
    -> privileged operational operations

    Storefront server
    -> customer and public application operations

    Storefront browser
    -> RLS-constrained customer operations

Exact access must be enforced using Supabase authentication, RLS, and server boundaries.

## Supabase Clients

Use purpose-specific clients.

Conceptually:

    browser client
    server client
    privileged server-only client

Do not use a privileged service role client in browser code.

Never expose a service role key through a `NEXT_PUBLIC_` environment variable.

## Customer Authentication and Guest Cart

The approved Phase 6 planning direction is:

- Supabase Auth with `@supabase/ssr`, PKCE and cookie-backed sessions for permanent customer accounts;
- an opaque, server-issued guest cart cookie with only its cryptographic hash persisted;
- no Supabase anonymous Auth user for the first guest-cart implementation;
- server-mediated guest cart mutations and default-deny browser access;
- authorization by verified Auth subject mapped to `customers.auth_user_id`, never by mutable email or `user_metadata`.

Authenticated routes that handle customer data must be dynamic and private rather than statically cached. Use verified claims for normal authorization and a fresh Auth user lookup where current revocation/user state is required. Do not authorize from an unverified cookie session object.

Email remains a contact attribute. Matching email strings must not silently link a customer, order, cart, address or raffle entry.

The owner approved the first Phase 6 privacy defaults on 2026-08-13:

- guest carts expire after 30 days of inactivity and are deleted within 7 further days;
- the first permanent account method is email OTP;
- Cloudflare Turnstile is the production Auth bot-protection direction;
- saved addresses wait until guest-cart and Auth isolation pass its reviewed
  environment-specific smoke gate.

This approval permits isolated migration/runtime planning. Applying production SQL, enabling Auth/Turnstile or collecting PII still requires its applicable reviewed delivery gate.

## Environment Variables

Public client configuration may include:

- NEXT_PUBLIC_SUPABASE_URL
- NEXT_PUBLIC_SUPABASE_ANON_KEY

Privileged credentials must remain server-only.

Do not commit environment secrets.

Environment-specific local files must be reviewed against `.gitignore`.

The Phase 6 guest-cart service uses:

- `COMMERCE_GUEST_CART_ENABLED`, exact value `true` only after its reviewed runtime gate;
- `SUPABASE_SECRET_KEY`, a server-only Commerce project secret key.
- `COMMERCE_GUEST_CART_ALLOWED_ORIGINS`, exact comma-separated Preview/Production origins;
- `COMMERCE_GUEST_CART_RATE_LIMIT_SECRET`, a server-only HMAC secret for source limiter keys.

The POST-only request boundary and Supabase rate-limit adapter are code-complete. The durable design uses a private RLS-enabled counter table, a fixed-policy service-role-only `SECURITY INVOKER` RPC and Supabase Cron cleanup inside the existing database. On 2026-08-15 the exact reviewed limiter migration passed transactional rollback validation, was applied once as `20260815022728_add_guest_cart_rate_limits`, and passed production database postflight. The counter table remains zero-row and default-deny. An isolated Preview-only staging runbook and guarded create/delete verifier are prepared, but no secret, deployment or runtime activation is configured. There is no Cart UI consumer; the runtime flag remains default-false and staging execution is separately gated.

The Phase 6 customer-Auth boundary uses:

- `COMMERCE_CUSTOMER_AUTH_ENABLED`, exact value `true` only during a reviewed
  activation window;
- `COMMERCE_CUSTOMER_AUTH_ALLOWED_ORIGINS`, containing only the exact live
  origin used by the smoke;
- `COMMERCE_CUSTOMER_AUTH_RATE_LIMIT_SECRET`, a distinct server-only HMAC
  secret of at least 32 characters;
- `NEXT_PUBLIC_CLOUDFLARE_TURNSTILE_SITE_KEY`, which is public by design while
  the Turnstile secret remains only in Supabase Auth configuration.

On 2026-08-28 the owner selected `master` as the single Production delivery
branch. This removes the Preview requirement for future batches but does not
weaken the runtime gate. The bounded Production OTP smoke subsequently passed:
the corrected Commerce project issued a six-digit token, verification and one
refresh succeeded, local sign-out revoked the session, and Auth returned to
false. One signed-out Auth user remains while sessions and all customer/cart
rows are zero. Customer linking and guest-cart attachment remain a separate
default-off slice with their own SQL and runtime approval gates.

The default-off customer/cart merge now has an applied migration, static
security contracts and a Production runbook. Its server-only invoker RPC
uses the verified Auth subject, never email as ownership; a private 37-day
receipt makes guest-token replay idempotent; and cart-line writes lock their
active parent cart so conversion cannot strand a late line. Browser roles keep
zero receipt/RPC access. On 2026-08-30 rollback validation, exact application as
`20260830070209_customer_cart_merge`, real concurrency validation and exact
fixture cleanup all passed. Generated types include the bounded RPC; the
server-only adapter now maps only that generated signature and fails closed on
database, shape or configuration errors. Privileged client construction requires
Customer Auth, guest cart and merge flags all to be exact `true`. The Auth route
now invokes it lazily only after successful OTP verification, a fresh `getUser()`
identity check and presence of a guest cookie. Only a completed merge clears that
cookie; login remains valid and the cookie is preserved for every merge failure.
All runtime activation remains separately gated.

## Row-Level Security

Assume RLS is required for customer-owned data.

Examples:

- customer profile
- addresses
- customer orders
- raffle entries
- commission requests

Publicly visible content may use explicit public read policies.

Administrative write access must not depend on hiding a button in the UI.

## Database Types

Prefer generated Supabase database types when the schema becomes stable.

Generated types represent database structure.

They do not replace domain validation or application contracts.

The responsibilities are different:

    Database type
    -> persisted representation and nullability

    Domain model
    -> valid application state

    Input schema
    -> accepted external payload

Do not assume these three are always identical.

## Query Boundaries

Do not write raw Supabase calls inside arbitrary visual components.

Use explicit data or service functions.

Examples:

    getActiveRaffle()
    getPublishedArchiveObjects()
    getProductBySlug()
    createRaffleEntry()
    submitCommissionRequest()

## Public Data

Only publish fields intended for public use.

Do not expose internal fields merely because they exist in a table.

Potential internal data includes:

- internal notes
- cost
- supplier information
- staff identifiers
- selection audit metadata
- finance metadata

Use explicit selections or public views where appropriate.

## Raffle Integrity

Raffle eligibility and entry rules must be enforced at a trusted boundary.

Do not rely only on:

- a disabled button
- client state
- browser date

The database or trusted server operation must verify:

- raffle state
- entry period
- customer identity
- uniqueness rules
- eligibility rules

## Inventory Integrity

Stock changes must be atomic where overselling is possible.

Do not implement stock reservation by reading quantity in the browser, subtracting locally, and writing the result back.

Use a trusted database operation or transaction-oriented server flow.

## Payment Integrity

Payment success must come from the authoritative payment provider or trusted server workflow.

Do not mark an order paid because the browser reached a success page.

Payment-related data must support reconciliation.

## Storage

Supabase Storage may be used for:

- product media
- raffle media
- archive media
- commission reference uploads

Production 3D web assets may be hosted using an appropriate public asset strategy.

Do not expose production sculpt masters or manufacturing source assets as public web files.

## Schema Changes

Database schema changes must be documented.

Do not silently create storefront-specific database assumptions that conflict with ERP usage.

When a schema change affects both applications:

1. Identify the shared contract.
2. Update schema or migration.
3. Update generated types if used.
4. Update domain validation.
5. Inspect ERP impact.
6. Inspect storefront impact.

## Current Constraint

The final shared database schema has not yet been locked.

Do not invent large production schemas prematurely.

During visual implementation, use explicit mock data or adapters where necessary.

Keep mock structures aligned with documented commerce concepts.
