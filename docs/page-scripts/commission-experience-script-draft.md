# Commission Page Experience Script Draft

Status: `DRAFT_FOR_OWNER_REVIEW`
Date: 2026-08-08
Gate: Experience direction only. This document does not approve a live commission submission workflow, database schema, payment, deposit, order creation, or ERP mutation.

## Authority and scope

Authority order: `AGENTS.md` → `.agents/skills/luminal-commerce/SKILL.md` and relevant references → roadmap → this script.

The Commission surface is a public discovery and inquiry experience. A commission request is not automatically an order. Operational review remains an ERP responsibility.

## Experience goal

Present commission work as a selective studio collaboration rather than a generic contact form. The visitor should understand what Luminal can create, what information is useful, what happens after an inquiry, and that acceptance is not guaranteed.

The page should feel like a dark studio consultation: editorial, object-led, restrained, and clear about process boundaries.

## Target user

- A collector who wants a custom artisan keycap or collectible object.
- A brand or collaborator exploring a custom object or small creative run.
- A returning customer who wants to understand commission availability and process before contacting Luminal.

## Primary action

Primary action for the first implementation slice: understand commission fit and process.

A future submission CTA may be introduced only after the commission request contract, privacy requirements, validation rules, storage strategy, and trusted server boundary are approved.

## Narrative sequence

### 1. Commission introduction

Role: explain that commission is a curated collaboration path, not instant checkout.

Content:
- concise commission positioning
- truthful availability state such as `Đang nhận yêu cầu`, `Tạm đóng`, or `Theo lịch mở` only when approved source data exists
- no invented turnaround time, price floor, slot count, or acceptance promise

Interaction:
- restrained object/media reveal or static editorial composition
- no heavy motion required

### 2. What can be commissioned

Role: help visitors self-qualify before contacting the studio.

Content categories may include:
- artisan keycap
- collectible object
- small branded/custom object

Rules:
- do not promise unsupported materials, manufacturing methods, licensing, delivery dates, or production quantities
- product examples are illustrative until production-approved assets and copy exist

### 3. Collaboration process

Public-facing sequence:
1. Share intent and references.
2. Studio reviews fit and feasibility.
3. Scope, quote, timing, and deposit are discussed only after acceptance.
4. Production begins only after an approved commercial agreement.
5. Completion and fulfillment follow the agreed scope.

This sequence must not expose internal ERP workflow or imply that submission creates an order.

### 4. Information to prepare

Visitors may be asked in a future request flow to prepare:
- name and contact method
- object type
- project intent
- reference media
- approximate size or usage context when relevant
- budget context
- notes or constraints

No file upload UI is approved in this script.

### 5. Expectation setting

The page should communicate:
- requests are reviewed
- not every request is accepted
- quote and timing depend on scope
- reference media must be provided with appropriate rights to share/use
- submission does not reserve production capacity
- submission does not create an order, invoice, or payment obligation

### 6. Example work / archive bridge

Role: show craft range without turning Commission into a generic product gallery.

Use only production-approved Luminal or approved historical archive media. If unavailable, use the existing internal placeholder strategy.

Archive remains the broader memory surface; Commission may link to relevant examples without duplicating Archive.

### 7. Future inquiry entry

First implementation slice behavior: discovery-only CTA or truthful `Sắp mở` state.

Future interactive request form requires a separate approved slice covering:
- typed request contract
- validation
- anti-spam and duplicate submission handling
- privacy/PII handling
- media upload/storage rules if applicable
- Supabase RLS or trusted server boundary
- operator review destination
- failure/retry behavior

### 8. Footer

Reuse global footer and only link to implemented destinations.

## Motion and responsive behavior

- One primary visual motion maximum in the first viewport.
- At most two secondary motions.
- Mobile must not depend on pointer interaction.
- Reduced-motion mode uses a stable static composition.
- Essential copy and CTA state remain readable without animation.

## Explicit non-goals

- Commission request persistence.
- Customer authentication.
- Supabase schema or migrations.
- ERP workflow changes.
- Quote generation.
- Deposit/payment collection.
- Order creation.
- Production slot reservation.
- File uploads.
- Automated acceptance or rejection.

## Approval questions

1. Approve the page purpose as a curated commission discovery/inquiry surface.
2. Approve first implementation as a static `/commission` foundation only.
3. Approve the public process sequence above.
4. Approve the initial commission categories: artisan keycap, collectible object, and small branded/custom object.
5. Approve that pricing, turnaround, availability counts, and file uploads stay out of the first slice.
6. Approve a future separate slice for the actual commission request form and Supabase contract.