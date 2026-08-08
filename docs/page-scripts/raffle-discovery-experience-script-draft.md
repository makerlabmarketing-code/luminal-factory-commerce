# Raffle Discovery Experience Script Draft

Status: `DRAFT_FOR_OWNER_REVIEW`
Date: 2026-08-09
Gate: Experience direction only. This document does not approve raffle entry submission, eligibility enforcement, winner selection, payment, order creation, Supabase schema, or ERP mutation.

## Authority and scope

Authority order: `AGENTS.md` → `.agents/skills/luminal-commerce/SKILL.md` and relevant references → roadmap → this script.

Luminal Factory is raffle-first. The Raffle surface is therefore the primary public commerce discovery path, but a raffle event, a raffle entry, a payment, and an order remain distinct concepts.

The first implementation slice proposed here is a static `/raffle` discovery foundation. A transactional raffle detail and entry workflow require separate approval.

## Experience goal

Give collectors one clear place to understand the current or next raffle moment before ordinary shopping. The page should communicate release state, object story, and how Luminal raffles conceptually work without pretending that a live entry system exists.

The experience should feel like a controlled release room inside the same dark artisan gallery: one focal object, strong timing/status hierarchy, little visual noise, and no generic ecommerce grid as the opening composition.

## Target user

- A collector checking whether a raffle is open or upcoming.
- A returning visitor looking for the current release state.
- A new visitor trying to understand how Luminal raffle releases differ from direct shop purchases.

## Primary action

First-slice primary action: understand the featured/current raffle state and release context.

When a real approved raffle detail route later exists, the primary CTA may become `Xem chi tiết raffle`.

An `Enter raffle` action must not exist until eligibility, duplicate-entry prevention, authoritative timing, identity, submission, and server/database enforcement are approved.

## Narrative sequence

### 1. Raffle status hero

Role: immediately answer “what is happening now?”

Content:
- one featured release or truthful placeholder
- public presentation state
- opening/closing timing only when authoritative source data exists
- one primary discovery CTA
- no price, slot count, winner count, or urgency claim unless approved and sourced

First-slice fallback when no real raffle data is approved:
- neutral status such as `Đợt raffle tiếp theo đang được chuẩn bị`
- non-transactional release study or approved object media
- no fake countdown

Interaction:
- one primary material/object reveal maximum
- optional restrained status/title settle
- CTA must remain usable without animation

### 2. Current / upcoming release context

Role: explain why the object or release matters before explaining mechanics.

Content may include:
- approved object/release title
- short craft or material note
- collection or series context
- approved media

Do not invent product names, edition size, price, stock, collaborators, deadlines, or materials.

### 3. Raffle timing and state

Role: provide trust and clarity.

Presentation states may include:
- upcoming
- open
- closed
- drawing
- completed
- unavailable / status pending

These are presentation labels only until the shared raffle lifecycle contract is finalized.

Rules:
- countdown is never the sole source of truth
- browser time must not independently open or close entry eligibility
- unknown or stale data fails to a neutral non-entry state
- canonical public time zone should remain Asia/Ho_Chi_Minh unless a future contract changes it

### 4. How Luminal raffle works

Role: teach the commerce model without implementing it.

Public conceptual sequence:
1. A raffle release is announced and scheduled.
2. Eligible collectors submit an entry while the raffle is open.
3. Entry does not create an order or revenue.
4. After closing, winner selection is handled through the approved operational process.
5. Only an eligible winner may proceed to the later payment/order flow according to the final rules.

The first slice displays this explanation only. It performs no mutations.

### 5. Trust and rules preview

Role: prevent common misunderstandings.

The page should make clear that:
- an entry is not an order
- submitting an entry does not guarantee purchase
- payment behavior belongs after winner selection according to the final contract
- final eligibility, duplicate-entry rules, payment deadline, cancellation, and redraw rules must come from an approved raffle rules contract

Do not publish detailed rules that have not been approved.

### 6. Previous raffle / Archive bridge

Role: connect the current release to Luminal's collectible history.

Use Archive as the broader historical surface. The Raffle page may show a restrained link or small preview, but must not duplicate the full archive.

### 7. Future raffle detail / entry boundary

The first implementation slice should link nowhere transactional if no real detail exists.

A later `/raffle/[slug]` and entry slice requires separate approval covering at minimum:
- canonical raffle lifecycle mapping
- raffle/product relationship
- public timestamps and time zone
- entry uniqueness and eligibility rules
- customer identity/auth decision
- duplicate submission and idempotency
- trusted server/database enforcement
- Supabase tables, RLS, generated types, and migrations if Supabase is used
- rate limiting / anti-abuse
- acknowledgement and retry behavior
- winner-status visibility
- payment deadline and later order-creation boundary
- ERP ownership of winner administration

### 8. Footer

Reuse the global footer and link only to implemented destinations.

## Motion and responsive behavior

- First viewport: one primary motion, maximum two secondary motions.
- Prefer CSS or existing motion tools before introducing 3D.
- No WebGL is required for the first static Raffle foundation.
- Mobile must show status/title/action before secondary story content.
- No pointer-dependent interaction on mobile.
- Reduced-motion mode uses stable static composition and timestamps.

## Explicit non-goals

- Raffle entry submission.
- Customer authentication.
- Winner selection or administration.
- Payment collection.
- Order creation.
- Inventory reservation.
- Supabase schema, migrations, RLS, or storage changes.
- ERP mutation.
- Browser-authoritative countdown eligibility.
- Production raffle rules or legal copy not yet approved.

## Approval questions

1. Approve `/raffle` as the primary raffle discovery index before transactional detail/entry work.
2. Approve first implementation as static presentation only with a truthful upcoming/preparing fallback.
3. Approve the public conceptual sequence: announce → entry window → close → draw → winner payment/order later.
4. Approve that raffle entry is explicitly not an order and creates no revenue by itself.
5. Approve Asia/Ho_Chi_Minh as the presentation time zone for the first slice.
6. Approve that `/raffle/[slug]`, entry submission, auth, Supabase, winner status, payment and order behavior remain later independently approved slices.
