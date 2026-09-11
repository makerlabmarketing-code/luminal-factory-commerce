# Commerce Admin persistence plan

Status: design only. This file does not authorize or apply a Supabase migration.

## Goal

Provide the durable server-side state required by `lfc-hmac-v1` before any ERP → Commerce management route can be activated:

1. atomic replay protection;
2. append-only management audit evidence;
3. bounded retention and cleanup;
4. service-role-only access with no browser/customer authority.

## Replay nonce store

Proposed table: `private.commerce_admin_replay_nonces`.

Proposed columns:

- `key_id text not null`
- `nonce text not null`
- `request_id uuid not null`
- `accepted_at timestamptz not null default now()`
- `expires_at timestamptz not null`

Required constraints:

- primary key / unique constraint on `(key_id, nonce)`;
- bounded lengths matching the application contract;
- `expires_at > accepted_at`;
- no foreign key to ERP or customer-facing Commerce tables.

The consume operation must be one database statement with `insert ... on conflict do nothing` and return whether exactly one row was inserted. This makes concurrent replay attempts deterministic: exactly one request can win for the same `(key_id, nonce)`.

A proposed service-role-only RPC is `public.consume_commerce_admin_nonce(...) returns boolean`. It should remain `SECURITY INVOKER`; the Commerce server calls it using the Commerce service role, and the service role receives only the minimum privileges required for this internal table/RPC. `anon` and `authenticated` receive no execute or table privileges.

Replay rows should live longer than the 90-second signature freshness window so delayed concurrent requests cannot become valid again after an early cleanup. Proposed retention is 10 minutes from acceptance, with cleanup at least hourly. The exact retention is a security parameter and should be fixed in the migration/tests rather than supplied by callers.

## Management audit store

Proposed table: `private.commerce_admin_audit_events`.

Proposed columns:

- `id uuid primary key default gen_random_uuid()`
- `occurred_at timestamptz not null default now()`
- `request_id uuid not null`
- `client_id text not null`
- `key_id text not null`
- `actor_id text not null`
- `workspace_id text not null`
- `scope text not null`
- `operation text not null`
- `target_type text not null`
- `target_id text null`
- `outcome text not null`
- `http_status integer null`
- `failure_code text null`

Do not persist:

- HMAC secret material;
- raw signature values;
- Commerce service-role credentials;
- raw request bodies;
- OTP/session/cookie credentials;
- arbitrary browser headers.

`failure_code` must use a small internal allowlist and must not reveal whether a particular key id, nonce or signature component was valid to an external caller.

The server write path should be append-only. No normal application code should update audit rows. Public/anon/authenticated roles receive no table or RPC access. A service-role-only invoker RPC may be used to insert a validated bounded event.

Proposed audit retention is 180 days, subject to explicit approval before migration. Cleanup should be database-local and must not accept caller-supplied retention values.

## Failure behavior

Replay persistence is part of authentication, therefore failure to consume a nonce must fail closed and the privileged operation must not run.

Audit persistence has two categories:

- authentication/authorization denial: best-effort audit is useful, but inability to write audit must never turn a denied request into an allowed request;
- authorized state-changing operation: audit persistence should be treated as required evidence. The operation service should use a design that avoids silently completing a privileged mutation without a durable audit record. The exact transaction boundary depends on whether the target operation is a PostgreSQL RPC, Storage operation or mixed workflow and must be reviewed per module.

Homepage Hero publish/unpublish already use Commerce-owned RPCs. A later implementation should prefer a Commerce-side orchestration boundary that records the management audit together with database mutations where transactionally practical. Storage uploads require a compensating/audit strategy because Storage and PostgreSQL are not one transaction.

## Required migration validation

Before Production apply:

1. static migration contract tests;
2. isolated migration apply and rollback-by-forward-repair review;
3. concurrent nonce test proving one winner for the same nonce;
4. distinct nonces can succeed concurrently;
5. expired cleanup does not remove fresh rows;
6. anon/authenticated cannot inspect or mutate replay/audit state;
7. service role can consume nonce and append audit only through approved boundary;
8. no SECURITY DEFINER unless separately reviewed and justified;
9. database advisors show no new security regression;
10. temporary Production fixtures, if explicitly approved, are fully cleaned and counted after validation.

## Approval gate

Creating the real migration, applying it to Commerce Production, adding Cron cleanup or wiring service-role persistence are separate changes requiring explicit approval. Until then, `COMMERCE_ADMIN_INTEGRATION_ENABLED` remains absent/false and no management route is live.
