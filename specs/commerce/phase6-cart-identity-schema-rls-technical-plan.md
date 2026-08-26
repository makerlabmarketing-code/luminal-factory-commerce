# Phase 6 Cart and Identity Schema/RLS Technical Plan

## Document metadata

- **Status:** `SLICE_B_AUTH_FOUNDATION_IN_PROGRESS`
- **Date:** 2026-08-14
- **Live database status:** `SLICE_A_APPLIED_RUNTIME_DISABLED`
- **Depends on:** `phase6-identity-architecture-decision.md` and owner approval of `phase6-privacy-security-review.md`

## Goal

Prepare a reviewable database and authorization path for guest cart, permanent customer identity, transactional cart attachment, and later saved addresses without opening payment, order creation, inventory mutation, raffle identity linking or ERP mutation.

## Verified live baseline

Before Slice A, project `bkmbhcfokobmhfzgsfzh` contained only migrations:

- `20260810045019_create_commerce_core`
- `20260810045219_add_commerce_fk_indexes`

The live `public` schema matches the committed Phase 4 contract. `customers.auth_user_id` is nullable, unique and references `auth.users(id) ON DELETE SET NULL`; `customers.email` has a case-normalized unique index. Sensitive commerce tables have RLS enabled, no `anon`/`authenticated` grants, and no customer policies. Existing FK and commerce query indexes are present. Current advisor notices are expected informational default-deny/unused-index findings on a zero-traffic database.

No drift or existing cart/address structure needs to be preserved.

On 2026-08-14 the reviewed Slice A migration was applied and recorded as `20260814035441_create_guest_cart_foundation`. Postflight confirmed default-deny access, zero rows, complete structural objects and no warning/error advisor regression. Auth and cart runtime remain disabled.

## Delivery structure

Use three independently reviewable migrations and runtime slices. Do not combine them into one production change.

### Slice A — guest cart persistence

No customer PII and no Supabase Auth configuration.

Proposed `public.carts`:

| Column | Type/direction | Contract |
| --- | --- | --- |
| `id` | `uuid` primary key | Internal opaque relation ID |
| `customer_id` | nullable FK to `customers(id)` | Null for guest; used after verified attachment |
| `guest_token_hash` | nullable `bytea` unique | Hash only; never returned to browser |
| `status` | checked text | `active`, `converted`, `expired`, `abandoned` |
| `currency` | `char(3)` | Uppercase, first slice `VND` |
| `expires_at` | `timestamptz` | Authoritative server expiry |
| `last_activity_at` | `timestamptz` | Sliding retention boundary |
| `created_at`, `updated_at` | `timestamptz` | Audit/cleanup timestamps |

Required ownership constraint:

- an `active` cart has exactly one owner mode: `customer_id` XOR `guest_token_hash`;
- every non-active cart has `guest_token_hash IS NULL` so consumed credentials cannot replay;
- a customer-owned active cart has no guest hash.

Proposed `public.cart_items`:

| Column | Type/direction | Contract |
| --- | --- | --- |
| `id` | `uuid` primary key | Internal line ID |
| `cart_id` | FK to `carts(id) ON DELETE CASCADE` | Required and indexed |
| `product_id` | FK to `products(id) ON DELETE CASCADE` | Required |
| `variant_id` | nullable FK to `product_variants(id) ON DELETE CASCADE` | Optional variant |
| `requested_quantity` | `integer` | Greater than zero, bounded to 99 initially |
| `created_at`, `updated_at` | `timestamptz` | Activity timestamps |

Line uniqueness uses two partial unique indexes so nullable variants do not create duplicates:

- unique `(cart_id, variant_id)` where `variant_id IS NOT NULL`;
- unique `(cart_id, product_id)` where `variant_id IS NULL`.

Additional indexes:

- unique active customer cart on `customer_id WHERE status = 'active' AND customer_id IS NOT NULL`;
- unique `guest_token_hash WHERE guest_token_hash IS NOT NULL`;
- cleanup index on `(status, expires_at)` for active/expired cleanup queries;
- FK indexes on `cart_items.cart_id`, `product_id` and `variant_id`.

