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

## Phase 3 — Static storefront routes — `IN_PROGRESS`

- **2026-08-05 approval note:** Raffle-first Home experience script is owner-approved for the first implementation slice; the formal Home specification at `specs/home/home-page-specification.md` is approved for the first implementation slice. Phase 3 implementation has started with the current slice: Global visual foundation + Home raffle discovery hero shell.
- **Objective:** Define Shop, Product detail, Gallery, Commission, Raffle, About, Contact, Cart, and Account shells.
- **Scope:** Approved page scripts, metadata, empty/loading/error patterns, non-broken navigation.
- **Non-goals:** Persistence or functional commerce.
- **Dependencies:** Page-by-page experience approval; Phase 1 foundations.
- **Data/schema impact:** Static fixtures only.
- **Security impact:** Account shell must not imply authentication exists.
- **Validation:** Route build, link crawl, semantics, responsive/a11y checks.
- **Production gate:** Design approval for each route.
- **Completion evidence:** Route manifest, screenshots, checks.
- **Current slice:** Luminal Brand Asset Integration + Legacy LazyFactory Asset Recovery Inventory.
- **Current slice scope:** The owner-approved Luminal logo source is confirmed, but the production PNG is deferred because the Codex PR UI blocks the binary diff. Header/Footer retain the accessible text fallback with no broken image request; `public/brand/luminal-factory-logo-primary.png` is reserved for owner upload through GitHub Web after merge. Historical LazyFactory inventory remains review-gated and empty because its remote source was blocked.
- **Previous slice evidence:** Home Shop Discovery Preview + `/shop` and Home Archive Preview + `/archive` remain bounded foundation slices; full Shop, Archive, and production media replacement remain future-gated.

## Phase 4 — Commerce data model — `LIVE_APPROVAL_REQUIRED`

- **Objective:** Specify products, variants, collections, media, pricing, stock, release/status types, raffle configuration, and commission slots.
- **Scope:** Contract design and ERP impact audit before migrations.
- **Non-goals:** Automatic production SQL.
- **Dependencies:** ERP/schema audit and operator approval.
- **Data/schema impact:** High; shared schema decision.
- **Security impact:** RLS, privileged mutation, public-field design.
- **Validation:** Contract review, migration preflight/rollback, generated types, both-app impact checks.
- **Production gate:** Explicit live approval.
- **Completion evidence:** Approved model and migration package.
- **Next approved slice:** ERP/Supabase read-only contract audit.

## Phase 5 — Catalog integration — `NOT_STARTED`

- **Objective:** Add server queries, listing, filter/search/pagination, detail/media, and SEO.
- **Scope:** Published public catalog reads behind services.
- **Non-goals:** Cart/checkout.
- **Dependencies:** Approved Phase 4 and media strategy.
- **Data/schema impact:** Read contracts only after schema approval.
- **Security impact:** Explicit public field selection and RLS.
- **Validation:** Service, boundary, route, SEO, performance, empty/error tests.
- **Production gate:** Staging data and query/security review.
- **Completion evidence:** Catalog smoke tests and deployment verification.
- **Next approved slice:** Read-only catalog adapter.

## Phase 6 — Cart and customer identity — `NOT_STARTED`

- **Objective:** Cart persistence, guest/customer boundary, account and addresses.
- **Scope:** Identity and cart contracts.
- **Non-goals:** Payment capture.
- **Dependencies:** Catalog, auth decision, privacy review.
- **Data/schema impact:** Customer/cart persistence likely.
- **Security impact:** Authentication, RLS, PII, session protection.
- **Validation:** Guest/auth transitions, authorization, persistence, accessibility.
- **Production gate:** Security and privacy approval.
- **Completion evidence:** Tested staging flows.
- **Next approved slice:** Identity architecture decision.

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
