# Raffle Discovery Page Specification

## Document metadata

| Field | Value |
|---|---|
| Status | `DRAFT` / `REVIEW_REQUIRED` |
| Owner | Luminal Factory Commerce storefront |
| Last updated | 2026-08-09 |
| Source experience script | `docs/page-scripts/raffle-discovery-experience-script-draft.md` |
| Related roadmap phase | Phase 3 — Static storefront routes |
| Implementation status | `BLOCKED_PENDING_OWNER_APPROVAL` |

This specification defines the first dedicated Raffle page foundation. It does not approve raffle entry persistence, eligibility enforcement, authentication, winner selection, payment, order creation, Supabase schema, or ERP changes.

## Page purpose

`/raffle` is the primary raffle discovery index for Luminal Factory. It should tell visitors what raffle moment is current or upcoming, explain the featured release, and clarify the raffle model before any transactional entry flow is implemented.

Primary user outcome: understand the public raffle state and know where a future real raffle detail would live.

Commerce boundary:
- Product is not Raffle.
- Raffle Entry is not Order.
- An unsuccessful entry creates no order and no revenue.
- Winner administration remains an ERP responsibility.
- Payment and fulfillment are later concerns after winner selection according to the final contract.

## Information architecture

1. Global header.
2. Featured/current raffle status hero.
3. Release/object context.
4. Timing and state explanation.
5. “How raffle works” public sequence.
6. Trust/rules preview.
7. Archive bridge.
8. Future detail/entry boundary.
9. Global footer.

## First-slice route scope

Approved implementation target, once owner review is complete:

- `/raffle` only.

Explicitly deferred:

- `/raffle/[slug]`
- entry form
- customer account/auth
- entry persistence
- winner status
- payment
- order creation
- inventory reservation

Navigation should eventually change Raffle from the Home `#raffle` anchor to the real `/raffle` route only when the static route is implemented and verified.

## First-slice presentation contract

The first slice may use typed static content. Suggested presentation fields:

- `eyebrow`
- `title`
- `summary`
- `presentationState`: `upcoming` | `open` | `closed` | `drawing` | `completed` | `unavailable` | `unknown`
- `statusLabel`
- `statusDescription`
- `opensAt`
- `closesAt`
- `timeZone`
- `releaseTitle`
- `releaseStory`
- `materialNote`
- `media`
- `howItWorks[]`
- `trustNotes[]`
- `archiveCta`
- `detailAvailability`

These are presentation contracts only. They must not become production database columns or shared domain enums by implication.

## First-slice default state

Until authoritative raffle data is approved, the first implementation should use a truthful static fallback:

- presentation state: `upcoming` or `unknown`, depending on final owner copy
- status message: `Đợt raffle tiếp theo đang được chuẩn bị`
- no opening/closing timestamps unless actually approved
- no countdown
- no entry CTA
- no price, entry capacity, winner count, or inventory claim
- CTA may point to Archive or remain informational until a real detail route exists

The first implementation must never simulate an open raffle.

## Presentation state behavior

| State | Public intent | CTA in first static slice | Timing behavior |
|---|---|---|---|
| `upcoming` | Release is scheduled/preparing | Discovery/detail only | Show timestamps only if approved |
| `open` | Real raffle is accepting entries | No entry action until transactional slice | Show authoritative close time |
| `closed` | Entry window ended | Detail/archive only | Static closed state |
| `drawing` | Winner process is underway | Status/detail only | No countdown |
| `completed` | Raffle lifecycle finished | Archive/results only when approved | Historical timestamps optional |
| `unavailable` | Authoritative status cannot be served | Archive/update path | Hide unreliable timing |
| `unknown` | Status not confirmed | Informational only | Hide timing |

The first static implementation may define these types for presentation completeness, but only render a truthful non-transactional fallback.

## Timing contract

For the first slice:
- canonical presentation time zone: `Asia/Ho_Chi_Minh`
- no browser-authoritative state transition
- no eligibility decision based only on client clock
- countdown is optional enhancement only in a future live-data slice
- stale or missing timing must fail to `unknown`/`unavailable`, never `open`

A future live raffle service must own authoritative status mapping and timestamps.

## Public raffle mechanics

The static page may explain this conceptual sequence:

1. Luminal announces a raffle release.
2. Eligible collectors may submit an entry during the approved entry window.
3. The entry records participation only; it is not an order and creates no revenue.
4. After the window closes, winner selection is handled through the approved operational workflow.
5. Eligible winners may later receive a payment deadline and proceed to an order/fulfillment obligation according to the final commerce contract.

