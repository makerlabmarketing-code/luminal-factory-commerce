# Phase 6 Guest Cart Rate Limit Production Runbook

## Document metadata

- **Status:** `APPLIED_DATABASE_POSTFLIGHT_PASSED_RUNTIME_DISABLED`
- **Date:** 2026-08-14
- **Executed:** 2026-08-15
- **Target:** Supabase project `bkmbhcfokobmhfzgsfzh` (`Luminal Factory Commerce`)
- **Migration:** `20260814075546_add_guest_cart_rate_limits.sql`
- **Migration SHA-256:** `f71a3a42db0d9f3ddbb4b18c8fd09757e02b135d2d686bb9c54cf71e1d9d79cc`
- **Runtime:** remains disabled before, during and after this runbook

## Purpose and cost boundary

Add a durable fixed-window limiter for the server-mediated guest cart using the existing Supabase Postgres database. No Redis vendor, Edge Function, paid branch or new recurring service is introduced. The counter rows use the existing Free-plan database quota; hourly cleanup keeps their retention bounded.

The migration adds only:

- private schema access hardening;
- `private.guest_cart_rate_limits` with RLS and no client policy;
- service-role table privileges;
- `public.consume_guest_cart_rate_limit(text, text)` as `SECURITY INVOKER`;
- service-role-only RPC execution;
- versionless `pg_cron` installation and one hourly expired-row cleanup job.

It adds no Cart UI, Auth, OTP, Turnstile, PII, address, inventory, order, payment or ERP behavior.

## Required approval boundary

Do not execute rollback validation or apply this migration from general roadmap approval alone. The owner must explicitly authorize the production DDL operation. Do not enable `COMMERCE_GUEST_CART_ENABLED` as part of this runbook.

## Read-only preflight

Before any DDL:

1. Confirm project name, ref, region and `ACTIVE_HEALTHY` status.
2. Confirm migration ledger contains exactly:
   - `20260810045019_create_commerce_core`;
   - `20260810045219_add_commerce_fk_indexes`;
   - `20260814035441_create_guest_cart_foundation`.
3. Confirm `private.guest_cart_rate_limits` and `public.consume_guest_cart_rate_limit(text, text)` do not exist.
4. Confirm `pg_cron` is not installed and no job named `commerce-guest-cart-rate-limit-cleanup` exists.
5. Confirm `carts`, `cart_items`, products, customers and orders remain zero-row unless a separately authorized operation changed that fact.
6. Recompute the migration SHA-256 and require an exact match to this document.
7. Run security and performance advisors; record existing informational findings separately from new warnings.

If any check differs, stop without mutation and reconcile the source of drift.

## Transactional rollback validation

With explicit owner approval, execute the exact migration inside one explicit transaction with a 5-second lock timeout and 30-second statement timeout. Before rollback, verify:

- table, primary key, checks and expiry index exist;
- RLS is enabled and there are no policies;
- `anon` and `authenticated` have no schema, table or function access;
- `service_role` has only the required table operations and RPC execution;
- the function is `SECURITY INVOKER` with empty `search_path`;
- thresholds are 240 request, 20 create and 120 mutation per UTC fixed hour;
- call 241 for one request key is denied while calls 1–240 are allowed;
- call 21 for one create key and call 121 for one mutation key are denied;
- invalid hashes and buckets fail;
- the cleanup job exists with the reviewed hourly schedule.

Then roll back and prove the table, function, extension/job and all test counter rows are absent. Do not apply forward if rollback validation leaves any object or row behind.

## Forward operation

Apply the exact reviewed migration once using migration name `add_guest_cart_rate_limits`. Do not paste a modified copy, split the migration, or retry blindly after an error.

## Postflight

After a successful migration:

1. Confirm exactly one new ledger entry named `add_guest_cart_rate_limits`.
2. Repeat all structural, RLS, grant, function and Cron checks from rollback validation.
3. Run threshold tests inside a transaction and roll them back so the table returns to zero rows.
4. Verify direct access and RPC calls fail under `anon` and `authenticated`.
5. Verify the RPC succeeds only under the trusted service role.
6. Confirm `COMMERCE_GUEST_CART_ENABLED` remains absent or false in every Vercel environment.
7. Regenerate `src/lib/supabase/database.types.ts` from production and review the diff.
8. Run security and performance advisors and compare against preflight.

## Failure handling

If the migration operation reports an error, first inspect the ledger and object state. Supabase migration DDL should be transactional, but verify rather than assume. Do not retry until the exact failure and resulting state are known.

If postflight reveals a security exposure, immediately keep runtime disabled, revoke client execution/table/schema privileges with a reviewed forward repair, and preserve evidence.

## Rollback boundary after forward apply

Rollback is destructive schema work and requires separate explicit approval:

1. unschedule `commerce-guest-cart-rate-limit-cleanup`;
2. drop `public.consume_guest_cart_rate_limit(text, text)`;
3. drop `private.guest_cart_rate_limits`;
4. drop `pg_cron` only if it has no other jobs or owners and this migration was its sole installer;
5. preserve the `private` schema if any other object uses it;
6. reconcile migration history only through the supported Supabase workflow.

Runtime remains disabled throughout. Rollback does not touch carts, cart items or any customer/transaction table.

## Success scope

Successful postflight proves only that the durable limiter foundation exists and is default-deny. It does not authorize staging or production cart runtime, Auth, OTP, Turnstile, PII collection, saved addresses or Cart UI.

## Execution record

The owner explicitly approved production rollback validation and one exact migration application on 2026-08-15.

- Read-only preflight confirmed project `bkmbhcfokobmhfzgsfzh` was `ACTIVE_HEALTHY` in `ap-northeast-1`, the expected three-entry ledger was intact, the limiter objects and `pg_cron` were absent, and carts, cart items, products, customers and orders were zero-row.
- Transactional rollback validation ran the exact migration with the reviewed timeouts. Structure, RLS, grants, `SECURITY INVOKER`/empty `search_path`, 240/20/120 thresholds, invalid-input rejection and the hourly cleanup job all passed. Rollback then proved the table, function, extension, job and test counters were absent and the ledger remained unchanged.
- The exact reviewed migration was applied once as ledger entry `20260815022728_add_guest_cart_rate_limits`.
- Production database postflight repeated structural and behavioral checks, proved direct table and RPC access fail under `anon` and `authenticated`, proved service-role RPC access succeeds, rolled back all threshold counters and left the limiter, carts and cart items at zero rows.
- `pg_cron` `1.6.4` is installed with exactly one `commerce-guest-cart-rate-limit-cleanup` job at `17 * * * *`.
- Security and performance advisors added only the expected informational default-deny/no-policy and unused-index notices; no warning or error was introduced.
- Generated production types were refreshed with the service-only RPC signature.
- No Vercel environment variable was changed and no deployment was triggered. The connected Vercel project still reported production at `master` commit `c646d8d`, before this disabled cart slice. The available connector did not expose environment-variable values for direct per-target enumeration, so that evidence remains a staging preflight item; repository configuration stays default-false and no cart/Auth runtime was activated.
