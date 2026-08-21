# Ecommerce implementation roadmap

This is the authoritative task roadmap. Status vocabulary: `NOT_STARTED`, `IN_PROGRESS`, `CODE_COMPLETE`, `MERGED`, `DEPLOYED`, `OPERATOR_RETEST_REQUIRED`, `LIVE_APPROVAL_REQUIRED`, `BLOCKED`, `COMPLETED`. A code change in a PR is `CODE_COMPLETE`; it is not `MERGED` or `DEPLOYED` without external evidence.

Every phase uses the same contract fields below.

## Phase 0 — Repository foundation — `CODE_COMPLETE`

- **Objective:** Establish identity, duplicate/instruction/skill audits, quality gates, deployment/version evidence, roadmap, and handoff.
- **Scope:** Repository inventory, environment contract, root Codex guide, automated governance tests, documentation.
- **Non-goals:** Deleting uncertain artifacts; changing live systems.
- **Dependencies:** Repository history and operator confirmation of remote/deployment state.
- **Data/schema impact:** None.
- **Security impact:** Public/server environment boundaries documented; no secrets accessed.
- **Validation:** `npm run check`, secret-pattern scan, duplicate hash/import/route review.
- **Production gate:** Merge checks, operator deployment verification.
- **Completion evidence:** `docs/REPOSITORY_AUDIT.md`, root guide, `.env.example`, tests, and successful checks.
- **Next approved slice:** Phase 3 static route shells and navigation information architecture.

## Phase 1 — Storefront design foundation — `CODE_COMPLETE`

- **Objective:** Establish tokens, typography, spacing, container, controls, cards, media, states, header/footer, and mobile navigation.
- **Scope:** Reusable presentation primitives and responsive CSS.
- **Non-goals:** Final brand system, heavy motion, WebGL, commerce logic.
- **Dependencies:** Current visual direction; final brand assets remain pending.
- **Data/schema impact:** None.
- **Security impact:** No data access.
- **Validation:** Lint, typecheck, tests, production build, keyboard/reduced-motion review.
- **Production gate:** Visual review at desktop/mobile and WCAG AA follow-up.
- **Completion evidence:** `src/components`, centralized `globals.css`, successful build.
- **Next approved slice:** Static route shells using these foundations.

## Phase 2 — Homepage skeleton — `CODE_COMPLETE`

- **Objective:** Deliver hero, brand introduction, featured fixtures, limited-release placeholder, commission/process, gallery, contact placeholder, and footer.
- **Scope:** Vietnamese-first static presentation with typed fixtures and safe in-page links.
- **Non-goals:** Real catalog, stock, prices, countdowns, forms, raffle/commission backend.
- **Dependencies:** User-approved foundation brief; approved brand media remains unavailable.
- **Data/schema impact:** Presentation-only typed content, explicitly not commerce entities.
- **Security impact:** None.
- **Validation:** Render/build, landmark/headings/link/fixture/mobile navigation tests, visual and accessibility review.
- **Production gate:** Homepage design review and operator deployment smoke test.
- **Completion evidence:** Root route implementation and test suite.
- **Next approved slice:** Phase 3 route shells.

## Phase 3 — Static storefront routes — `COMPLETED`

- **Objective:** Define the public storefront route architecture without implying unavailable commerce/auth capabilities.
- **Scope:** Home, Raffle discovery, Archive index/detail, Shop index/detail, Commission discovery/inquiry, About, metadata, navigation and presentation states.
- **Resolved route architecture:** Gallery is fulfilled by Archive; Contact is fulfilled by Commission inquiry; Cart and Account are intentionally deferred to Phase 6.
- **Non-goals:** Persistence, transactional raffle participation, functional catalog/cart/checkout/payment/order/auth.
- **Dependencies:** Phase 1 foundations and approved page contracts.
- **Data/schema impact:** Static fixtures only; no Phase 3 Supabase/ERP schema change.
- **Security impact:** No customer auth or privileged data access introduced.
- **Validation:** GitHub quality gates passed for merged slices. Vercel production deployment for `master` commit `3627c4397b623651a1e238f5bce043544e3b60fb` reached `READY`, and production `/about` returned HTTP 200 with the dedicated About route, `/about` navigation links and the approved brand line `Shaped by light. Crafted to last.`.
- **Production gate:** Cleared on 2026-08-10 after Vercel build capacity returned.
- **Completion evidence:** Shop and Archive detail routes, Commission inquiry boundary, dedicated About route, approved brand line, and `specs/storefront/phase3-route-completion-audit.md`.
- **Historical marker:** Current slice: Luminal Brand Asset Integration + Legacy LazyFactory Asset Recovery Inventory. This historical slice remains bounded; media migration was not silently completed.
- **Current state:** Phase 3 route architecture, code and production verification are complete.
- **Next approved slice:** Phase 4 commerce data model and Supabase boundary.

