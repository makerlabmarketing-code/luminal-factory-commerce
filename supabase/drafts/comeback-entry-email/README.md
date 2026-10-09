# Comeback registration confirmation — review package

Status: implementation tested; new Production SQL and email activation awaiting
approval. Target **Commerce bkmbhcfokobmhfzgsfzh**, not ERP.

## Draft prepared

Unpublished raffle `d6c1e22d-bca6-4570-a678-f944e56af855`, slug
`comeback-20261010`, title Comeback. Saturday 10 October 2026 12:00 through
Monday 12 October 2026 12:00, Asia/Ho_Chi_Minh (05:00 UTC; 48 hours).
The requested 80 USD is recorded in the draft copy. The new colorway's name,
image and product/variant association are pending. Before publishing, set the
authoritative linked `product_prices` price to **USD 8000 minor units**, check
the displayed price and winner price snapshot, confirm shipping charges and
final rules, and verify the product is publicly readable. Draft copy is not a
price ledger. This draft cannot publish without its product association.

## Scope

Existing guest form and shipping RPC remain authoritative. A trigger creates
one private email job in the same entry transaction; rolled-back submissions
create no email. Existing entries and test raffles are never backfilled.
Email says participation succeeded, not selection/payment. It contains no
shipping address. Stable Resend idempotency keys, leased claims, maximum five
attempts and a 23-hour retry window avoid retrying beyond Resend's 24-hour key
window. `sent` means accepted by Resend, not verified inbox delivery.

ERP `/admin/commerce/raffles` reads through the existing HMAC boundary, with
dedicated `COMMERCE_RAFFLE_VIEW` and `COMMERCE_RAFFLE_ENTRY_VIEW` permissions.
Only Owner has implicit access; no employee gets customer PII from Product
permissions. Staff provisioning is a separate explicit operational action.
PII stays in Commerce. Lists fail closed when response limits are exceeded.

## Apply after exact-package approval

1. Run `preflight.sql`: existing foundation present; no conflicting objects/jobs.
2. Apply `forward.sql`, `lifecycle.sql`, then `schedules.sql`. Both cron jobs
   are created inactive. `pg_net` is the only new extension.
3. Run `validation.sql`. Verify browser-role denial and service-only RPC access.
4. Configure a domain-restricted sending credential as server-only
   `RESEND_API_KEY`, `RAFFLE_CONFIRMATION_FROM= Luminal Factory
   <notifications@luminalfactory.com>` (without the leading space), and a
   random worker secret in Vercel. Store the identical worker secret in Vault
   named `raffle_email_worker_secret`; never commit or print it. The domain
   luminalfactory.com was verified for sending on 9 October 2026.
5. Validate the worker denies missing/bad Authorization. With a controlled,
   explicitly approved mailbox, verify one confirmation and no duplicate on
   retry; verify ERP displays the correct customer's data. The mail flag stays
   false until these prerequisites are ready. Test raffles intentionally never
   queue customer confirmations; use an isolated approved transactional fixture.
6. Set `COMMERCE_RAFFLE_CONFIRMATION_ENABLED=true`, redeploy, activate the two
   named jobs with `cron.alter_job(jobid, active := true)`.
7. Only after name/image/price/rules are ready, schedule and publish the draft
   through the existing management contract. Clock jobs run every minute;
   opening status may lag by up to a minute, while entry SQL enforces the exact
   closing boundary. Retry job drains one queued email every two minutes; each
   new successful entry also triggers an immediate post-response attempt.

## Rollback

Disable the mail flag first; apply `rollback.sql`. It stops both jobs, removes
the entry trigger and revokes service queue RPCs. Entries, addresses and job
evidence remain. Existing raffle states are not reversed. The pg_net extension
is retained to avoid disturbing other consumers. No customer deletion.

## Validation evidence

`node scripts/verify-raffle-confirmation-sql.mjs <PGlite-module-path>` passed
isolated PostgreSQL execution: transaction rollback, entry uniqueness, test
exclusion, browser denial, lease claim exclusion, stale lease tokens,
retry, accepted-mail deduplication, retry expiry, canonical lifecycle updates
and non-destructive rollback. It does not exercise live pg_cron, pg_net, Vault
or Resend delivery. Email unit tests cover escaping, subject newlines, stable
provider keys, response/error classification and recipient isolation.

Governing live SQL gate: `specs/raffle/raffle-detail-entry-schema-rls-technical-plan.md`
states: “Obtain explicit approval before applying SQL to Production.” This
package is a new schema addition; earlier entry/audit migrations do not cover it.
