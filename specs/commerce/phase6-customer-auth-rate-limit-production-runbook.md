# Phase 6 Customer Auth Rate Limit Production Runbook

## Document metadata

- **Status:** `REVIEW_REQUIRED_NOT_APPLIED`
- **Date:** 2026-08-26
- **Target:** Supabase project `bkmbhcfokobmhfzgsfzh` (`Luminal Factory Commerce`)
- **Migration:** `20260826091055_add_customer_auth_rate_limits.sql`
- **Migration SHA-256:** `b099020aad64570ae9cb65553968f7e46c55020e2637f701543a5762281c6725`
- **Runtime:** `COMMERCE_CUSTOMER_AUTH_ENABLED` remains false before, during and after this runbook

## Purpose and scope

Add the application-owned abuse limiter required before email OTP staging. The migration uses the existing Supabase Postgres and Cron capacity, stores only server-HMAC keyed hashes, and adds no raw email or source address, Auth user, customer row, PII, UI, payment, inventory or ERP behavior.

The fixed database policy is:

- three OTP requests per normalized-email key per 15 minutes;
- ten OTP requests per source key per hour;
- ten OTP verification attempts per source key per 15 minutes;
- expired counters deleted hourly.

The table is private, RLS-enabled and policy-free. Only `service_role` may access it or execute the `SECURITY INVOKER` RPC.

## Approval boundary

This document does not authorize DDL. Run read-only preflight freely, but transactional rollback validation and production application each require explicit owner approval. Do not change Supabase Auth, SMTP, Turnstile or Vercel runtime settings in this operation.

## Read-only preflight

1. Confirm project ref `bkmbhcfokobmhfzgsfzh`, expected region and `ACTIVE_HEALTHY` status.
2. Confirm the migration ledger includes the commerce core, guest-cart foundation and guest-cart limiter entries, with no customer-Auth limiter entry.
3. Confirm `private.customer_auth_rate_limits`, `public.consume_customer_auth_rate_limit(text, text)` and Cron job `commerce-customer-auth-rate-limit-cleanup` do not exist.
4. Confirm current carts, cart items, customers and Auth-user counts; unexpected rows require reconciliation rather than deletion.
5. Recompute SHA-256 and require the exact value in this document.
6. Record security and performance advisor output before DDL.

Stop without mutation if any expected object already exists or the hash differs.

## Transactional rollback validation

With explicit approval, execute the exact migration inside one transaction with a 5-second lock timeout and 30-second statement timeout. Before rollback, prove:

- table, checks, primary key and expiry index exist;
- RLS is enabled with no policies;
- `anon` and `authenticated` lack schema/table/function access;
- `service_role` has only the reviewed table operations and RPC execution;
- the function is `SECURITY INVOKER` with empty `search_path`;
- calls 1–3 for `otp_email_15m` pass and call 4 is denied;
- calls 1–10 for `otp_source_hour` and `verify_source_15m` pass and call 11 is denied;
- invalid hashes and buckets fail;
- the cleanup job exists at `23 * * * *`.

Roll back, then prove the new table, function, Cron job and all test counters are absent. Existing guest-cart limiter objects and cleanup job must remain intact.

## Forward operation

After rollback validation and a separate explicit application approval, apply the exact migration once. Do not paste a modified copy, split it, or retry after an error without reconciling ledger and object state.

## Postflight

1. Confirm exactly one new migration-ledger entry.
2. Repeat structural, RLS, grant, function and Cron checks.
3. Repeat threshold tests inside a transaction and roll them back to zero counters.
4. Prove direct table and RPC access fail for `anon` and `authenticated`.
5. Prove the trusted server role can consume each fixed bucket.
6. Confirm both guest-cart and customer-Auth runtime flags remain false/absent in Production.
7. Regenerate `src/lib/supabase/database.types.ts` from production and review only the expected RPC addition.
8. Compare security/performance advisors with preflight.

## Failure and rollback boundary

On migration error, keep runtime false and inspect the ledger plus every proposed object before considering a retry. If postflight exposes client access, revoke it through a reviewed forward repair and preserve evidence.

Dropping the function, table or Cron job after forward application is destructive and requires separate approval. Never remove the shared `private` schema, `pg_cron`, guest-cart limiter table or guest-cart cleanup job as part of this rollback.

## Success scope

Successful postflight proves only that the default-deny Auth limiter exists. It does not authorize enabling email OTP, configuring Turnstile/SMTP, creating users or customers, exposing Account UI, attaching carts, storing addresses or changing Production runtime.