## Phase 4 — Commerce data model — `COMPLETED`

- **Objective:** Establish a dedicated, versioned Commerce persistence boundary for catalog, customers, orders, payments and future ERP financial synchronization.
- **Scope:** Dedicated Commerce Supabase project, versioned migrations, RLS/grants, generated database types, payment-state projection and idempotent commerce event outbox.
- **Safety boundary:** Raffle remains static/editorial only and has no Commerce database table, participation, winner, draw, randomization or raffle-payment persistence.
- **Persistence boundary:** Commerce project `bkmbhcfokobmhfzgsfzh` (`Luminal Factory Commerce`, `ap-northeast-1`) is separate from ERP project `kwfmfmpgpbfewpiizesv`.
- **Implemented schema:** `products`, `product_variants`, `product_media`, `product_prices`, `inventory_items`, `customers`, `orders`, `order_items`, `payments`, `refunds`, `commerce_events`, plus `order_payment_summary`.
- **Money/payment contract:** Monetary values use integer minor units. Successful `payments` plus successful `refunds` are authoritative; order payment status is derived rather than stored as a second editable source of truth.
- **ERP preparation:** `commerce_events` carries idempotent ordinary-commerce events (`order_paid`, `payment_refunded`, `order_cancelled`) for a later Phase 8 financial projection; no ERP mutation occurs in Phase 4.
- **Security impact:** RLS is enabled for every new table. Only published catalog data has anon/authenticated select policies. Inventory, customer, order, payment, refund and event tables remain default-deny to public/client roles.
- **Validation:** Migrations `20260810045019_create_commerce_core` and `20260810045219_add_commerce_fk_indexes` applied successfully; schema/RLS inspected; generated TypeScript types committed; security and performance advisors reviewed. FK index findings were remediated; remaining unused-index notices are expected on a new zero-traffic database.
- **Production gate:** PR #32 passed GitHub `quality`, exact-head Vercel Preview reached `READY`, and production deployment for merge commit `12c0f538513b0a7d8baffaf0ea4664568f8619a8` reached `READY` on 2026-08-10.
- **Completion evidence:** `supabase/migrations`, `src/lib/supabase/database.types.ts`, `specs/commerce/phase4-commerce-core-schema-technical-plan.md`, PR #32 and live Commerce Supabase verification.
- **Current state:** Phase 4 is complete; ERP remains untouched.
- **Next approved slice:** Phase 5 read-only catalog adapter.

## Phase 5 — Catalog integration — `OPERATOR_RETEST_REQUIRED`

- **Objective:** Replace Shop presentation fixtures with safe server-side reads from the published Commerce catalog while preserving truthful empty/fallback behavior.
- **Scope:** Read-only catalog adapter, listing/detail mapping, media/price presentation, SEO, empty/error handling and deployment verification.
- **Non-goals:** Cart, checkout, payment writes, customer identity, inventory mutation, ERP mutation or raffle persistence.
- **Dependencies:** Completed Phase 4 schema, project URL/publishable key configuration and approved media strategy.
- **Data/schema impact:** Read-only against published catalog policies; no Phase 5 migration required for the first adapter slice.
- **Security impact:** Explicit public field selection; no service-role key in browser code; inventory quantities remain private.
- **Validation:** Adapter/service tests, route/detail tests, public-policy smoke queries, build/Preview/production verification and graceful behavior when catalog configuration/data is absent.
- **Production gate:** Exact-head GitHub CI and Vercel Preview, followed by production smoke after merge.
- **Completion evidence:** Catalog adapter and Shop routes reading authoritative published catalog data.
- **Merged evidence:** PR #34 added the read-only listing/detail adapter; PR #35 and PR #36 added URL-driven search, allowlisted filters and bounded pagination. Merge commit `955d4f99bbd308b9dbe82192cf19dc43ac2e5771` has successful Vercel status.
- **Delivered slice:** PR #37 merged catalog hardening, public-media rendering and truthful SEO metadata as merge commit `c646d8df8edea4f3880e3171d16a7602bb818ff9`. GitHub `quality` run `31682479292` passed and Vercel reported the production deployment successful. The live Commerce project remained zero-row/no-bucket during the read-only validation, preserving the authoritative empty state.
- **Production smoke:** Completed on 2026-08-20 against `https://luminalfactory.com`. `/shop` rendered the authoritative live-empty Commerce catalog; `/shop?q=object&type=artisan_keycap` rendered the same live-empty result with canonical `/shop` and `noindex, follow`; an unknown product slug rendered the dedicated not-found state. The Header/Footer logo loaded successfully through Next Image at its expected 3840×3840 intrinsic size.
- **Media inventory:** A read-only production check on 2026-08-20 confirmed zero products, zero published products, zero product-media rows, zero Storage buckets and zero Storage objects. Catalog media is therefore not failing or incomplete: no production product media has been onboarded yet. A Drive handoff is unnecessary until an approved catalog-content slice defines the product rows, destination bucket, file ownership, crops and alt text.
- **Current gate:** Phase 5 content smoke is complete. Real catalog-media rendering remains intentionally untested until an approved media bucket and published catalog row exist.
- **Next approved slice after Phase 5 completion:** The Phase 6 identity architecture decision is now documented; continue with its privacy/security review and schema/RLS plan. No cart or Auth implementation begins before that review.

