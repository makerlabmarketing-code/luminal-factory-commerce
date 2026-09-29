# I-004 denied-auth/replay audit rollout

Status: application commit `fbb78b7` on Commerce `master`; Production
migration applied and validated as
`20260929020944_add_bounded_commerce_admin_denial_audit`. Commerce Admin
runtime remains off; no HMAC credentials or live ERP request were configured.

## Delivery

The exact forward migration is
`supabase/migrations/20260929020152_add_bounded_commerce_admin_denial_audit.sql`.
It was committed to Commerce `master` and applied once to the existing
Commerce Supabase project. No preview branch or new project was created.

The application must remain disabled until this migration is verified. It
attempts at most one audit RPC per ten-minute category/key bucket per running
function instance. The database primary key permits one persisted sample per
bucket globally; a distributed flood can still create RPC traffic.

## Postflight checks

Completed on 2026-09-29: ledger exact-once; RLS enabled and zero policies;
anon/authenticated have no table or RPC privileges; service role can execute
the invoker RPC; one cleanup job exists. A rollback-scoped transaction
confirmed first sample true, duplicate false for each category and an
invalid category/key pair rejected with SQLSTATE 22023. Final sample row
count was zero. Security advisor had no new ERROR; existing informational
default-deny notice remains. GitHub quality passed, Vercel READY, homepage
200 and Admin route 503 `INTEGRATION_DISABLED`.

The reusable verification sequence is:

1. Migration ledger contains the new version exactly once; the table,
   invoker RPC and one cleanup Cron job exist.
2. `private.commerce_admin_denial_samples` has RLS enabled, zero policies and
   no direct `anon` or `authenticated` privileges. Only `service_role`
   can execute the RPC.
3. In a rollback-scoped transaction, call the RPC twice with
   `('authentication_failed', '')`: first returns true, second false and
   exactly one row exists for the current bucket. A replay sample with a
   configured-format key has its own bucket; mismatched category/key raises
   SQLSTATE 22023. Roll back all fixtures.
4. With the runtime still off, the Admin route returns 503
   `INTEGRATION_DISABLED`. After the separate credential/test gates, verify
   tamper and replay responses remain 401 `AUTHENTICATION_FAILED`, and
   inspect only the bounded sample counts. Do not log or query raw signatures.
5. Check Supabase security and performance advisors. The 30-day cleanup
   predicate must match expired buckets only.

## Rollback

Keep the runtime off, then run the following only after confirming no audit
sample must be retained:

```sql
select cron.unschedule('commerce-admin-denial-sample-cleanup');
drop function public.record_commerce_admin_denial_sample(text, text);
drop table private.commerce_admin_denial_samples;
```

Revert the application commit if schema rollback is required. Existing
management audit and nonce tables are independent and remain untouched.
