# Raffle Guest Entry Technical Plan

## Status

- Status: `PLANNING_READY_DB_PROJECT_BLOCKED`
- Date: 2026-08-09
- Approved identity model: guest email
- Approved persistence direction: Supabase
- Current `master` baseline: `126534aec165e25985e4624782dfb0ce4423ea1f`
- Existing Supabase project inspection: read-only only; identified as ERP database and must not be modified from this commerce workflow

## Safety / commerce boundary

The first entry flow is a **free entry for allocation of a later purchase opportunity**:
- no entry fee
- entry itself creates no revenue
- no cash/stored-value prize
- payment/order exists only on a later separately approved winner purchase path

If this business model changes to paid chance-based entry, that is outside this implementation plan and requires a separate legal/product review before engineering work continues.

## Current infrastructure finding

The only Supabase project currently visible to the connected account is `Luminal Factory` (`kwfmfmpgpbfewpiizesv`). Read-only inspection shows it contains ERP data such as employees, attendance, finance, payroll, project, and production tables.

Therefore:
- do not create commerce tables in that project
- do not reuse ERP public tables for storefront identity or raffle entry
- do not alter ERP RLS/policies/functions/extensions
- create/use a dedicated Supabase project for `luminal-factory-commerce` before any raffle schema migration

## Supabase 2026 compatibility notes

New Supabase projects may not automatically expose new `public` tables through the Data API. Migration design must therefore treat Data API grants and RLS as separate explicit controls.

For entrant-bearing tables:
- RLS enabled from creation
- no unrestricted `anon` SELECT
- no public entrant enumeration
- no unrestricted direct browser INSERT
- trusted server mutation is preferred for first slice
- service/secret keys remain server-only

## Proposed dedicated-commerce schema

The names below are provisional until the dedicated commerce project exists and is inspected.

### `raffles`

Suggested columns:
- `id uuid primary key default gen_random_uuid()`
- `slug text not null unique`
- `status text not null`
- `title text not null`
- `summary text`
- `opens_at timestamptz`
- `closes_at timestamptz`
- `rules_version text not null`
- `is_published boolean not null default false`
- `created_at timestamptz not null default now()`
- `updated_at timestamptz not null default now()`

Constraints:
- `closes_at > opens_at` when both timestamps exist
- status constrained to approved canonical lifecycle values

Public reads should expose only published raffle data needed by `/raffle/[slug]`.

### `raffle_entries`

Suggested columns:
- `id uuid primary key default gen_random_uuid()`
- `raffle_id uuid not null references raffles(id)`
- `email text not null`
- `normalized_email text not null`
- `display_name text not null`
- `rules_version text not null`
- `rules_accepted_at timestamptz not null`
- `request_token uuid`
- `created_at timestamptz not null default now()`

Hard guards:
- unique `(raffle_id, normalized_email)`
- optional unique request token if retained for retry/idempotency
- no payment/order/winner fields on entry rows

## Trusted mutation boundary

Preferred first implementation:

`POST /api/raffles/[slug]/entries`

Server sequence:
1. validate request size and JSON shape
2. normalize email server-side
3. resolve published raffle by slug
4. evaluate authoritative server/database time against raffle state
5. verify accepted rules version
6. apply release-level eligibility rules
7. apply rate limiting / bot mitigation before persistence
8. create entry transactionally
9. map uniqueness conflict to privacy-safe `already_entered`
10. return minimal acknowledgement with correlation/request ID

Do not return:
- normalized email
- entrant lists
- database constraint names
- raw Postgres/PostgREST errors
- internal winner/admin state

## Public read boundary

Two acceptable directions after the new project is available:

1. Server-only read for raffle detail, with no `anon` table grants.
2. Explicit read-only Data API access for published raffle data with narrowly scoped SELECT RLS.

The implementation should choose the smallest exposed surface after checking how the current Next.js server deployment is configured.

`raffle_entries` should not receive public SELECT grants/policies.

## UI implementation slice

After the DB project gate is cleared:
- add `/raffle/[slug]`
- detail page renders authoritative normalized presentation state
- guest form fields: email, display name, rules/privacy agreement
- form shown only for server-normalized `open` state
- states: ready, submitting, submitted, duplicate, closed, ineligible, unavailable, retryable error
- keyboard/focus/accessibility review
- no account creation requirement
- no payment/order UI

## Tests

Required automated checks:
- email normalization and validation
- one-entry uniqueness semantics
- retry/idempotency behavior
- closed/unpublished raffle fails closed
- stale/unknown status never enables entry
- duplicate maps to generic `already_entered`
- raw DB errors are not returned
- no entrant SELECT surface in frontend client
- route/detail boundary remains separate from order/payment code

Required integration verification against dedicated commerce Supabase:
- migration applies cleanly
- RLS enabled on entrant-bearing table
- public/anon cannot enumerate entries
- valid open raffle accepts one entry
- second normalized-email submit cannot create a second row
- closed raffle cannot create an entry
- advisors reviewed after DDL

## Migration / rollback workflow

Only after a dedicated commerce Supabase project is selected or created:
1. inspect project status, Postgres version, existing schemas, extensions, grants, and migrations
2. create a dedicated feature branch from current `master`
3. author a repository migration first
4. apply/verify in a non-production commerce environment where available
5. run security + performance advisors
6. generate/update TypeScript DB types
7. implement Next.js server read/write boundary
8. open PR
9. require GitHub CI + Vercel Preview + DB verification before merge

Rollback plan must be written alongside the actual migration and must never target the ERP project.

## Current blocker

`BLOCKED_ON_DEDICATED_COMMERCE_SUPABASE_PROJECT`.

The connected Supabase account currently exposes only the ERP project. Creating a new Supabase project is a potentially billable resource and requires explicit organization/cost confirmation before the tool can create it.
