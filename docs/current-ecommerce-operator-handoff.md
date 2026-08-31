# Current Ecommerce operator handoff

## 2026-08-30 Customer/cart merge database rollout passed

- **Ledger:** Exact migration `20260829151610_customer_cart_merge.sql` was applied once as `20260830070209_customer_cart_merge` after transactional rollback validation passed.
- **Concurrency:** Two simultaneous merges converged on one customer/cart/line/receipt; replay and cross-subject behavior passed. A late line write that lost conversion failed safely with SQLSTATE `23514`.
- **Cleanup/postflight:** Exact fixtures were deleted and products, customers, carts, cart items, receipts and Auth sessions are zero. The one signed-out OTP-smoke Auth user was not changed. Browser roles remain denied, one hourly cleanup job is active, generated types include the RPC, and advisors added no warning/error.
- **Local integration:** The Auth route now invokes the generated-RPC adapter lazily only after OTP success, fresh `getUser()` identity confirmation and a guest cookie. A successful merge clears the cookie; any merge failure keeps the authenticated session and cookie for retry without changing the public Auth response.
- **Runtime/delivery:** No Vercel env was edited and no deployment occurred. Customer Auth, guest cart and customer-cart merge remain false, so the connected source path is still inert in Production.
- **Next gate:** `SLICE_B_DISABLED_PRODUCTION_DELIVERY_APPROVAL_REQUIRED`; push the coherent checked batch once to `master` and verify the disabled deployment. The enabled end-to-end smoke remains separately gated.

## 2026-08-28 Customer Auth Production smoke passed and rolled back

- **Source/deployment:** The bounded smoke ran on Production source `a7da2b6f9602118342d84b481c8ba30ca7ef4880`. The final disabled redeploy is `dpl_5ktST19uiu1wV8nxg9rePRrxkQ2x` in `READY` state.
- **Configuration correction:** An initial attempt stopped because an eight-digit OTP was still being generated from the incorrectly configured Supabase project. The six-digit application boundary rejected it and no session was created. The owner then set Email OTP length to six on Commerce project `bkmbhcfokobmhfzgsfzh` before the successful attempt.
- **Successful flow:** A six-digit OTP verified successfully, the Account route showed the confirmed identity, one refresh preserved the cookie-backed session, and local sign-out completed successfully.
- **Postflight:** `COMMERCE_CUSTOMER_AUTH_ENABLED=false` is redeployed; `/account` is disabled again. The Commerce project contains one signed-out Auth user, zero active sessions, zero customers, zero carts and zero cart items. No runtime error was found in the smoke window.
- **Historical continuation:** The default-off merge domain contract, migration and runbook were prepared here; their completed Production rollout is recorded in the newer checkpoint above.

## 2026-08-28 Production-only delivery policy and Auth gate

- **Repository policy:** `master` is now the only long-lived development and Production branch. Coherent changes are accumulated and fully validated locally, then pushed once. Routine feature/Preview branches are no longer required; GitHub automatic merged-head deletion is enabled for exceptional PRs.
- **Delivered baseline:** PR #43 was squash-merged as `a7da2b6f9602118342d84b481c8ba30ca7ef4880`; Vercel Production reached `READY`. `/account` returned HTTP 200 with the disabled state and the Auth API returned HTTP 404 `auth_unavailable` without setting cookies.
- **Historical baseline:** Before the smoke, Auth users, customers, carts, cart items and customer-Auth limiter rows were zero. The completed smoke evidence and current runtime state are recorded in the newer checkpoint above.
- **Branch cleanup:** The five latest merged heads were deleted and automatic cleanup is enabled. Historical merged branches do not affect deployment; removal is repository housekeeping only.

## 2026-08-26 Phase 6 customer Account foundation prepared

- **Local branch:** `/account` now has a runtime-gated email OTP + Turnstile flow, six-digit verification, fresh server user display, cookie-session refresh and local sign-out. The route is dynamic/noindex and uses the approved loading experience.
- **Isolation:** Global navigation is unchanged. Customer RLS, cart attachment, addresses, orders, payments and raffle identity remain disconnected. Production guest cart/Auth remain false or absent.
- **Configuration report:** The owner reported Supabase SMTP and Turnstile protection configured and the Turnstile public site key saved as Vercel Preview Config. No secret value was added to public runtime configuration.
- **Superseded gate:** The Preview-only runbook was superseded by the 2026-08-28 Production-only policy and production smoke runbook above.

## 2026-08-26 Phase 6 customer-Auth limiter applied