Security for Slice A:

- enable RLS on both tables;
- revoke all from `anon` and `authenticated`;
- grant only the server credential the minimum operations used by the cart service;
- never expose `guest_token_hash` through a view, response, log or generated public DTO;
- public/guest requests reach cart operations only through validated same-origin Server Actions/Route Handlers.

The cart service must query by a deterministic server-side token hash, validate `status = 'active'` and `expires_at > now()`, update activity with a bounded write rate, and re-check product/variant publication. It must not read or mutate inventory quantities.

### Slice B — permanent account and attachment

Dependency: Slice A authorization tests pass and the owner approves email OTP, SMTP/redirect and Turnstile configuration.

Database changes:

- retain the existing `customers.auth_user_id` unique FK rather than creating a profile table;
- do not create an `auth.users` trigger;
- create or link the customer through a trusted server operation after a fresh verified Auth user lookup;
- add no new customer PII column unless approved separately.

Authenticated read direction:

- grant `authenticated` only the required `SELECT`/approved profile-update columns on `customers`;
- customer policy uses `(select auth.uid()) = auth_user_id`;
- add both `USING` and `WITH CHECK` for any approved update;
- do not grant customer insert/delete directly in the first account slice;
- continue to deny direct client access to `carts.guest_token_hash`.

Order history is not opened automatically. If account UI needs a read-only order list later in Phase 6, add a separate migration with:

- authenticated `SELECT` only on `orders` and `order_items`;
- `orders` ownership through `orders.customer_id -> customers.auth_user_id`;
- `order_items` ownership through an indexed `EXISTS` relationship to an owned order;
- no payment/refund details or write privileges;
- no order creation, status mutation or fulfillment operation.

Cart attachment service:

1. obtain current Auth user using a fresh server-confirmed check;
2. resolve/create customer by Auth subject, never by unverified email alone;
3. resolve guest cart from the hash of the cookie token;
4. lock guest and authenticated active cart rows in ascending ID order;
5. merge lines using atomic upsert against the partial uniqueness contract;
6. cap requested quantities and discard/unavailable lines only with an explicit result;
7. mark guest cart `converted`, clear its hash, attach/create the customer cart and rotate the cookie in one short transaction;
8. use an idempotency key so retries return the same resulting cart.

No external email, payment, inventory or ERP call may occur while database locks are held.

### Slice C — saved addresses

Dependency: guest/Auth isolation staging suite passes and the owner separately approves address fields and retention.

Proposed `public.customer_addresses`:

- `id uuid` primary key;
- `customer_id uuid NOT NULL` FK to `customers(id) ON DELETE CASCADE`;
- bounded `label`, recipient name, phone, ISO country code, administrative area/locality, line 1, optional line 2 and optional postal code;
- `is_default boolean`;
- timestamps.

Constraints/indexes:

- length and non-blank checks for required fields;
- normalized two-character uppercase country code;
- FK index on `customer_id`;
- at most one default address per customer using a partial unique index on `customer_id WHERE is_default`.

RLS/grants:

- authenticated CRUD only;
- ownership via `customer_id` joined to `customers.auth_user_id = (select auth.uid())`;
- `UPDATE` includes both `USING` and `WITH CHECK`;
- no access for `anon`;
- no public view, Realtime publication, Storage attachment or free-form sensitive note.

Order-address snapshots remain a Phase 7 contract and are not added here.

## Migration authoring rules

After owner approval:

1. create each migration with `supabase migration new <descriptive_name>` rather than inventing a version;
2. write the schema/grants/RLS in the generated file and keep the migration forward-only;
3. include a separate operator rollback SQL/runbook because destructive down migrations are not automatic;
4. explicitly grant tables because current Supabase projects may not expose new public tables to the Data API by default;
5. enable RLS before granting any client role;
6. avoid `SECURITY DEFINER`; if a transaction cannot be made safe in the application service, stop for a dedicated function/security review;
7. regenerate `src/lib/supabase/database.types.ts` only after the reviewed schema exists in an isolated test environment;
8. run security/performance advisors and retain before/after evidence.

