# E-005 Product / Colorway draft management

## Approved implementation direction (02 October 2026)

Meowhe is the Product; Lolipop, Mictlán and Mono are colorways represented by
Commerce `product_variants.product_id`. Stable UUIDs remain authoritative.
ERP operational colorways and Commerce variants remain separate data concepts.
The owner authorized continuation and automatic application merge/deploy after
passing checks. Exact production SQL remains a separate reviewed gate.

## First bounded slice

- GET/POST `/api/admin/v1/products/{id}/colorways` and PATCH
  `/api/admin/v1/products/{id}/colorways/{variantId}` use existing product read/write
  HMAC scopes. ERP uses COMMERCE_PRODUCT_VIEW / COMMERCE_PRODUCT_MANAGE.
- Input: name (1–160), slug (lowercase hyphenated, up to 120), optional description
  (up to 5000). Reject extra fields, including productId, SKU, price, stock and
  isActive. Product relation comes from the authorized path.
- Existing `attributes` stores `colorway_slug` and `colorway_description`.
  The receipt operation constraint retains all existing Hero/Product/Raffle/winner
  operations, including values in the older winner-operation migration.
  A per-Product unique expression index prevents duplicate colorway slugs.
  No new table/column/RLS policy, no price/inventory/media write in this slice.
- Create sets is_active=false. Create/update require a locked draft parent;
  update also checks variant ownership and inactive state. Existing unrelated
  attributes remain intact. Active or published objects cannot be edited here.
- `manage_catalog_colorway` is a service-role-only SECURITY INVOKER RPC using
  existing private idempotency receipts. Retries with the same operation ID and
  fingerprint return the exact original result; changed fingerprints conflict.
- ERP retains failed input, operation IDs and unsaved-change warnings; selection
  changes abort stale reads. No automatic write retry or public activation.
- Legacy variants without colorway metadata can be viewed; not silently inferred
  as managed colorways or merged by name.

## Compatibility and data boundary

The published Meowhe Lolipop Product, its media, prices, cart/raffle/order links
are left intact. Reparenting that record is not this slice. After UUIDs and
references are audited, a separate reviewed migration can link historical
presentation to the new Meowhe Product. No automatic seed or backfill runs.
Creating the three real colorway drafts follows live smoke after SQL approval.
Publishing, asset management, archive storefront routing and price/inventory
remain separately scoped followups.

## Rollout and rollback

Forward/preflight/validation/rollback are in `supabase/drafts/colorway-management`.
Forward SQL is deliberately outside migrations until exact approval and database
preflight. Generate the deployment migration with Supabase CLI; do not invent a
migration filename. No direct Production SQL runs from this workspace.
Validation requires isolated create/edit, same-ID retry, changed-ID conflict,
duplicate slug, wrong-parent, published-parent and public-role denial cases.
Concurrent save versus Product publish must respect the locked parent row.

Rollback disables routes/app UI, drops only the new RPC/index, and preserves
variants, attributes and receipt history; additive receipt operation values stay.
No delete/backfill or credential expansion is bundled. Missing RPC fails closed.

## Validation ledger — 03 October 2026

Commerce full `npm run check` passed: lint (two existing warnings), TypeScript,
346 tests, static security, production dependency audit (zero vulnerabilities)
and production build. ERP full Vitest: 119 files / 883 tests; lint/TypeScript
and production build pass. Earlier runtime restrictions are resolved.

SQL forward/fixture/rollback passed an isolated WASM PostgreSQL slice fixture
via PGlite 0.5.8, using actual repository Product/Variant/receipt definitions
and public read policies. Create/edit/replay, changed fingerprint, duplicate
slug, wrong parent, active/published state rejection, metadata retention,
service-role invocation, public-role RPC denial and inactive visibility,
transaction rollback and data-retaining application rollback all pass.
The runner accepts only a local PGlite module; no database URL or network
client is used. This is single-connection coverage, not a hosted two-session
concurrency or authenticated application persistence PASS.

Reproduce without adding a runtime dependency:

```sh
npm install --prefix /tmp/colorway-sql-test --ignore-scripts --no-audit --no-fund @electric-sql/pglite@0.5.8
PGLITE_MODULE=/tmp/colorway-sql-test/node_modules/@electric-sql/pglite/dist/index.js node scripts/verify-colorway-sql-local.mjs
```

Read-only Production preflight: duplicate slug groups=0, new RPC absent,
variant RLS=true, anon INSERT=false, authenticated UPDATE=false. Existing
receipt constraint includes all Hero/Product/Raffle/winner operation values;
forward SQL preserves them. No Production SQL writes were performed.

Remaining: review exact SQL, native/hosted two-session concurrency smoke,
ordered Commerce→ERP rollout and owner UI create/reload/edit smoke. Owner
manual testing is deferred until available and does not block independent
content draft preparation. Types declare the proposed RPC; they do not
assert that the RPC already exists in Production.

## Continuation — 05 October 2026

Merged current EN/VI `master` into the existing E-005 feature branch; its existing
PR is retained. No production branch push, migration or catalog write.
Fresh read-only Production preflight: duplicate colorway slug groups=0, new RPC
absent, Variant RLS enabled, anon INSERT/authenticated UPDATE denied. Two draft
Products and one published Product remain; the existing Variant remains intact.
`catalog-colorways-sql.yml` runs the exact draft SQL on a fresh PostgreSQL 17
service and observes real two-session lock waits for idempotent retry, changed
fingerprint, duplicate slug, activation/save and publish/save races. Rollback
must retain Variant rows and receipts. The runner uses only a fixed local test
database and rejects nonempty/non-17 databases. CI results are recorded after
completion. Exact Production SQL approval and owner UI smoke remain separate.

## Owner approval and rollout — 2026-10-05

Owner approved the exact reviewed SQL plus bounded persistence smoke.
Both forward packages are now applied on Commerce Production; approved copies
are tracked in `supabase/migrations` using actual remote migration versions
20261005024245 and 20261005024254. Rollback/validation packages remain separate.
Postflight browser denial, RLS and service-only invoker checks pass. Application
rollout uses the combined Commerce #112 then ERP #223. No public snapshot or
reader activation is authorized by this draft-editor delivery. Owner UI testing
is the next step; no authenticated UI result is claimed by SQL-only checks.
