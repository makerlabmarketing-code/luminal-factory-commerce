# Current Ecommerce operator handoff

## 2026-08-11 Phase 5 catalog hardening, media and SEO

- **Branch:** `feat/catalog-hardening-media-seo`, based on merged `master` commit `955d4f99bbd308b9dbe82192cf19dc43ac2e5771` after PR #35 and PR #36.
- **Status:** `CODE_COMPLETE_PENDING_CI_PREVIEW`.
- **Scope:** Validate unknown PostgREST catalog payloads with Zod; restrict remote catalog media to HTTPS public Storage objects on the configured Commerce origin; render catalog image/video with a labeled failure fallback; add canonical/noindex metadata for Shop result URLs and stable product detail metadata; memoize duplicate detail reads.
- **Live read-only evidence:** Supabase project `bkmbhcfokobmhfzgsfzh` is `ACTIVE_HEALTHY`; all Commerce tables have RLS enabled; there are zero published products, zero associated media rows, zero active published prices and no Storage bucket. No DDL, DML, bucket, secret, ERP or raffle mutation occurred.
- **Delivery policy:** Group this entire slice into one push and one Vercel Preview attempt. Do not create no-op commits to retrigger Vercel because Commerce and ERP share the deployment quota.
- **Gate:** Local `npm run check`, diff/secret review, exact-head GitHub `quality`, Vercel Preview `READY`, merge, then production smoke for `/shop`, a filtered `/shop` URL and an unknown product slug.
- **Known limitation:** Real catalog media cannot be visually smoke-tested until the operator creates an approved public media bucket and publishes a catalog record in a separately authorized content operation. The current successful empty catalog must remain empty rather than silently using fixtures.
- **Exact next slice after delivery:** Close Phase 5 with production smoke evidence, then create the Phase 6 identity architecture decision record. Cart/auth/customer data changes remain out of scope until that review.

## 2026-08-06 approved Luminal logo integration

- **Status:** `SOURCE_VALIDATED_BROWSER_REVIEW_REQUIRED`. The approved local PNG at `public/brand/luminal-factory-logo-primary.png` was validated and integrated into the existing Header and Footer; navigation and account/cart boundaries are unchanged.
- **Decisions:** Existing favicon retained because the detailed full mark was not approved as a clear 16–48 px icon. No Open Graph artwork was created.
- **Scope boundary:** Legacy recovery remains separate and partial/blocked. Home, Archive, and Shop product media were not replaced. No Supabase, database, cart, payment, order, dependency, or transaction-flow change.
- **Gate:** Automated checks may pass independently, but browser review at 1440/390 px, top/scrolled Header, mobile menu, keyboard focus, logo clarity, layout stability, and Footer balance remains required; do not claim UI/UX PASS before that review.


## 2026-08-06 Luminal brand and legacy recovery slice (historical; logo blocker superseded)

- **Branch:** `feat/brand-assets-and-legacy-recovery` created from the clean available `work` baseline at `f55a711`; this environment has no configured remote or local `master`, so fetch/pull and verification against remote master are blocked and must be reported rather than inferred.
- **Technical plan:** `specs/assets/brand-and-legacy-asset-recovery-technical-plan.md`.
- **Status:** `PARTIALLY_COMPLETE_OWNER_BINARY_UPLOAD_REQUIRED`.
- **Result:** The exact Luminal logo is owner-confirmed, but all logo binaries are excluded because the Codex PR UI blocks binary diffs. Header/Footer use the accessible `Luminal Factory` text fallback and make no missing-image request. Visual logo integration is not complete. Navigation, mobile behavior, metadata, favicon, and product placeholders remain unchanged. The legacy Hostinger crawl remains blocked.
- **Approval boundary:** Historical product images/videos remain non-production and must not replace Home, Archive, or Shop placeholders in this slice. Public availability is not evidence of production reuse rights.
- **Data/security impact:** No Supabase, ERP, commerce transaction, secret, credential, or remote mutation. Drive and the legacy site are development-time evidence sources only, never runtime hosts.
- **Next gate:** Owner must review shortlist subjects, ownership/license, historical-brand treatment, crops, destination, and alt text before a separate bounded production-media replacement slice.
- **Immediate gate (superseded):** The approved binary now exists at `public/brand/luminal-factory-logo-primary.png` and Header/Footer use its local runtime path. The desktop/mobile browser matrix and screenshots remain outstanding. Separately re-run historical recovery from an authorized environment if that inventory is still desired.

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


## 2026-08-05 Home Shop Discovery Preview + Shop route foundation

- **Branch:** `feat/shop-discovery-foundation`.
- **Technical plan:** `specs/shop/shop-discovery-foundation-technical-plan.md`.
- **Implementation scope:** Home Shop Discovery Preview after Archive, `/shop` route foundation, curated static presentation data, typed presentation boundary, empty-state capability, and real Shop navigation href.
- **Data status:** Curated placeholder presentation data only; not production product, price, inventory, cart, checkout, payment, order, customer, CMS, or Supabase data.
- **Still blocked:** Full Shop/catalog system, production product/content/media approval, product detail pages, search/filter/sorting/pagination, Supabase-backed catalog, cart, checkout, payment, order, account/authentication, ERP workflows, deployment verification, and manual browser/a11y review.
- **Operator-only actions:** Approve production shop content/media, configure any future server data source, inspect CI/PR checks, approve deployment, and perform production smoke/browser review.
- **Next suggested slice:** Commission discovery/page foundation may follow only after owner approval; do not continue automatically.


## 2026-08-05 Future LazyFactory asset handoff preparation

- **Owner-provided source pending:** A future Google Drive folder may contain images and videos from older LazyFactory projects, but this slice does not wait for it, download it, hard-code its URL, or treat Google Drive as a production CDN.
- **Current implementation boundary:** Home, Archive, and Shop presentation content continues to use clearly labeled internal placeholder media only. No logo, brand name, current copy, product claim, price, stock, or commerce status has been changed to LazyFactory.
- **Presentation model readiness:** Storefront media records can distinguish image/video type, source path, alt text, dimensions, aspect ratio, poster, credit/source note, LazyFactory historical archive status, production approval status, focal/object positioning, and placeholder fallback.
- **Asset classifications:** Future records must explicitly distinguish `lazyfactory-historical-archive`, `luminal-current-brand`, and `internal-placeholder` sources, and must keep `productionApproved` false until rights, brand, crop, alt text, optimization, and production usage review are complete.
- **Future migration slice:** When assets arrive, run a separate approved slice for inventory, usage-rights and branding review, Home/Archive/Shop/Process/social metadata classification, production image/video selection, size/format optimization, video poster creation, alt-text completion, placeholder replacement, and performance/responsive crop validation.
- **Still forbidden without approval:** External downloads, Google Drive URLs in source, Google Drive as production CDN, production-media claims, LazyFactory rebranding of current Luminal content, live data mutation, payments, orders, inventory, raffles, commissions, or ERP workflows.