- **Production database:** The reviewed migration was applied once as `20260826105102_add_customer_auth_rate_limits` after a complete transactional rollback validation.
- **Postflight:** RLS/no-policy, grants, invoker/empty-search-path RPC, 3/10/10 thresholds, invalid-input rejection and hourly cleanup all passed. `anon` and `authenticated` cannot access the table or RPC; the service role can. All test counters rolled back to zero, business/Auth tables remain zero-row, and the guest-cart limiter/job are intact.
- **Runtime at application time:** Guest cart remained disabled in Production and customer Auth remained disabled everywhere. Supabase SMTP/Turnstile and Vercel Preview public-site-key setup were completed later by the owner as recorded above.
- **Superseded next gate:** The isolated Auth runbook and local Account UI now exist. Enabled OTP execution still requires the exact-head staging approval described above.

## 2026-08-26 Phase 6 guest-cart staging smoke passed

- **Merged checkpoint:** PR #42 merged the manual staging runner to `master` as `243ebdf`. Earlier guest-cart foundation and protection hardening remain in PR #39 and PR #40.
- **Production database:** The durable limiter migration previously passed rollback validation and was applied once as `20260815022728_add_guest_cart_rate_limits`; postflight passed with zero retained counters.
- **Runtime:** Guest cart and Auth remain disabled in Production. No Cart UI, OTP, Turnstile, PII, address, order or payment behavior is enabled.
- **Staging evidence:** Manual workflow run `Phase 6 guest-cart staging smoke #6` passed against the isolated Preview at source `4b69b2446df63bd559ffc1d6201f2bbdddc8c3bd`. The guarded enabled mode created and deleted exactly one guest cart as approved.
- **Verifier hardening:** The staging verifier now supports the official `x-vercel-protection-bypass` header through operator-only `VERCEL_AUTOMATION_BYPASS_SECRET`, reports protected previews explicitly and accepts Vercel's safe removal of the redundant `private` cache directive while still requiring `no-store` and rejecting shared-cache directives.
- **Postflight:** Commerce data returned to zero carts, zero cart items and zero Auth users. Two valid short-lived limiter rows remained for Cron expiry; there were no invalid limiter hashes and the cleanup job remained active. Production and Auth were untouched.
- **Runtime rollback:** The branch-scoped Preview value `COMMERCE_GUEST_CART_ENABLED=false` was saved and exact source `4b69b2446df63bd559ffc1d6201f2bbdddc8c3bd` redeployed successfully as Preview `dpl_AZTbwYbXWhq6LyDXjN88wHS842yX` in `READY` state.
- **Current continuation:** Guest-cart backend isolation is proven. The default-off permanent-customer Auth boundary and durable limiter are complete; isolated Turnstile/SMTP staging configuration remains the next gate. No Auth dashboard setting, customer RLS migration, PII collection or saved-address work is enabled yet.

## 2026-08-20 Phase 5 production content and media smoke

- **Status:** `PRODUCTION_CONTENT_SMOKE_PASS_MEDIA_ONBOARDING_REQUIRED`.
- **Route evidence:** Production `/shop` rendered the authoritative live-empty Commerce catalog; a filtered Shop URL rendered live-empty with canonical `/shop` and `noindex, follow`; an unknown product slug rendered the dedicated not-found state. The local Luminal logo loaded through Next Image at 3840×3840 intrinsic size.
- **Live data evidence:** A read-only production query confirmed zero products, zero published products, zero product-media rows, zero Storage buckets and zero Storage objects. Guest carts, cart items and Auth users also remain zero-row.
- **Drive decision:** No Drive upload is required to repair loading because no production product media exists yet. When catalog onboarding is approved, the owner must provide or approve product images and their ownership, product mapping, crop, primary ordering and alt text before Storage upload and product publication.

## 2026-08-14 Phase 6 Slice A production schema applied

