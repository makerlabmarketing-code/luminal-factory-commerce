# Commerce Admin Homepage Hero route slice

Status: application code prepared on `master`; Production integration runtime remains default-off. The new idempotency migration is repository-only and must not be applied to Production without a separate database approval gate.

## Implemented application boundary

The Commerce-owned route family now matches the ERP `2026-09-11` contract:

- `GET /api/admin/v1/homepage-hero` -> `commerce.hero.read`
- `POST /api/admin/v1/homepage-hero` -> `commerce.hero.write`
- `PATCH /api/admin/v1/homepage-hero/:id` -> `commerce.hero.write`
- `POST /api/admin/v1/homepage-hero/:id/publish` -> `commerce.hero.publish`
- `POST /api/admin/v1/homepage-hero/:id/unpublish` -> `commerce.hero.publish`

Every route is server-only, dynamic/no-store, bounded to 256 KB, verifies `lfc-hmac-v1` against the exact raw body before JSON parsing, uses the durable replay RPC, and returns the request id plus contract version expected by ERP.

Credential lookup accepts only the configured Commerce client/audience and the current or optional previous HMAC key. Removing a key from server configuration revokes it without a browser change. No secret is committed or exposed through `NEXT_PUBLIC_*`.

## Hero orchestration

List reads the Commerce-owned `homepage_hero_presentations` table through the privileged server boundary.

Mutations call a single Commerce-owned RPC, `public.manage_homepage_hero(...)`. The RPC keeps one database transaction around idempotency claim plus mutation/result receipt. Publish and unpublish delegate to the existing `publish_homepage_hero` / `unpublish_homepage_hero` RPCs so the existing one-active-Hero rule and Storage asset guard remain authoritative.

Draft update is intentionally limited to inactive rows. A published Hero must not be silently edited as a draft.

## Idempotency gap closed in code, not yet Production

ERP already sends `operationId`. The prepared migration stores a private receipt keyed by `(client_id, operation_id)` and binds it to a SHA-256 fingerprint of method + path + signed body hash. A retry of the same operation returns the stored result; reuse for another request fails closed. The claim and Hero mutation are in the same PostgreSQL transaction, so a failed mutation rolls back the claim rather than leaving a false success receipt.

Migration file:

`supabase/migrations/20260912150000_add_commerce_admin_hero_idempotency.sql`

This migration has **not** been approved or applied to Production by this slice.

## Still disabled

- `COMMERCE_ADMIN_INTEGRATION_ENABLED` remains `false` by default.
- No real HMAC Production credential is configured by repository code.
- No ERP -> Commerce Production request has been sent.
- No Homepage Hero Production row or Storage object is changed by this slice.
- Asset upload/import route is still out of scope.

## Remaining gates

1. Run repository quality gate and fix any static/type/build failures.
2. Review/rollback-validate the idempotency migration.
3. Receive separate approval before applying that migration to Commerce Production.
4. Provision environment-specific current/previous HMAC credentials without enabling runtime.
5. Run non-destructive tamper, replay, rotation and idempotency validation with test-only credentials.
6. Add/review the derived Hero asset upload boundary before ERP upload UI depends on it.
7. Receive separate approval before enabling Production integration runtime.
