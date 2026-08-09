# Shop Product Detail Experience Script Draft

Status: `DRAFT_FOR_OWNER_REVIEW`
Date: 2026-08-09
Gate: Experience definition only. This document does not approve live catalog data, inventory, cart, checkout, payment, order creation, Supabase schema, or ERP changes.

## Scope

This slice defines the first dedicated product-detail experience for directly purchasable Luminal Factory collectibles at `/shop/[slug]`.

The first implementation remains presentation-only and static. It exists to establish the information architecture, media hierarchy, route contract, and product storytelling before transactional commerce is introduced.

## Experience goal

Give a collector a focused, object-led detail page that explains what the collectible is, how it is made, what series/context it belongs to, and what purchasing state is known, without inventing price, stock, delivery promises, or checkout capability.

## Narrative sequence

1. Product identity hero: approved product name, collection/type, one dominant media frame, concise object story.
2. Material and craft notes: hand-finished characteristics, production method, compatibility or dimensions only when approved.
3. Availability state: truthful presentation status such as `detail-only`, `coming-soon`, `unavailable`, or `archived`; no fake stock or urgency.
4. Media gallery: approved product media when available; internal placeholders remain explicitly labeled as non-production.
5. Product facts: structured facts only from approved source data. Unknown facts are omitted rather than guessed.
6. Direct-purchase boundary: first slice has no Add to Cart / Buy Now action. A later transactional slice may introduce purchase controls after catalog/inventory/order contracts are approved.
7. Related discovery: back to Shop and optionally relevant Archive/Commission surfaces when those links are meaningful.
8. Global footer.

## Route contract

- Public route: `/shop/[slug]`.
- Slug is a stable public presentation identifier.
- Missing/unpublished placeholder returns not-found or a truthful unavailable state.
- Shop cards should link to the corresponding detail route only after that route exists and is verified.

## First-slice fields

Presentation model may include:
- `slug`
- `title`
- `collection`
- `type`
- `summary`
- `story`
- `materialNote`
- `craftNotes[]`
- `facts[]`
- `media[]`
- `presentationStatus`
- `availabilityLabel`
- `isPlaceholder`

These are presentation fields only. They are not approved production database columns.

## Availability states

Suggested first-slice presentation states:
- `detail-only`
- `coming-soon`
- `unavailable`
- `archived`

The page must not render `in-stock`, `sold-out`, quantity, price, shipping deadline, preorder status, or purchase CTA unless authoritative commerce data and contracts exist.

## Media direction

- One object dominates the first viewport.
- Dark gallery language consistent with current Shop/Archive/Raffle surfaces.
- Ice-blue, pale-pink, lavender, glass/metal reflections remain accent cues rather than UI chrome.
- Internal placeholder art must remain clearly tagged in alt/credit/source metadata as non-production.
- Gallery interactions must work with keyboard and without hover-only controls.

## Responsive/accessibility

- Exactly one `h1`.
- Product identity and availability are visible before secondary detail on mobile.
- Logical heading order and semantic sections/lists.
- Media alt text describes the object or explicitly states placeholder status.
- Visible keyboard focus.
- Reduced motion preserves all essential information.

## Explicit non-goals

- Price.
- Inventory or stock reservation.
- Variants/SKU selector.
- Cart.
- Checkout.
- Payment.
- Order creation.
- Customer account/auth.
- Shipping calculation.
- Supabase catalog/inventory schema.
- ERP changes.

## Approval questions

1. Approve `/shop/[slug]` as the product detail route.
2. Approve first implementation as static/presentation-only using current curated placeholders.
3. Approve truthful availability labels with no price/stock/purchase CTA yet.
4. Approve reusing the current Shop placeholder objects as detail-page studies until production catalog assets are approved.
5. Approve that catalog/inventory/cart/checkout/payment/order behavior remains a later independently specified slice.
