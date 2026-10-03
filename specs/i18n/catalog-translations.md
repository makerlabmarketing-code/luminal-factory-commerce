# E-006: catalog translation drafts

Coordination Sheet E-006 is the execution source. Owner authorized preparation of
the EN/VI editor and SQL package, not live SQL or new runtime activation.

## Boundary

One Product/Colorway UUID, slug, price, inventory and release state remain shared.
Commerce owns persistence; ERP authenticates staff and calls its existing signed
Management transport. No ERP copy of the catalog or browser Commerce credentials.

Content fields are title (160), description (5000), story (8000), seoTitle (180),
seoDescription (500) and primaryMediaAlt (500), plain text. Empty optional fields
are null. Drafts may be incomplete. `ready` requires title and description; this
means ready for review, never published. Existing source fields remain fallback.

Product/Colorway drafts are identified by Product ID, optional Variant ID and en/vi.
Variant parent membership is enforced in SQL. Archived parents cannot be edited.
Draft translation editing is allowed for published parents because it changes
neither source records nor approved snapshots. No publish endpoint is delivered.

## API and consistency

GET/PATCH `/api/admin/v1/products/{id}/translations/{locale}`; equivalent nested
`colorways/{variantId}/translations/{locale}`. Read/write use existing product
scopes; ERP maps its existing view/manage capabilities. Authorization precedes
parsing. Signed identity and audited actor remain owned by existing transport.

Read returns a draft or null. PATCH includes operationId, expectedRevision (zero
for absent) and draft. SQL serializes by Product then entity+locale and receipt,
checks expected revision, retains immutable idempotency receipts, and increments
revision. Exact retry replays only the matching fingerprint. Stale writes are 409.
ERP preserves failed input/operation ID and confirms target/locale/revision/content
in responses; stale reads abort and unsaved changes warn before switching/leaving.

## Data/package

`catalog_translation_drafts`: RLS, no browser grants; invoker RPCs service-only.
`catalog_translation_public`: distinct reviewed snapshots, public SELECT only when
parent is published and optional variant is active. No draft content in that table.
Composite Variant/Product FK uses an additive unique index on variants(product_id,id).
No source columns are changed. No backfill. Snapshot publication/withdrawal needs
a separate reviewed release operation; ready alone never copies content publicly.

Storefront public reader is default-off (`COMMERCE_CATALOG_TRANSLATIONS_ENABLED`),
only reads approved snapshots with the publishable key. Missing/invalid/unavailable
translations fall back to source without hiding Products. Preferred locale then
approved English then source, per field. Locale is included in memoization keys.
Search remains on source name/description; translated search is a later contract.

Forward/preflight/validation/rollback SQL stay under `supabase/drafts/translations`.
Rollback revokes execution and public reads, preserving translation rows/receipts;
no destructive table removal. ERP Product editor is independent of E-005; nested
Colorway API is prepared, but Colorway editor wiring waits for E-005 rollout.

## Delivery gate and verification

Draft PRs, not Production deployment. Exact SQL review, native two-session stale
write/replay verification, hosted RLS preflight, controlled create/reload/edit and
rollback smoke are required before SQL rollout; then Commerce before ERP.
Runtime enablement and public snapshot publication remain separate approvals.
Unit tests cover parser boundaries, signed scopes, denied routes, response target
validation, fallback isolation and private drafts. Isolated SQL runner exercises
real invoker grants, stale/replay/conflict, FK ownership and data-preserving rollback.
Run full checks/build in both repositories. Owner supplies actual product copy;
no new design/assets are needed for the foundation.

Run isolated SQL: `PGLITE_MODULE=/absolute/path/to/pglite/dist/index.js node scripts/verify-translation-sql-local.mjs`.
PGlite 0.5.8 is a temporary QA tool; no repository dependency was added. The runner
has no network/client URL and closes its local database. No `supabase/migrations`
entry exists. Rollback preserves additive FKs/indexes; full schema removal requires
a separately reviewed export/data-loss decision.

## Validation evidence (2026-10-03)

- ERP: 119 files / 888 tests, lint, TypeScript and production build PASS. Local
  build used explicitly fake public Supabase settings; no auth/live E2E claim.
- Commerce: 353 tests, lint (two existing warnings), TypeScript, static security,
  production audit 0 vulnerabilities and production build PASS.
- PGlite 0.5.8: real invoker create/read/replay/stale/conflict/readiness, parent FK,
  public RLS/column grants, source preservation and data-preserving rollback PASS.
- Built runtime with local mock catalog: EN/VI/EN Product/listing/title/story/SEO,
  shared slug/price and translation-service failure fallback PASS.
- Hosted preflight, native two-session concurrency and authenticated owner editor
  smoke remain unperformed. No Production SQL/runtime/secrets/data changed.
