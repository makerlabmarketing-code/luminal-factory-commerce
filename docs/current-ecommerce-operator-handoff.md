# Current Ecommerce operator handoff

- **Baseline commit at slice start:** `e1cf50c02600ec8999f4a3378c08e359ccb4aac3` on local branch `work`. Remote/default-main identity was unavailable.
- **Deployment status:** Unknown; no Vercel project metadata or authenticated remote is present. This PR must not be described as deployed.
- **Completed slice:** Phase 0–2 code complete: repository foundation, storefront UI primitives, homepage skeleton.
- **Blockers:** Approved brand imagery/logo, canonical production origin confirmation, remote/PR/check/deployment visibility, and manual browser/a11y review.
- **Deferred duplicates:** Deprecated GitHub clone skill, inspection guide, comparison image, and empty placeholder directories; see audit.
- **Environment:** `NEXT_PUBLIC_APP_BASE_URL` is optional for local builds and required for an absolute production canonical. Supabase variables are not required by current source. `VERCEL_ENV` is platform-provided for robots behavior.
- **Operator-only actions:** Configure/verify canonical origin; inspect CI; approve and trigger deployment; verify production; authorize any future secrets, SQL/migration, payment, or live mutation.
- **Exact next approved Codex slice:** “Implement Phase 3 Shop, Gallery, Raffle, Commission, About, Contact, Cart, and Account static route shells from approved page scripts, reusing the Phase 1 primitives; add no backend, schema, real product data, authentication, checkout, or ERP integration.”
- **Production verification:** After deployment, request `/`, verify HTTP 200 and metadata, keyboard-test desktop/mobile navigation, crawl every internal link, test 390/768/1440px layouts, and confirm preview robots are noindex while production is indexable.
- **Known warnings:** No approved media; abstract CSS studies are intentional. Social/contact links are omitted. Privacy/Terms are plain labels. Sitemap is deferred until stable routes exist. System font rendering may vary slightly by platform.
- **Forbidden live actions:** Production SQL/migrations, secret edits, payment operations, order/inventory/customer mutations, raffle or commission mutations, and ERP changes without explicit operator approval and an applicable forward/validation/rollback package.