## Phase 6 — Cart and customer identity — `IN_PROGRESS`

- **Objective:** Cart persistence, guest/customer boundary, account and addresses.
- **Scope:** Identity and cart contracts.
- **Non-goals:** Payment capture.
- **Dependencies:** Catalog, auth decision, privacy review.
- **Data/schema impact:** Customer/cart persistence likely.
- **Security impact:** Authentication, RLS, PII, session protection.
- **Validation:** Guest/auth transitions, authorization, persistence, accessibility.
- **Production gate:** Security and privacy approval.
- **Completion evidence:** Tested staging flows.
- **Current decision:** `specs/commerce/phase6-identity-architecture-decision.md` approves, for technical planning, an opaque server-owned guest-cart token plus permanent Supabase Auth accounts using SSR cookie sessions. Supabase anonymous Auth is deferred for the first guest-cart slice. No Auth setting, PII access or cart runtime has been enabled.
- **Review evidence:** `specs/commerce/phase6-privacy-security-review.md` and `specs/commerce/phase6-cart-identity-schema-rls-technical-plan.md` document data minimization, retention, Auth/anti-abuse controls, three-slice schema direction, RLS/grants, rollback and staging test matrix.
- **Owner approval:** On 2026-08-13 the owner approved 30-day inactive guest-cart retention plus deletion within 7 days, email OTP as the first account method, Cloudflare Turnstile, and deferring saved addresses until guest-cart/Auth isolation passes staging.
- **Current slice:** Slice A guest-cart persistence is applied without PII, direct client policies, Auth configuration, inventory reservation, order or payment behavior. Generated database types include `carts` and `cart_items`.
- **Production evidence:** On 2026-08-14 clean preflight preceded one exact migration operation. Ledger entry `20260814035441_create_guest_cart_foundation` exists; both tables are RLS-enabled, policy-free, unavailable to `anon`/`authenticated`, zero-row and have all reviewed indexes, constraints and triggers. Core commerce tables remain zero-row; advisors report only expected informational findings.
- **Delivery package:** `specs/commerce/phase6-guest-cart-production-migration-runbook.md` records preflight, exact forward boundary, postflight, rollback and success scope.
- **Service slice:** `src/features/cart/guest-cart-service.ts` and `src/lib/supabase/guest-cart-server.ts` implement token/hash, create/read/set/remove, expiry/activity, published catalog reconciliation and server-only persistence behind `COMMERCE_GUEST_CART_ENABLED`. No inventory, price, order, payment, PII or Auth authority was added.
- **Request boundary:** `POST /api/cart` now has strict action schemas, exact-origin/content-type/custom-header checks, 4 KiB bodies, keyed source identifiers, cookie-only tokens and private/no-store generic responses. The route short-circuits while disabled and has no UI consumer.
- **Durable limiter slice:** The existing Supabase Postgres project is the zero-recurring-cost backend. `private.guest_cart_rate_limits` plus a service-role-only invoker RPC uses atomic upsert with database-owned fixed hourly thresholds; Supabase Cron removes expired counters. The server adapter fails closed on every RPC/configuration failure.
- **Limiter production evidence:** On 2026-08-15 the exact reviewed migration passed transactional rollback validation, was applied once as ledger entry `20260815022728_add_guest_cart_rate_limits`, and passed database postflight with zero retained counters. Runtime remained disabled.
- **Delivery evidence:** PR #39 merged the complete disabled guest-cart foundation and staging gate as `e0f13ca43e19783439abaca845ee8baa4cc01bf6`; GitHub CI and Vercel Preview passed. PR #40 then hardened the Vercel protection gate and was squash-merged as `7aa81537be22be0bd2ac7c3ae5cfb9a70089a174`; its CI and production Vercel deployment passed.
- **Current gate:** `STAGING_DISABLED_PROBE_EXACT_HEAD_PREVIEW_REQUIRED`. Preflight confirmed that the available PR #40 Preview belongs to an older source commit, while the deployment sourced from the current `HEAD` is classified as Production. Neither is a valid isolated staging target, so the disabled probe was not run. No application request or database write occurred. Production remains live-empty with zero carts, cart items and Auth users.
- **Next approved operation:** Push the documentation checkpoint once and create one PR so Vercel can produce a non-production Preview whose source commit equals the full branch `HEAD` SHA. Keep `COMMERCE_GUEST_CART_ENABLED=false`, then run only the non-mutating disabled probe with the operator-only Automation Bypass secret. Enabled Preview runtime and the bounded create/delete smoke remain a separate explicit approval. Production runtime remains false/absent.

