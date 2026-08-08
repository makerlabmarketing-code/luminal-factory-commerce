# Commission Page Specification

## Document metadata

| Field | Value |
|---|---|
| Status | `DRAFT` / `REVIEW_REQUIRED` |
| Owner | Luminal Factory Commerce storefront |
| Last updated | 2026-08-08 |
| Source experience script | `docs/page-scripts/commission-experience-script-draft.md` |
| Related roadmap phase | Phase 3 — Static storefront routes |
| Implementation status | `BLOCKED_PENDING_OWNER_APPROVAL` |

This specification defines the first Commission page foundation. It does not approve persistence, Supabase schema, authentication, payment, deposit, order creation, file uploads, or ERP changes.

## Page purpose

The Commission page explains Luminal Factory's custom-work path, helps visitors determine fit, and sets expectations before any inquiry workflow exists.

Primary user outcome: understand what commission work may cover, how the collaboration proceeds, and whether to return when inquiries are available.

Commerce boundary: a commission request is a structured request, not an order. Any operational review belongs to the ERP; storefront implementation must not expose internal workflow.

## Information architecture

1. Global header.
2. Commission introduction and truthful availability state.
3. Commission categories.
4. Collaboration process.
5. Information to prepare.
6. Expectation setting.
7. Selected work / Archive bridge.
8. Discovery-only inquiry entry.
9. Global footer.

## First-slice content contract

The first slice is presentation-only and may use typed static content.

Suggested fields:

- `eyebrow`
- `title`
- `summary`
- `availabilityLabel`
- `availabilityMode`: `open-info` | `closed-info` | `coming-soon`
- `categories[]`: title, description
- `processSteps[]`: title, description
- `preparationItems[]`
- `expectationItems[]`
- `archiveCta`
- `inquiryCta`

These names are presentation contracts only and must not become database columns by implication.

## Availability behavior

The first implementation must not invent live availability. If no approved source exists, use a neutral presentation such as `Commission đang được chuẩn bị` or `Yêu cầu commission sẽ mở trong một đợt riêng`.

A future dynamic availability state must be supplied by a trusted service/data boundary. The browser must not independently determine whether commissions can be accepted.

## Commission categories

Initial presentation categories proposed for owner approval:

1. Artisan keycap.
2. Collectible object.
3. Small branded/custom object.

Each category is descriptive only. Do not publish unsupported dimensions, materials, MOQ, price ranges, licensing claims, production techniques, or turnaround promises.

## Public process

1. Visitor prepares intent and references.
2. Luminal reviews fit and feasibility.
3. Accepted requests proceed to scope, quote, timing, and commercial terms.
4. Production starts only after the relevant agreement/deposit decision.
5. Completion and fulfillment follow the agreed scope.

The first page slice displays this process but performs none of these operational mutations.

## Future request-form boundary

A later interactive request flow requires a separate technical/data approval covering at minimum:

- request fields and validation
- PII classification and privacy copy
- authentication decision, if any
- server-side anti-spam and duplicate handling
- media upload policy and file limits, if uploads are allowed
- Supabase tables, RLS, storage buckets, policies, generated types, and rollback plan if Supabase is selected
- operator review handoff to ERP without importing ERP-only administration into the storefront
- acknowledgement, failure, retry, and idempotency behavior

No part of that contract is approved by this specification.

## UI direction

- Dark contemporary artisan-gallery visual language.
- Object/story before commerce controls.
- Editorial asymmetry is allowed, but content hierarchy must remain obvious.
- Avoid generic SaaS cards and bright ecommerce-template treatments.
- Reflective accents may use the existing ice-blue, pale-pink, lavender, and diamond-white material cues sparingly.

## Motion

First viewport budget:
- one primary motion maximum
- up to two secondary motions

Prefer CSS or simple Motion-level treatment if motion is needed. No WebGL is justified for the first Commission foundation.

Reduced-motion mode must preserve all content and actions in a static layout.

## Responsive and accessibility requirements

- One `h1`.
- Semantic landmarks.
- Logical heading order.
- Keyboard-accessible links and controls.
- Visible focus state.
- No essential information encoded only by color or motion.
- Mobile layout must stack content cleanly and keep process/availability understandable without pointer interaction.
- Decorative media must not produce noisy or misleading alt text.

## Route and architecture

Future implementation target: `/commission`.

The route should remain a thin Server Component and compose feature-level presentation components. Client components are permitted only for genuine browser interaction.

Suggested feature boundary:

- `src/app/commission/page.tsx`
- `src/features/commission/commission-content.ts`
- `src/features/commission/commission-page.tsx` or focused section components as needed

No raw Supabase query belongs in visual components.

## Loading, empty, and error behavior

For the static first slice, normal rendering has no remote loading state.

If later server data is introduced:
- loading must reserve stable layout
- missing availability must fall back to neutral discovery copy
- errors must never falsely display `open`
- request controls must fail closed if authoritative availability cannot be confirmed

## SEO and metadata

Use truthful descriptive metadata focused on custom artisan work. Do not publish unsupported claims such as guaranteed slots, fixed turnaround, or instant quotes.

Canonical behavior follows the repository's existing metadata/environment contract.

## Validation for first implementation slice

When implementation is approved, validate:

- `npm run lint`
- `npm run typecheck`
- `npm test`
- `npm run build`
- `npm run check` if still defined
- route existence and link crawl
- one-h1/semantic checks
- 390px and 1440px layout review
- keyboard/focus review
- reduced-motion behavior
- no Supabase, payment, order, ERP, or file-upload code introduced

## Non-goals

- Live request submission.
- Supabase migration or RLS.
- Authentication/account dependency.
- Cart/checkout/payment/deposit.
- Order creation.
- ERP mutations or internal commission administration.
- Production-slot allocation.
- Quote calculation.
- Upload storage.

## Approval gate

Implementation remains blocked until the owner approves the experience script and this specification for the bounded static `/commission` foundation.

After approval, create a separate technical plan and implementation branch for the static Commission discovery page. The future request form must remain a later independently approved slice.