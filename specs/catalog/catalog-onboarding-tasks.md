# Catalog Onboarding Tasks

Status: `CONTENT_MATRIX_PROPOSED_LIVE_APPROVAL_REQUIRED`

- [x] CO001 Confirm the live catalog and Storage baseline read-only.
- [x] CO002 Map product, variant, price and media fields to the deployed schema.
- [x] CO003 Trace Shop and Cart adapter requirements for a complete line.
- [x] CO004 Define least-privilege publication and exact rollback boundaries.
- [x] CO005 Prepare `CATALOG-PROD-ONBOARDING-01` runbook and static checks.
- [ ] CO006 Obtain owner confirmation of the now-complete proposed content
  matrix. Name, slug, product type, variant, SKU and `$70.00 USD` were
  previously approved; exact description, selected media/alt and immediate
  publication are now explicitly proposed.
- [x] CO007 Confirm the selected media is already deployed. Production
  `/images/home/archive-meowhe.webp` returned HTTP 200 as `image/webp` on
  2026-09-24; no source delivery or Storage upload is required.
- [ ] CO008 Obtain `CATALOG-PROD-ONBOARDING-01`.
- [ ] CO009 Re-run read-only preflight, execute the exact transaction once and
  record its four IDs privately.
- [ ] CO010 Validate public RLS reads, Shop rendering and disabled runtime.
- [ ] CO011 Run aggregate database/advisor/Vercel postflight.
- [ ] CO012 Obtain and execute `CART-INTEGRATED-SMOKE-01` separately.
