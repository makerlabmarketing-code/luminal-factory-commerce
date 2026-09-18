# Raffle Entry Production Migration Runbook

Status: `APPLIED_POSTFLIGHT_PASS_RUNTIME_OFF`
Migration: `20260918063545_create_raffle_entry_foundation.sql`
Required gate: `RAFFLE-PROD-MIGRATION-01`

## Safety boundary

This runbook was executed after the owner approved
`RAFFLE-PROD-MIGRATION-01`. `RAFFLE-SCHEMA-01` alone did not authorize the
Production operation.

The migration creates the raffle event, private entrant ledger, hashed limiter,
service-role RPCs, RLS/grants, indexes, and cleanup job. It does not insert a
raffle, entrant, winner, order, payment, inventory reservation, or ERP record.

## Preflight

1. Confirm the target project is exactly Commerce
   `bkmbhcfokobmhfzgsfzh`, never the ERP project.
2. Confirm the migration ledger does not already contain
   `create_raffle_entry_foundation`.
3. Confirm `public.raffles`, `public.raffle_entries`, and
   `private.raffle_entry_rate_limits` do not exist.
4. Confirm the repository commit containing the migration passed
   `npm run check`.
5. Confirm runtime flags remain absent or false:
   `COMMERCE_RAFFLE_DETAIL_ENABLED` and `COMMERCE_RAFFLE_ENTRY_ENABLED`.
6. Capture current security and performance advisors.

## Transactional rollback validation

Run the exact migration against an isolated local database or inside a single
transaction that is explicitly rolled back. Validate before rollback:

- all three tables exist and RLS is enabled;
- public raffle policy exists and no entry/limiter browser policy exists;
- browser roles have no entrant/limiter privileges or RPC execute privileges;
- service role has only the reviewed table/function privileges;
- duplicate email and request-token constraints reject parallel duplicates;
- scheduled/closed/unpublished raffle submissions return `raffle_not_open`;
- an open published fixture accepts one entry;
- replaying the same token/fingerprint returns the same reference;
- reusing the token for another payload fails with SQLSTATE `22023`;
- a second token for the same normalized email returns `already_entered`;
- no order, payment, inventory, customer, cart, winner, or ERP row changes.

Rollback the entire transaction and confirm all three tables, both RPCs, and
the Cron job are absent afterward.

## Production application

After `RAFFLE-PROD-MIGRATION-01`, apply the exact reviewed migration once through
the connected Supabase migration mechanism. Do not paste an edited variant into
the SQL editor and do not enable either runtime flag during application.

## Postflight

Verify:

1. ledger version/name matches the exact reviewed migration;
2. table definitions, constraints, indexes, triggers, RLS, policies, grants,
   function security mode/search path/timeouts, and Cron schedule match source;
3. `anon` and `authenticated` can read only a published raffle fixture and
   cannot select/insert/update/delete entry or limiter rows;
4. service-role fixture tests pass for timing, duplicate, idempotency, token
   conflict, limiter exhaustion, and malformed input;
5. all fixtures and limiter rows are deleted exactly;
6. business tables and Auth users remain unchanged;
7. generated TypeScript types are refreshed from Production;
8. security/performance advisors add no unreviewed warning or error;
9. runtime flags remain false and no public entry request is accepted.

## Execution evidence — 2026-09-18

- Target `bkmbhcfokobmhfzgsfzh` was `ACTIVE_HEALTHY`; the raffle tables and
  migration were absent before execution.
- Transactional rollback validation passed and confirmed the three tables, two
  RPCs, and Cron job were absent again after `ROLLBACK`.
- Production ledger recorded version `20260918063545` with name
  `create_raffle_entry_foundation`.
- All three tables have RLS. Only published raffle metadata has a browser
  `SELECT` policy. Entrant and limiter tables have no browser policy or grant.
- Both RPCs are `SECURITY INVOKER`, use fixed empty `search_path`, have bounded
  timeouts, and are executable by `service_role` only.
- Parallel same-email submissions produced one `submitted` and one
  `already_entered`; replay, token conflict, rules mismatch, and limiter
  exhaustion checks passed.
- The published-row anon policy returned only the published fixture.
- Fixture cleanup returned raffle, entry, and limiter counts to zero. Orders,
  payments, inventory, customers, carts, and Auth user counts were unchanged.
- Production-generated TypeScript types were refreshed. Both runtime flags
  remain off; no application push or deployment occurred.
- Postflight advisors introduced only the intentional `RLS enabled, no policy`
  notices for the default-deny entrant/limiter tables and unused-index notices
  expected while all raffle tables are empty. No raffle foreign-key or RLS
  vulnerability was reported.

## Roll-forward recovery

Before any real raffle or entry exists, an approved recovery migration may:

1. unschedule `commerce-raffle-entry-rate-limit-cleanup`;
2. drop the two raffle RPCs;
3. drop `private.raffle_entry_rate_limits`;
4. drop `public.raffle_entries`;
5. drop `public.raffles`.

Once any real raffle or entrant data exists, destructive rollback is forbidden.
Disable both runtime flags first, preserve the ledger and PII, diagnose the
fault, and use a forward migration reviewed for data retention.