## Phase 7 — Checkout and payment — `LIVE_APPROVAL_REQUIRED`

- **Objective:** Decide provider; implement validated checkout, idempotent order creation, recovery, confirmation, and email.
- **Scope:** Trusted payment lifecycle.
- **Non-goals:** Browser-authoritative payment state.
- **Dependencies:** Phases 4–6, provider/legal/operator approval.
- **Data/schema impact:** Orders, payments, reconciliation.
- **Security impact:** Highest; webhooks, secrets, fraud and PII.
- **Validation:** Sandbox end-to-end, replay/idempotency/failure/reconciliation tests.
- **Production gate:** Explicit live approval and rollback/runbook.
- **Completion evidence:** Signed production-readiness review.
- **Next approved slice:** Payment provider decision record.

## Phase 8 — ERP integration — `LIVE_APPROVAL_REQUIRED`

- **Objective:** Product/inventory synchronization, order handoff, production/shipping status, audit and retries.
- **Scope:** Approved cross-system contracts only.
- **Non-goals:** Moving ERP workflows into storefront.
- **Dependencies:** ERP audit, commerce model, operational ownership decision.
- **Data/schema impact:** Shared contracts/integration events.
- **Security impact:** Service authentication, least privilege, auditability.
- **Validation:** Contract, retry, duplication, reconciliation, rollback tests.
- **Production gate:** Both-system operator approval.
- **Completion evidence:** Staging reconciliation and runbook.
- **Next approved slice:** Read-only ERP boundary audit.

## Phase 9 — Launch hardening — `NOT_STARTED`

- **Objective:** Accessibility, performance, security, SEO, analytics, monitoring, backup/recovery, smoke tests.
- **Scope:** Evidence-driven release hardening.
- **Non-goals:** New major features.
- **Dependencies:** Functional storefront and deployment access.
- **Data/schema impact:** Monitoring/analytics contracts only as approved.
- **Security impact:** Threat review, headers, privacy/consent, recovery.
- **Validation:** WCAG audit, performance budgets, security review, SEO crawl, production smoke/recovery drills.
- **Production gate:** Launch checklist and operator sign-off.
- **Completion evidence:** Reports, dashboards, runbooks, retest record.
- **Next approved slice:** Launch-readiness audit.

## Standing owner authorization — 2026-08-10

The owner authorized automatic progression through the roadmap and automatic selection of the simplest reasonable implementation option without per-slice approval.

Escalate only when a decision has material system-wide consequences, introduces meaningful recurring cost, changes production security/access boundaries, performs destructive production data changes, or presents serious production risk. Normal low-risk branch/PR/CI work proceeds automatically.

## Standing security gate — 2026-08-12

- Every grouped release train must pass `npm run security` before push/PR.
- The static gate rejects committed credential signatures, privileged `NEXT_PUBLIC_*` names, `next.config` environment bundling, dynamic runtime code execution, unreviewed package lifecycle hooks and unapproved hard-coded outbound fetch hosts.
- The dependency gate rejects high or critical vulnerabilities in production dependencies. Development-only tooling remains outside the production runtime boundary but still receives review during dependency changes.
- This automated gate supplements rather than replaces RLS review, authorization tests, browser security testing and production monitoring in the phases that introduce those boundaries.
