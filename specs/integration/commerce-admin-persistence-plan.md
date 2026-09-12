# Commerce Admin persistence plan

Status: Production persistence applied and validated; integration runtime remains disabled. No Commerce Admin route or real ERP → Commerce request is live.

## Goal

Provide the durable server-side state required by `lfc-hmac-v1` before any ERP → Commerce management route can be activated:

1. atomic replay protection;
2. append-only management audit evidence;
3. bounded retention and cleanup;
4. service-role-only access with no browser/customer authority.

## Replay nonce store

Production table: `private.commerce_admin_replay_nonces`.

Columns:

- `key_id text not null`
- `nonce text not null`
- `request_id uuid not null`
- `accepted_at timestamptz not null default statement_timestamp()`
- `expires_at timestamptz not null`

Constraints:

- primary key on `(key_id, nonce)`;
- bounded lengths matching the application contract;
- `expires_at > accepted_at`;
- no foreign key to ERP or customer-facing Commerce tables.

The consume operation is one database statement using `insert ... on conflict do nothing` and returns whether exactly one row was inserted. This makes concurrent replay attempts deterministic: exactly one request can win for the same `(key_id, nonce)`.

The service-role-only RPC is `public.consume_commerce_admin_nonce(...) returns boolean`. It remains `SECURITY INVOKER`; `anon` and `authenticated` have no execute or table privileges.

Replay retention is fixed at 10 minutes from acceptance. Cleanup is database-local through the `commerce-admin-replay-cleanup` Cron job.

## Management audit store

Production table: `private.commerce_admin_audit_events`.

The audit path records request/client/key/actor/workspace/scope/operation/target/outcome/status/failure-code metadata only. It must not persist HMAC secrets, raw signatures, Commerce service-role credentials, raw request bodies, OTP/session/cookie credentials or arbitrary browser headers.

The normal application credential has append-only semantics: `service_role` receives `SELECT, INSERT`, not `UPDATE` or `DELETE`; browser/customer roles have no table or RPC access. The insert RPC `public.record_commerce_admin_audit_event(...)` remains `SECURITY INVOKER`.

Audit retention is fixed at 180 days. Cleanup is database-local through the `commerce-admin-audit-cleanup` Cron job.

## Production validation record

Production migration ledger version: `20260911145411_add_commerce_admin_security_persistence`.

Validated after apply:

1. both replay and audit tables have RLS enabled;
2. `anon` and `authenticated` have no replay/audit table privileges and no RPC execute privilege;
3. `service_role` can `SELECT/INSERT/DELETE` replay state as required, but audit access is `SELECT/INSERT` only;
4. both RPCs are `SECURITY INVOKER`;
5. duplicate nonce validation returns first acceptance=true and replay acceptance=false;
6. replay primary key is `(key_id, nonce)` and consume uses `ON CONFLICT DO NOTHING`, providing atomic one-winner semantics under concurrent inserts;
7. expired replay and >180-day audit fixture rows match the cleanup predicates;
8. exactly one replay cleanup Cron job and one audit cleanup Cron job exist;
9. validation fixtures were executed inside rollback-scoped transactions and postflight confirmed zero fixture rows remained;
10. no order/payment/inventory/raffle/customer mutation was included in the migration.

## Remaining activation gates

Persistence is no longer the blocker, but integration remains fail-closed until all remaining gates pass:

1. ERP signer matches the shared `lfc-hmac-v1` compatibility vector;
2. Commerce credential provisioning and key rotation are configured server-side;
3. live route implementation is reviewed;
4. Hero management operations are wired through existing Commerce-owned guards/RPCs;
5. tamper/replay/rotation tests pass end to end;
6. explicit approval is received before enabling the Production integration runtime flag.
