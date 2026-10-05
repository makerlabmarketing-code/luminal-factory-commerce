# Catalog image drafts — 2026-10-05

Owner scope: manual English entry; select/drop multiple photos, cover, ordering,
Product/Colorway association, recoverable removal, gallery and ERP corner toasts.
No AI integration. Existing EN/VI drafts remain intact in an optional editor.

## Contract and behavior

ERP authenticates staff and checks COMMERCE_PRODUCT_VIEW/MANAGE. Only its signed
server transport reaches Commerce management routes. Commerce owns every file
and draft. Read/write scopes, request signatures and audit remain the existing
commerce.product boundaries. No ERP permissions or credentials are changed.

Only draft Products and inactive Colorways accept uploads/edits. Each target has
one revisioned manifest, at most 20 active photos and 120 retained photos total.
Gỡ ảnh is soft removal inside the manifest; Khôi phục reverses it. No Storage
delete endpoint exists. Browser view receives five-minute signed preview URLs;
upload tickets expire in two hours, have no upsert, and bind one immutable path.

JPEG/PNG/WebP input is limited to 20 MiB. Browser canvas resizes to at most 2048 px,
encodes static WebP and strips source metadata; optimized uploads must be <=2 MiB.
Commerce downloads the object, checks byte size, format/dimensions/frame count
and successfully decodes bounded pixels before the transactional append RPC.
Sequential upload queue exposes each file's state and retry. Known append payloads
keep operation IDs on uncertain responses. Cover/order/alt/soft-removal use a
revision and immutable operation receipt; failed writes preserve editing input.

The private draft manifest never changes public product_media. Public gallery
reads existing published product_media, permits local paths or same-origin public
Storage URLs, and includes variant images only when the public variant relation
confirms the matching active variant. Thumbnails and variant selection are keyboard
accessible; main media errors use the existing fallback.

## Data and approval boundary

Current Production: product_media exists with one published record; no draft
media table/bucket exists. Storage objects have no browser policies. Parent FK
index catalog_translation_variant_parent_idx exists from the approved E-006 SQL.

Proposed reviewed forward package is supabase/drafts/catalog-media/forward.sql:

- new public.catalog_media_drafts: private RLS-enabled service-only manifests;
- new private.catalog_media_receipts: private RLS-enabled immutable replay results;
- new private Storage bucket catalog-media-drafts (WebP, 2 MiB/object);
- two service-only SECURITY INVOKER RPCs with empty search_path;
- Product FK and composite Product/Colorway FK, no existing column changes;
- no browser grants/policies, no public bucket, no existing data backfill.

No new production SQL is authorized by approval of earlier E-005/E-006 packages.
Keep this package outside supabase/migrations until this exact SQL is approved.
Application code can merge/deploy with ERP COMMERCE_CATALOG_MEDIA_ENABLED absent
or false. This flag is server-only and defaults off. Enable only after forward
SQL + validation succeed and authenticated private-upload smoke is authorized.
Public publication of these new drafts is a separate release: this slice contains
no media-publish operation and no copy to a public bucket.

Rollback: disable the ERP flag and run rollback.sql, which revokes draft table/RPC
access while retaining manifests, receipts and all files. Already issued signed
upload tickets may still write private unattached objects until their 2h expiry.
Public product_media remains unchanged. Restoring application code is a normal
protected-branch revert; no data needs to be discarded.

## Verification and acceptance

Run npm run check; focused executable contract, denial-before-service, byte decode,
published guard and public gallery tests; offline PGlite SQL validation; native
PostgreSQL17 CI with two real sessions for replay, stale writes, operation conflicts,
activation/publish races and role denial. Rollback is checked to preserve rows.

Production upload acceptance remains pending exact SQL approval and bounded smoke.
Toast/English entry and public gallery can be verified independently after deploy.