## Rollback direction

### Before production data

Rollback may drop only the newly introduced Phase 6 tables/policies/indexes after verifying they contain zero rows and no dependent objects. This remains an explicit operator-approved destructive action.

### After production data

Do not drop or truncate. Disable the runtime feature flag, revoke client grants, stop new writes, preserve evidence, and prepare a forward repair/migration. Guest-cart data may be purged only under the approved retention process. Customer/address deletion follows the privacy runbook.

Auth provider, redirect, CAPTCHA and SMTP changes have independent dashboard rollback steps and are not represented solely by SQL migrations.

## Test plan

### Database contract tests

- RLS enabled on every new table;
- exact grants for `anon`, `authenticated` and server roles;
- ownership/check constraints reject invalid modes and quantities;
- duplicate active carts and duplicate logical lines fail atomically;
- all FKs used for joins/deletes are indexed;
- guest hash is absent from customer/browser query results;
- advisors show no newly introduced security errors or missing-FK findings.

### Authorization tests

- anon cannot select/insert/update/delete any cart/customer/address row directly;
- guest token A cannot operate on cart B;
- authenticated user A cannot access user B's rows;
- unauthenticated and authenticated requests cannot mutate inventory/order/payment tables;
- expired/converted tokens fail identically to unknown tokens;
- account merge retry and concurrency produce one active cart and no duplicate lines.

### Application tests

- cookie flags and rotation;
- CSRF/origin/content-type rejection;
- no-store authenticated responses;
- OTP generic responses, rate limits and CAPTCHA failure;
- sign-in/sign-out/session refresh across server and browser;
- empty/unpublished/deleted catalog lines reconcile truthfully;
- mobile/keyboard/error recovery for cart and Auth UI when those slices are separately specified.

## Deployment gate

The owner approved the privacy defaults on 2026-08-13 and explicitly approved the inert Slice A production migration on 2026-08-14. The exact reviewed migration passed rollback validation, was then applied once, and passed production postflight under ledger entry `20260814035441_create_guest_cart_foundation`. Generated types are refreshed. The internal server-side cart service is code-complete behind a default-false gate; no endpoint, cookie write, secret or UI is enabled. Request-boundary and staging controls remain separately gated.

The isolated guest-cart enabled smoke subsequently passed and the Preview runtime returned to false. Slice B now includes a local `POST /api/account/auth` foundation for OTP request and verification, using `@supabase/ssr` cookie handling, a fresh `getUser()` confirmation, Turnstile-token input, exact-origin/CSRF checks, strict 4 KiB payloads and private/no-store generic responses. It remains behind `COMMERCE_CUSTOMER_AUTH_ENABLED=false` with no UI consumer.

Migration `20260826091055_add_customer_auth_rate_limits.sql` is a review-only candidate. It proposes private RLS-enabled keyed-hash counters, fixed limits of three OTP requests per email key per 15 minutes, ten OTP requests per source key per hour and ten verification attempts per source key per 15 minutes, plus service-role-only invoker RPC and bounded Cron cleanup. It has not received rollback validation, been applied, or updated the generated production database types. Auth runtime must remain false until those gates and the separate SMTP/Turnstile configuration runbook pass.

## References

- Supabase RLS: <https://supabase.com/docs/guides/database/postgres/row-level-security>
- Supabase server-side Auth package selection: <https://supabase.com/docs/guides/auth/choosing-a-server-package>
- Supabase Data API exposure change: <https://supabase.com/changelog/45329-breaking-change-tables-not-exposed-to-data-and-graphql-api-automatically>
- Supabase database testing/linting: <https://supabase.com/docs/guides/local-development/cli/testing-and-linting>
