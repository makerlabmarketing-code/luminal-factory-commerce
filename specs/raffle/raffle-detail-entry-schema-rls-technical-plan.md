# Raffle Detail + Guest Entry Schema/RLS Technical Plan

Status: `CODE_COMPLETE_DEFAULT_OFF_NO_DATABASE_CHANGE`
Inspection date: `2026-09-18`
Target project: Commerce Supabase `bkmbhcfokobmhfzgsfzh`
Runtime defaults: `COMMERCE_RAFFLE_DETAIL_ENABLED=false` and
`COMMERCE_RAFFLE_ENTRY_ENABLED=false`

## Outcome

Add a truthful public `/raffle/[slug]` detail boundary and a default-off,
server-mediated guest-email entry operation without creating an order,
payment, inventory reservation, winner record, or ERP mutation.

## Verified baseline

Read-only Production inspection confirmed:

- there is no `public.raffles` or `public.raffle_entries` table;
- public Commerce tables use RLS;
- sensitive limiter and replay data live under the RLS-enabled `private`
  schema with no browser policies;
- browser-readable product data is exposed through explicit `SELECT` policies;
- the migration ledger currently ends with Commerce Admin security persistence;
- no existing table can safely be repurposed as a raffle-entry ledger.

This plan therefore adds a bounded raffle domain instead of overloading
`products`, `customers`, `orders`, or `carts`.

## Persistence model

### `public.raffles`

Public event metadata and authoritative timing:

- `id uuid` primary key;
- `slug text` immutable public identifier with a unique constraint;
- nullable `product_id uuid` foreign key to `products(id)` for the first
  single-object release slice;
- `title text`, nullable `summary text`, and nullable `rules_summary text`;
- canonical `status text` constrained to the documented raffle lifecycle;
- `rules_version text` required;
- nullable `opens_at timestamptz` and `closes_at timestamptz` with a check that
  closing is later than opening when both are present;
- `is_published boolean`, nullable `published_at timestamptz`;
- `created_at` and `updated_at` timestamptz audit fields.

Raffle remains a separate record from Product. Variant/multi-object eligibility
is deferred until a real release requires it; the first migration must not
invent a general allocation model.

### `public.raffle_entries`

Private participation ledger:

- `id uuid` primary key and stable public acknowledgement reference;
- `raffle_id uuid` foreign key to `raffles(id)` using restrictive deletion;
- `email_normalized text` and `contact_email text`;
- `display_name text`;
- `rules_version text` and `accepted_at timestamptz`;
- `request_token_hash text` for bounded retry idempotency;
- `created_at timestamptz`.

Hard constraints:

- unique `(raffle_id, email_normalized)`;
- unique `(raffle_id, request_token_hash)`;
- normalized email is lowercase/trimmed and validated before persistence;
- request hashes are fixed-format SHA-256 hex values;
- entry rows contain no order, payment, winner, inventory, address, phone, or
  customer-account authority.

### `private.raffle_entry_rate_limits`

Store keyed hashes only, never raw IP addresses or email addresses. Fixed
server-owned buckets cover source request volume and email-per-raffle attempts.
The table is RLS-enabled, policy-free, inaccessible to `anon` and
`authenticated`, and cleaned by the existing database Cron pattern.

## Access and RLS

- Enable RLS on every new table.
- `raffles`: grant `SELECT` to `anon` and `authenticated` only for published
  rows whose `published_at` is not in the future. Explicitly select public
  columns in application services.
- `raffle_entries`: revoke all browser-role access and define no public policy.
- limiter table: keep in `private`, revoke browser access, grant only the
  server credential needed by the trusted operation.
- Do not use email as an authorization identity and do not link an entry to a
  customer merely because email strings match.
- Do not expose service-role or rate-limit secrets to a client bundle.

## Trusted mutation

Create one narrowly scoped server-only database operation that executes in a
single transaction and returns a bounded result:

1. resolve the raffle by trusted UUID/slug mapping;
2. lock and verify publication, canonical `OPEN` state, and database time
   inside `[opens_at, closes_at)`;
3. validate the accepted rules version;
4. claim the request-token hash idempotently;
5. insert the normalized guest entry;
6. map uniqueness conflicts to `already_entered` without returning an existing
   entrant's fields;
7. return only `submitted`, `already_entered`, `raffle_not_open`,
   `ineligible`, or `temporarily_unavailable` plus a new acknowledgement
   reference only when safe.

The application route performs request-shape, origin, request-size, Turnstile,
and rate-limit checks before calling the database operation. Database checks
remain authoritative for time, state, uniqueness, rules version, and
idempotency.

## Application boundary

- `src/features/raffle/`: public detail query, strict request/result contracts,
  and detail/form UI;
- `src/lib/supabase/raffle-entry-server.ts`: server-only service-role RPC,
  durable limiter, and Turnstile adapters;
- `src/app/raffle/[slug]/page.tsx`: thin Server Component route;
- `src/app/api/raffle-entry/route.ts`: POST-only, Node runtime, dynamic,
  same-origin, JSON-only, strict custom header, bounded body, private/no-store;
- client form receives only normalized public raffle presentation data;
- public detail reads remain unavailable unless
  `COMMERCE_RAFFLE_DETAIL_ENABLED` is exactly `true`;
- runtime entry remains unavailable unless all raffle-entry configuration is valid
  and `COMMERCE_RAFFLE_ENTRY_ENABLED` is exactly `true`.

## Privacy and abuse controls

- collect only email, display name, rules/privacy agreement, and request token;
- use Turnstile for the live guest-entry boundary;
- use distinct server-only HMAC material for limiter keys;
- never log raw email, IP, Turnstile token, secret, or request token;
- never expose or list entrant records publicly;
- return generic errors and no Postgres constraint/function details;
- use calm duplicate semantics without returning stored entrant data.

## Delivery sequence

1. Author migration and rollback/postflight queries locally.
2. Add static schema/RLS/security tests and generated-type expectations.
3. Add default-off server service, request boundary, detail route, and UI.
4. Run `npm run check` with the runtime disabled.
5. Review the exact migration, rollback, RLS, grants, RPC, limiter, and privacy
   behavior.
6. Obtain explicit approval before applying SQL to Production.
7. Apply once, refresh generated types, and run database postflight with zero
   retained fixtures.
8. Push the disabled application batch to `master` and verify Vercel read-only.
9. Obtain a separate live approval before enabling runtime and submitting one
   test entry; remove the fixture and restore the flag to false afterward.

## Validation matrix

- unpublished, scheduled, closed, drawing, cancelled, and stale raffles fail
  closed;
- server/database time, not browser time, controls acceptance;
- simultaneous same-email submissions create one row;
- same request token replays safely;
- same request token with another payload fails closed;
- browser roles cannot select or insert entries or limiter rows;
- public reads expose only published raffle fields;
- invalid origin, content type, header, body size, captcha, UUID, email, rules
  version, and malformed request token are rejected;
- rate-limit database failure fails closed;
- no order, payment, inventory, customer, cart, winner, or ERP row changes;
- keyboard, mobile, reduced-motion, loading, duplicate, unavailable, and retry
  states remain usable.

## Approval gates

- `RAFFLE-SCHEMA-01`: authorize authoring the exact migration and disabled
  application slice. This does not apply SQL or enable runtime.
- `RAFFLE-PROD-MIGRATION-01`: separately authorize rollback validation and one
  Production migration application.
- `RAFFLE-LIVE-SMOKE-01`: separately authorize temporary runtime activation and
  one real test entry with cleanup.
