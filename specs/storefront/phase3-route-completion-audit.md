# Phase 3 Storefront Route Completion Audit

Status: `OWNER_APPROVED`
Date: 2026-08-10
Database gate: `NOT_APPLICABLE_NO_DATA_CHANGE`
Implementation gate: `ROUTE_ARCHITECTURE_RESOLVED`

## Purpose

Close the information-architecture ambiguity in Phase 3 before moving toward the commerce data-model gate. The roadmap names Shop, Product detail, Gallery, Commission, Raffle, About, Contact, Cart, and Account shells, but the storefront has evolved into more specific public surfaces.

The goal is not to manufacture empty pages to satisfy a checklist. A route exists only when it has a distinct user outcome.

## Current public-surface model

### Home

- `/`
- Raffle-first discovery entry point.
- Bridges into Archive, Shop, Commission and studio context.

### Raffle

- `/raffle`
- Static discovery foundation only.
- Interactive entry, winner, payment and order behavior remain outside the current storefront slice.

### Archive

- `/archive`
- `/archive/[slug]`
- Historical/editorial record for released or studied objects.
- This surface satisfies the user outcome originally described by a generic Gallery route: browse visual/object work without implying availability for purchase.

### Shop

- `/shop`
- `/shop/[slug]`
- Object discovery and static product-detail presentation.
- No catalog database, price, stock, cart, checkout or order behavior yet.

### Commission

- `/commission`
- Discovery plus inquiry form boundary.
- Inquiry is review intake, not a quote, order, invoice, payment or production slot.
- This surface satisfies the user outcome originally described by a generic Contact route for prospective project/contact intent.

### About

- `/about`
- Implemented and merged in PR #27 at `e849ed90cd95be377721bcf8750042629f23be1c`.
- About is the dedicated studio-context route and navigation target.
- Merge used a documented low-risk delivery exception because Vercel was externally blocked by team build-rate-limit while GitHub quality passed; this exception does not apply to sensitive data/auth/payment/database changes.

## Approved route decisions

### 1. Gallery -> Archive

Decision: **Do not create `/gallery` in Phase 3.**

Reasoning:
- Archive already provides object-led visual browsing and historical/editorial context.
- A separate Gallery would duplicate media/object cards without a distinct user job.
- Future richer media can be added to Archive entries or a media section without inventing a second taxonomy.

Compatibility rule:
- If a historical external URL `/gallery` is ever needed, prefer a redirect to `/archive` rather than maintaining duplicate content.

### 2. Contact -> Commission

Decision: **Do not create `/contact` in Phase 3.**

Reasoning:
- Public actionable contact intent is currently commission/project inquiry.
- Commission owns the validated inquiry contract and server-side transport boundary.
- A second generic contact form would duplicate validation, privacy, anti-spam and delivery behavior.

Compatibility rule:
- General studio/contact copy may point to `/commission` until a genuinely distinct support/press/business-contact requirement exists.
- If `/contact` is required later for compatibility, prefer a redirect or thin bridge rather than a second submission system.

### 3. Cart -> Phase 6

Decision: **Do not create a visible `/cart` shell in Phase 3.**

Reasoning:
- There is no approved transactional catalog, price, stock or cart persistence contract yet.
- A visible empty Cart surface would imply a commerce capability that does not exist.
- Cart belongs with Phase 6 after the Phase 4 commerce data model and Phase 5 catalog read integration are established.

Navigation rule:
- No cart icon/count/link until an approved cart contract exists.

### 4. Account -> Phase 6

Decision: **Do not create a visible `/account` shell in Phase 3.**

Reasoning:
- There is no approved customer identity/authentication contract yet.
- A login/account shell would imply authentication and customer-data capability.
- Account belongs with Phase 6 identity architecture and privacy/security review.

Navigation rule:
- No account/login UI until the identity contract is implemented.

## Phase 3 completion definition

Phase 3 is route-architecture complete when all of the following are true:

1. Home foundation remains merged and navigable.
2. Raffle discovery foundation exists without invented transactional capability.
3. Archive index + detail foundations are merged.
4. Shop index + detail foundations are merged.
5. Commission discovery + inquiry boundary is merged; transport availability remains fail-closed when unconfigured.
6. About implementation is merged.
7. Gallery is formally resolved into Archive rather than implemented as a duplicate route.
8. Contact is formally resolved into Commission rather than implemented as a duplicate form.
9. Cart is formally deferred to Phase 6 and remains absent from public navigation.
10. Account is formally deferred to Phase 6 and remains absent from public navigation.
11. Public navigation remains internally coherent.
12. No Supabase/ERP schema changes are introduced by Phase 3 completion work.

## Next phase boundary

The next roadmap gate is **Phase 4 — Commerce data model**.

The owner has granted standing approval to continue the roadmap automatically and select the simplest reasonable implementation option. Escalation is only required for high-impact system-wide changes, serious production risk, material new recurring cost, destructive production data changes, or major security/access changes.

Phase 4 must not begin with production SQL. It starts with a read-only architecture/data-boundary audit and a dedicated commerce persistence design.

The existing ERP Supabase project must not be reused or mutated implicitly for storefront commerce work.

## Approved decisions summary

1. `Gallery` is fulfilled by Archive; no `/gallery` route in Phase 3.
2. `Contact` is fulfilled by Commission inquiry; no `/contact` route in Phase 3.
3. `Cart` is deferred to Phase 6; no visible shell now.
4. `Account` is deferred to Phase 6; no visible shell now.
5. Phase 4 may proceed automatically through read-only design and safe implementation preparation, with escalation only for the high-impact cases described above.
