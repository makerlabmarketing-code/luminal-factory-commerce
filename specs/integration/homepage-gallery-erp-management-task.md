# Homepage gallery media management — ERP task

Status: `NOT_STARTED`  
Target phase: Phase 8 — ERP integration  
Runtime impact today: none

## Outcome

Give authorized studio operators an ERP screen to upload, order, caption, preview, publish and unpublish Homepage gallery images without editing the Commerce repository.

ERP is the operational UI. Commerce remains the authority for gallery records, image derivatives, Storage objects, validation and publication state. Google Drive may be an import source only; published pages must never use Drive URLs at runtime.

## Required Commerce boundary

Extend the existing signed ERP → Commerce Admin API rather than connecting the ERP browser to Commerce Supabase:

- `commerce.gallery.read`
- `commerce.gallery.write`
- `commerce.gallery.publish`
- `GET /api/admin/v1/homepage-gallery`
- `POST /api/admin/v1/homepage-gallery/assets`
- `POST /api/admin/v1/homepage-gallery`
- `PATCH /api/admin/v1/homepage-gallery/:id`
- `POST /api/admin/v1/homepage-gallery/:id/publish`
- `POST /api/admin/v1/homepage-gallery/:id/unpublish`

All mutating requests must use the existing `lfc-hmac-v1` envelope, durable replay protection, operation idempotency, strict request-size limits, Zod validation, no-store responses and audit records. No service-role or HMAC secret may reach ERP browser code.

## Media contract

Each gallery item needs:

- stable id and Commerce-owned asset path;
- descriptive alt text;
- colorway label;
- crop/frame preset and focal point;
- sort order;
- draft/published state;
- original dimensions, MIME type, checksum and upload provenance;
- created/updated/published actor and timestamps.

Commerce must validate actual file signatures, reject unsupported formats, normalize orientation, generate bounded WebP/AVIF derivatives, strip unsafe metadata and confirm Storage existence before publish.

## ERP screen

- drag-and-drop upload plus optional Drive import;
- colorway grouping and multi-item reordering;
- focal-point/crop preview at desktop, tablet and mobile ratios;
- required alt text before publish;
- draft preview and explicit publish/unpublish controls;
- per-action success/failure state with retry-safe request ids;
- audit history showing actor, change and publication result.

## Acceptance gates

1. Direct ERP-to-Commerce database writes are impossible.
2. Drive is never emitted as a public image host.
3. Unsupported, oversized, malformed and spoofed files fail closed.
4. Replayed uploads/publishes cannot duplicate records or state transitions.
5. Publish is atomic and preserves the previous live gallery on failure.
6. Storefront renders an approved gallery snapshot with responsive derivatives and reduced-motion behavior.
7. Staging contract, authorization, replay, rollback and accessibility tests pass before Production enablement.
8. Production activation receives explicit operator approval.