- **Branch:** `docs/phase6-identity-architecture-decision`, based on merged `master` commit `c646d8df8edea4f3880e3171d16a7602bb818ff9`.
- **Status:** `SLICE_A_SCHEMA_APPLIED_POSTFLIGHT_PASS`; all cart/Auth runtime remains disabled.
- **Decision:** Guest carts use a server-issued opaque `HttpOnly` cookie token with only a cryptographic hash persisted. Permanent customer accounts use Supabase Auth with `@supabase/ssr`, PKCE and cookie-backed sessions. The verified Auth subject links to `customers.auth_user_id`; email text and `user_metadata` are not authorization keys.
- **Deferred option:** Supabase anonymous Auth is not used for the first guest-cart slice because it creates durable Auth users, shares the `authenticated` role with permanent users, requires explicit `is_anonymous` policy handling, anti-abuse and cleanup, and complicates existing-account cart merges.
- **Commerce boundary:** Cart is purchase intent only, not an order, payment, stock reservation or authoritative price record. Raffle guest-email identity remains independent and is never silently linked by matching email.
- **Data/live impact:** The inert guest-cart schema migration was applied only to Commerce project `bkmbhcfokobmhfzgsfzh`. No runtime, Auth setting, secret, customer record, ERP, inventory, order or payment change was made.
- **Review completed:** `specs/commerce/phase6-privacy-security-review.md` and `specs/commerce/phase6-cart-identity-schema-rls-technical-plan.md` now contain recommended privacy defaults and a three-slice guest-cart/Auth/address delivery plan. Live Supabase inspection was read-only and found the Phase 4 sensitive tables still default-deny with no customer policies or client grants.
- **Owner approval:** On 2026-08-13 the owner approved all four defaults: guest cart expires after 30 inactive days and is deleted within 7 more days; first account uses email OTP only; Cloudflare Turnstile protects Auth; saved addresses wait until guest-cart/Auth isolation passes staging.
- **Slice A production evidence:** On 2026-08-14 the exact reviewed migration was applied once after clean preflight. Supabase recorded `20260814035441_create_guest_cart_foundation`; `carts` and `cart_items` are RLS-enabled, policy-free, unavailable to `anon`/`authenticated`, zero-row and structurally complete. Products, customers and orders remain zero-row. Advisor output contains only expected informational default-deny and unused-index notices.
- **Generated contract:** `src/lib/supabase/database.types.ts` was refreshed from the post-migration production schema.
- **Server service:** Guest cart create/read/set/remove, opaque token hashing, expiry/activity refresh and published catalog reconciliation are code-complete behind default-false `COMMERCE_GUEST_CART_ENABLED`. The adapter uses only server-side `SUPABASE_SECRET_KEY`; neither value has been added to production.
- **Request boundary:** `POST /api/cart` is code-complete with exact-origin/CSRF/content-type/body-size checks, HMAC source keys, cookie-only token handling and private/no-store responses. It short-circuits while disabled.
- **Durable limiter:** Fixed limits live in a private RLS-enabled table/RPC contract, browser roles have no access, atomic upsert prevents counter races, and existing-database Cron provides bounded cleanup without another paid vendor. The migration later passed rollback validation and was applied once as `20260815022728_add_guest_cart_rate_limits`.
- **Limiter postflight:** Production inspection found the expected limiter objects, zero retained counters and no new security/performance warning or error.
- **Delivery package:** `specs/commerce/phase6-guest-cart-production-migration-runbook.md` records the passed preflight, forward operation, postflight evidence and rollback boundary.
- **Superseded next gate:** The limiter migration gate was completed on 2026-08-15. Continue with the isolated staging protection gate recorded above; keep Cart UI, Auth, email OTP, Turnstile, PII and addresses disabled/out of scope.

## 2026-08-11 Phase 5 catalog hardening, media and SEO

- **Branch:** `feat/catalog-hardening-media-seo`, based on merged `master` commit `955d4f99bbd308b9dbe82192cf19dc43ac2e5771` after PR #35 and PR #36.
- **Status:** `OPERATOR_RETEST_REQUIRED`. PR #37 merged as `c646d8df8edea4f3880e3171d16a7602bb818ff9`; GitHub `quality` run `31682479292` and the Vercel production deployment passed. This environment could not independently fetch the production routes after merge, so final content smoke remains explicit rather than inferred.
- **Scope:** Validate unknown PostgREST catalog payloads with Zod; restrict remote catalog media to HTTPS public Storage objects on the configured Commerce origin; render catalog image/video with a labeled failure fallback; add canonical/noindex metadata for Shop result URLs and stable product detail metadata; memoize duplicate detail reads.
- **Live read-only evidence:** Supabase project `bkmbhcfokobmhfzgsfzh` is `ACTIVE_HEALTHY`; all Commerce tables have RLS enabled; there are zero published products, zero associated media rows, zero active published prices and no Storage bucket. No DDL, DML, bucket, secret, ERP or raffle mutation occurred.
- **Delivery policy:** Group this entire slice into one push and one Vercel Preview attempt. Do not create no-op commits to retrigger Vercel because Commerce and ERP share the deployment quota.
- **Gate:** Local `npm run check`, diff/secret review, exact-head GitHub `quality`, Vercel Preview `READY`, merge, then production smoke for `/shop`, a filtered `/shop` URL and an unknown product slug.
- **Known limitation:** Real catalog media cannot be visually smoke-tested until the operator creates an approved public media bucket and publishes a catalog record in a separately authorized content operation. The current successful empty catalog must remain empty rather than silently using fixtures.
- **Remaining gate:** Complete the three-route production content smoke to close Phase 5. The Phase 6 identity ADR now exists; its next action is privacy/security review and schema/RLS planning, while cart/auth/customer-data implementation remains out of scope.
- **Security checkpoint (2026-08-12):** Next.js and its matching ESLint config were updated from `16.2.1` to `16.3.0`; the `shadcn` CLI moved out of production dependencies. `npm audit --omit=dev` now reports zero vulnerabilities. A tracked static secret/public-env/code-execution/outbound-host gate and a production dependency audit are part of `npm run check` and must pass before the grouped release train is pushed.

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
