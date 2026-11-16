# I-006 · Real PostgreSQL contract gate (isolated GitHub runner)

**Result scope:** Execute the **actual Commerce migration SQL** for replay nonce and Homepage Hero idempotency on a disposable PostgreSQL 16 service container inside the existing GitHub Actions CI job. No Supabase project is created, no Production SQL, no Production key, no external connection, no published Hero.

## CI behavior

- `.github/workflows/ci.yml` starts `postgres:16-alpine` with the job, then runs `bash scripts/qa/run-commerce-admin-postgres.sh` before the standard `npm run check`.
- Runner fails closed unless the job explicitly sets `COMMERCE_ADMIN_DB_QA_LOCAL_ONLY=true`, `PGHOST=127.0.0.1`, `PGPORT=5432`, `PGDATABASE=commerce_admin_contract_ci`, `PGUSER=postgres`.
- The script loads the **unchanged** SQL schema/constraints/roles/RLS and RPCs from `supabase/migrations/20260910103000_create_homepage_hero_presentations.sql`, `20260911101000_add_homepage_hero_publish_rpc.sql`, `20260911145411_add_commerce_admin_security_persistence.sql`, and `20260912150000_add_commerce_admin_hero_idempotency.sql`.
- Only Supabase-specific Storage bucket/trigger setup and `pg_cron` schedules are omitted for the isolated container. The source code for `consume_commerce_admin_nonce` and `manage_homepage_hero` is not duplicated or rewritten.
- The `anon` / `authenticated` / `service_role` roles are synthetic; `service_role` has `BYPASSRLS` to model Supabase's privileged server role.
- Assertions cover RLS and EXECUTE grants (anon/authenticated cannot call either RPC), nonce acceptance/replay rejection, a different key using the same nonce, invalid nonce rejection, draft creation exactly once, same `operationId` same result, conflicting fingerprint failure, and two simultaneous PostgreSQL sessions for replay and idempotency.
- The runner truncates fixture tables, verifies zero synthetic records and the PostgreSQL container is destroyed when the job ends.

## Why this is better than the local HTTPS in-memory fixture

This exercises **real PostgreSQL uniqueness, transactions, row locks, SQL functions and RLS grants** with original migrations. It can catch defects that the in-memory fixture cannot, including duplicate nonce acceptance and conflicting concurrent idempotency calls.

## Remaining gate

GitHub Actions' PostgreSQL has no real Supabase Auth, Storage object policy, pg_cron scheduling or deployed ERP session. This is **not** live Production acceptance. Live endpoint-to-database tests, HMAC secret rotation and least-privilege per-key scope policy remain gated and cannot be declared verified from this run.

No separate paid Supabase project or external service is used; GitHub Actions continues to consume normal runner minutes within the account's available quotas.
