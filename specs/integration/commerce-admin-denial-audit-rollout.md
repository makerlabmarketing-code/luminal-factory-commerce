# I-004 denied-auth/replay audit rollout

Status: code and migration prepared locally. Commerce Admin runtime remains off.
No Production SQL, credentials, or live requests have been changed.

## Delivery

The exact forward migration is
`supabase/migrations/20260929020152_add_bounded_commerce_admin_denial_audit.sql`.
Commit it to Commerce `master` only after the Production schema gate is
approved; the Supabase GitHub integration may apply migrations on push.
Do not create a Supabase preview branch or another project.

The application must remain disabled until this migration is verified. It
attempts at most one audit RPC per ten-minute category/key bucket per running
function instance. The database primary key permits one persisted sample per
bucket globally; a distributed flood can still create RPC traffic.

## Postflight checks

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
