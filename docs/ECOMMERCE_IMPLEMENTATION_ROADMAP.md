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

## Phase 4 — Commerce data model — `IN_PROGRESS`

- **Objective:** Specify the safe commerce persistence boundary and model products, variants, collections, media, pricing, stock, direct-sale/preorder status and commission-facing contracts before migrations.
- **Scope:** Read-only contract audit first; schema proposal and migration package only after architecture boundary is resolved.
- **Safety boundary:** Do not operationalize chance-based raffle entry, random winner selection, or raffle participation persistence in this project work. Existing raffle presentation remains informational only.
- **Current schema audit:** The connected Supabase project contains no public `products`, `raffles`, `customers`, `orders`, `order_items`, or `payments` tables. Existing `product_categories` and `production_orders` belong to the ERP/internal production domain and must not be treated as storefront commerce entities.
- **Current architecture issue:** The repository Supabase contract says storefront and ERP should eventually share one project, while the connected Supabase project is the live ERP database and this commerce conversation is explicitly prohibited from mutating ERP. Resolving shared-vs-dedicated commerce persistence is a system-wide architecture decision.
- **Non-goals:** Automatic production SQL; implicit reuse/mutation of the ERP Supabase project; payment/order implementation.
- **Dependencies:** Read-only ERP/schema audit, persistence-boundary decision, and migration preflight.
- **Data/schema impact:** High once implementation starts; zero during the current audit slice.
- **Security impact:** RLS, privileged mutation, public-field design and secret boundaries must be defined before any persistence implementation.
- **Validation:** Contract review, migration preflight/rollback, generated types, storefront impact review, and ERP impact review when/if integration is approved.
- **Production gate:** System-wide persistence-boundary decision before creating or migrating a commerce database; destructive or security-sensitive changes require explicit operator review.
- **Completion evidence:** Approved model, persistence-boundary decision and migration package.
- **Current slice:** `specs/commerce/phase4-supabase-schema-audit.md` + `specs/commerce/phase4-commerce-schema-contract-draft.md`.

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

## Standing owner authorization — 2026-08-10

The owner authorized automatic progression through the roadmap and automatic selection of the simplest reasonable implementation option without per-slice approval.

Escalate only when a decision has material system-wide consequences, introduces meaningful recurring cost, changes production security/access boundaries, performs destructive production data changes, or presents serious production risk. Normal low-risk branch/PR/CI work proceeds automatically.