This explanation must avoid claiming exact selection method, odds, entry limits, redraw rules, or payment deadlines before those rules are approved.

## Trust and rules preview

First-slice content should communicate the stable domain boundaries without inventing policy:

- entry does not guarantee purchase
- entry is not an order
- no payment is implied by merely viewing or entering the raffle
- detailed eligibility and duplicate-entry rules will be published only from an approved rules contract
- winner selection administration is not performed by the public storefront UI

## UI direction

- Dark contemporary artisan-gallery language.
- One release/object dominates the first viewport.
- Status is highly legible and visually separate from decoration.
- Avoid generic ecommerce product grids above the fold.
- Use reflective ice-blue, pale-pink, lavender, and diamond-white cues sparingly as material light, not default bright controls.
- Reuse existing global header/footer and current design tokens.
- Placeholder media must be explicitly internal/non-production when real approved assets are unavailable.

## Motion

First viewport budget:
- one primary object/material reveal maximum
- up to two secondary motions

For the first slice:
- CSS is preferred for simple reveal/settle
- no new dependency is justified
- no WebGL/3D requirement
- no endless countdown animation or visual urgency loop

Reduced-motion behavior:
- static media frame
- static status/timing labels
- all navigation and CTA behavior preserved

## Responsive and accessibility requirements

- Exactly one `h1`.
- Semantic `main`, sections, lists, and navigation.
- Logical heading order.
- Status must be understandable without color alone.
- Visible keyboard focus.
- Mobile first screen prioritizes status, title, release media/context, then supporting explanation.
- No pointer-only requirement.
- Dates must be human-readable and should use semantic time markup when real timestamps are introduced.
- Reduced motion must preserve all essential information.

## Route and architecture

Future implementation target:

- `src/app/raffle/page.tsx`
- `src/features/raffle/raffle-content.ts`
- `src/features/raffle/raffle-discovery.tsx`

The route should remain a thin Server Component.

First slice:
- static typed presentation content only
- no raw Supabase query
- no Client Component required unless a genuine browser interaction is added

Future live-data architecture:
- raffle data behind a typed service/repository boundary
- service maps shared domain lifecycle to public presentation state
- visual components receive normalized presentation data
- critical state/eligibility never comes from client-only logic

## Future detail and entry gate

A later `/raffle/[slug]` and entry implementation requires a new approved specification covering:

- canonical raffle lifecycle contract
- product/variant eligibility relationship
- real public slug/id contract
- opening and closing timestamps
- entry fields and validation
- authentication or guest identity decision
- eligibility enforcement
- uniqueness/duplicate rules
- idempotency
- trusted server or database mutation boundary
- anti-abuse/rate limiting
- Supabase schema, RLS, generated types, migrations and rollback if Supabase is used
- confirmation and retry/error states
- winner visibility
- ERP administrative boundary
- payment deadline behavior
- order creation only for the appropriate successful purchase path

## Loading, empty, stale, and error behavior

Static first slice:
- no remote loading state
- deterministic placeholder presentation

Future dynamic slice:
- reserve media/layout while loading
- missing raffle → truthful `No active raffle` / preparing state
- stale state → `Status pending` or unavailable
- data error → fail closed; no entry control
- image failure → text-first release context and approved fallback

## SEO and metadata

Use truthful metadata focused on Luminal raffle releases and collectible discovery.

Do not index placeholder-specific claims as if they were real release facts.

Canonical/indexing behavior follows the repository environment metadata contract.

## Validation for first implementation slice

When owner-approved:

- inspect actual package scripts
- `npm run lint`
- `npm run typecheck`
- `npm test`
- `npm run build`
- `npm run check` if defined
- route returns 200 in Vercel Preview
- Raffle nav links to `/raffle`
- one-h1/semantic checks
- 390px and 1440px visual review
- keyboard/focus review
- reduced-motion review
- no entry form, auth, Supabase, payment, order, inventory or ERP mutation code

## Database gate

First static slice: `NOT_APPLICABLE_NO_DATA_CHANGE`.

No database inspection or migration is required because the slice must not read or write Supabase.

## Non-goals

- Live raffle detail.
- Entry submission.
- Eligibility enforcement.
- Customer authentication.
- Winner selection/administration.
- Winner payment.
- Order creation.
- Inventory allocation.
- Supabase schema/RLS/migrations.
- ERP changes.
- Final legal/rules copy.

## Approval gate

Implementation remains blocked until the owner approves this experience script and specification for the bounded static `/raffle` discovery foundation.

After approval, create a separate technical plan and feature branch for `/raffle`. The transactional detail/entry flow remains a later independently approved slice.
