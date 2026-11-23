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
5. Verify the worker denies missing/bad Authorization. Run a controlled
   signup in an isolated deployment with the mail flag enabled there and a
   single approved mailbox. Verify one confirmation and no duplicate on retry.
   Verify ERP displays the test entry. Keep Production email disabled during
   these checks. Test raffles intentionally never queue customer confirmations.
6. Before opening a Production release, set
   `COMMERCE_RAFFLE_CONFIRMATION_ENABLED=true`, redeploy and verify the
   worker returns `idle` with valid authorization for an empty queue. Activate
   the two named schedules with `cron.alter_job(jobid, active := true)`.
7. Only after name/image/price/rules are ready, schedule and publish the draft
   through the existing management contract. Clock jobs run every minute;
   opening status may lag by up to a minute, while entry SQL enforces the exact
   closing boundary. Retry job drains one queued email every two minutes; each
   new successful entry also triggers an immediate post-response attempt.

## Rollback

Disable the mail flag and deploy that change, then run `rollback.sql`.
Both schedules pause, the entry trigger stops accepting new jobs, and service
execution of the queue RPCs is revoked. Entries, addresses, and job evidence
are preserved. Existing raffle states are not reversed. An email already
handed to Resend can still arrive.

To resume, use `resume.sql` and verify `validation.sql`. Resume restores the
trigger and service RPCs and leaves both schedules paused until step 6. Entries
created during the pause are not backfilled. Already sent messages stay sent.
Pending jobs within the 23-hour retry window can be processed again.

## Validation evidence

`node scripts/verify-raffle-confirmation-sql.mjs <PGlite-module-path>` passed
isolated PostgreSQL execution: transaction rollback, entry uniqueness, test
exclusion, browser denial, lease claim exclusion, stale lease tokens,
retry, accepted-mail deduplication, retry expiry, canonical lifecycle updates
and reversible pause/resume without backfill. It does not exercise live pg_cron, pg_net, Vault
or Resend delivery. Email unit tests cover escaping, subject newlines, stable
provider keys, response/error classification and recipient isolation.

Governing live SQL gate: `specs/raffle/raffle-detail-entry-schema-rls-technical-plan.md`
states: “Obtain explicit approval before applying SQL to Production.” This
package is a new schema addition; earlier entry/audit migrations do not cover it.
