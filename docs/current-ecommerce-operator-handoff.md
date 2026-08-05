# Current Ecommerce operator handoff

- **Baseline commit at slice start:** `e1cf50c02600ec8999f4a3378c08e359ccb4aac3` on local branch `work`. Remote/default-main identity was unavailable.
- **Deployment status:** Unknown; no Vercel project metadata or authenticated remote is present. This PR must not be described as deployed.
- **Completed slice:** Phase 0–2 code complete: repository foundation, storefront UI primitives, homepage skeleton. Current documentation slice drafts the formal raffle-first Home specification only.
- **Blockers:** Approval of the draft raffle-first Home experience script, approval of `specs/home/home-page-specification.md`, approved brand imagery/logo, approved hero mode/content/assets, canonical raffle time zone, canonical production origin confirmation, remote/PR/check/deployment visibility, and manual browser/a11y review.
- **Deferred duplicates:** Deprecated GitHub clone skill, inspection guide, comparison image, and empty placeholder directories; see audit.
- **Environment:** `NEXT_PUBLIC_APP_BASE_URL` is optional for local builds and required for an absolute production canonical. Supabase variables are not required by current source. `VERCEL_ENV` is platform-provided for robots behavior.
- **Operator-only actions:** Configure/verify canonical origin; inspect CI; approve and trigger deployment; verify production; authorize any future secrets, SQL/migration, payment, or live mutation.
- **Exact next approved Codex slice:** Review and approve the raffle-first Home Page Experience Script draft in `docs/page-scripts/home-raffle-first-experience-script-draft.md` and the formal Home Page Specification in `specs/home/home-page-specification.md`. After approval, the first implementation slice is Global visual foundation + Home raffle discovery hero shell.
- **Production verification:** After deployment, request `/`, verify HTTP 200 and metadata, keyboard-test desktop/mobile navigation, crawl every internal link, test 390/768/1440px layouts, and confirm preview robots are noindex while production is indexable.
- **Known warnings:** No approved media; abstract CSS studies are intentional. Social/contact links are omitted. Privacy/Terms are plain labels. Sitemap is deferred until stable routes exist. System font rendering may vary slightly by platform.
- **Forbidden live actions:** Production SQL/migrations, secret edits, payment operations, order/inventory/customer mutations, raffle or commission mutations, and ERP changes without explicit operator approval and an applicable forward/validation/rollback package.


## 2026-08-05 formal Home specification handoff

- **Branch:** `docs/home-raffle-first-spec`.
- **Commit:** This documentation commit; exact SHA is reported in the completion report because embedding the final SHA would change the commit hash.
- **Documents created:** `specs/home/home-page-specification.md`.
- **Documents updated:** `docs/ECOMMERCE_IMPLEMENTATION_ROADMAP.md`, `docs/current-ecommerce-operator-handoff.md`.
- **Validation:** Passed before commit: `git diff --check`, `npm run check`, referenced-path check, approval/status review, ERP-boundary review.
- **Specification status:** `DRAFT` / `REVIEW_REQUIRED` because the source experience script is still `DRAFT_FOR_REVIEW`.
- **Home implementation status:** `BLOCKED` until the experience script, formal specification, hero mode, CTA, assets, time zone, and data boundaries are approved.
- **Next approved slice after approval:** Global visual foundation + Home raffle discovery hero shell.
- **Approval questions:** Hero mode, navigation order, primary CTA, account/cart visibility, first-hero 3D need, production assets, raffle time zone, no-active-raffle fallback, archive source, and Home-level prominence of Shop/Commission.


## 2026-08-05 owner-approved Home hero first slice

- **Approval recorded:** The raffle-first Home experience script and formal Home specification are approved only for the first implementation slice.
- **Implementation scope:** Global visual foundation + Home raffle discovery hero shell.
- **Approved decisions:** Non-transactional release placeholder; navigation order Raffle, Archive, Shop, Commission, About; CTA “Khám phá bản phát hành” anchors to Home release/raffle information; account/cart hidden; no 3D; presentation time zone Asia/Ho_Chi_Minh; no-active-raffle fallback copy “Đợt raffle tiếp theo đang được chuẩn bị”; curated static archive preview boundary for future server data; Shop/Commission are secondary and marked “Sắp mở” when unavailable; light sticky header; internal placeholder media clearly labeled.
- **Still blocked:** Real raffle entry, payment, order, cart, account/authentication, production raffle schema/enum, Supabase queries, production media approval, full Archive/Shop/Commission pages, ERP workflows, live data mutation, deployment verification, and manual browser/a11y review.


## 2026-08-05 Home Archive Preview + Archive route foundation

- **Branch:** `feat/home-archive-preview-foundation`.
- **Technical plan:** `specs/archive/archive-preview-foundation-technical-plan.md`.
- **Implementation scope:** Home Archive Preview section after raffle-first release information, `/archive` route foundation, curated static presentation data, typed presentation boundary, and real Archive navigation href.
- **Data status:** Curated placeholder presentation data only; not production product, inventory, raffle, order, customer, CMS, or Supabase data.
- **Still blocked:** Full Archive system, production archive content approval, Archive detail pages, search/filter/pagination, Supabase-backed archive collection, Shop and Commission routes, raffle transaction, payment, order, cart, account/authentication, ERP workflows, deployment verification, and manual browser/a11y review.
- **Operator-only actions:** Approve production archive content/media, configure any future server data source, inspect CI/PR checks, approve deployment, and perform production smoke/browser review.
- **Next suggested slice:** A bounded Shop or Commission discovery shell may follow only after owner approval; do not continue automatically.
