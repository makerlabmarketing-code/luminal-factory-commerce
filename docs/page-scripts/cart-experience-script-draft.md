# Cart Experience Script Draft

Status: `APPROVED` / `IMPLEMENTED_DEFAULT_OFF`
Date: 2026-09-19
Gate: Experience direction only. This document does not approve enabling a
runtime flag, exposing Cart in global navigation, checkout, order creation,
payment, inventory reservation, Production data mutation, or ERP mutation.

## Authority and scope

Authority order: `AGENTS.md` → `.agents/skills/luminal-commerce/SKILL.md` and
relevant references → roadmap → this script.

This script defines the first customer-facing `/cart` experience on top of the
existing default-off guest-cart boundary. A cart records purchase intent only.
It is not an order, does not reserve inventory, and does not lock a price.

## Experience goal

Give a collector a calm, precise place to review direct-shop selections before
checkout exists. The page should make quantity, current catalog facts, stale
items, and the next available action understandable without presenting a fake
purchase path.

The visual direction should feel like a compact review desk inside Luminal's
dark gallery: object-led, spacious enough to read, but denser and quieter than
a discovery page.

## Target user

- A guest reviewing objects selected from the direct Shop catalog.
- A returning collector whose opaque cart cookie still resolves.
- An authenticated collector whose verified guest cart may have been merged
  when all separately gated runtimes were enabled.

Raffle entries never appear in this cart. An entry is not an order or direct
Shop line.

## Primary action

The first slice allows the user to review, change quantity, remove a line, and
return to Shop.

There is no checkout action in this slice. The summary must say truthfully that
checkout is being prepared; it must not render a button that looks actionable
but cannot complete a purchase.

## Narrative sequence

### 1. Cart heading and state

Role: immediately identify the page and whether there is anything to review.

Content:
- one `h1` for `Giỏ hàng`;
- available line count, not an inventory or reservation count;
- a concise reminder that availability and price are confirmed later;
- no urgency, countdown, stock quantity, or payment claim.

### 2. Available selections

Each line should show only current authoritative catalog presentation data:
- primary approved media or the existing truthful media fallback;
- product name and product-detail link;
- selected variant label when one exists;
- current published unit price when one exists;
- quantity control from 1 through 99;
- remove action;
- pending, success, and failure feedback local to the changed line.

The persisted cart identifiers remain the line identity. Name, media, variant
label, and price are re-read from the published catalog and are not copied into
the cart as an authoritative snapshot.

### 3. Unavailable selection notice

The current cart service intentionally hides unpublished or inactive selections
and returns only `unavailableLineCount`. The first UI therefore shows one
aggregate notice such as `Một số object không còn khả dụng và không được tính
trong giỏ hàng`.

It must not invent titles or expose stale catalog facts. Per-line unavailable
recovery and deletion require a later service contract because the current
public view does not return those identifiers.

### 4. Order estimate

Role: summarize current catalog presentation without implying a transaction.

Content:
- current subtotal only when every visible line has one valid VND price;
- a truthful `Chưa thể tính tạm tính` state when any price is missing or
  malformed;
- no shipping, tax, discount, deposit, raffle, or final-total calculation;
- note that price and availability will be validated again in a future trusted
  checkout flow.

No client calculation is authoritative. The server presentation adapter owns
the normalized minor-unit estimate and formatted labels.

### 5. Checkout boundary

Display an informational block, not a disabled commerce control:
- `Thanh toán đang được chuẩn bị`;
- `Tiếp tục xem Shop` as the available action;
- optional Account link only when the existing Account surface is separately
  approved for global exposure.

Do not create an order, payment intent, reservation, shipping quote, or address
requirement from Cart.

### 6. Empty and unavailable states

Empty cart:
- short confirmation that no direct-shop object is selected;
- primary link to `/shop`;
- optional secondary link to `/archive`;
- no automatic cart creation merely by viewing the empty page.

Runtime disabled or unavailable:
- fail closed without leaking configuration details;
- do not expose mutation controls;
- show a truthful temporary-unavailable state with a Shop escape path;
- keep the page private and uncached.

### 7. Account relationship

Guest use remains first-class; sign-in is not required to review the cart.

When Customer Auth and cart merge are separately enabled, successful OTP
verification may merge the guest cart under the existing server-only contract.
Cart UI must not match ownership by email, expose merge internals, or erase the
guest cookie on a failed merge.

Saved addresses are not part of the Cart page and do not appear before a real
checkout contract needs them.

## Interaction and motion

- Quantity changes use explicit controls and visible in-progress state.
- Prevent double submission while one line mutation is pending.
- Preserve the last confirmed view when a mutation fails and offer retry.
- Announce cart updates through a restrained `aria-live` region.
- No drag-to-remove, auto-advancing content, WebGL, or decorative motion is
  required.
- Reduced-motion mode preserves every state and action.

## Responsive behavior

- Mobile stacks line media, facts, quantity, and remove action without hiding
  labels behind hover.
- The estimate follows the line list on small screens and may become a sticky
  side panel only on wide screens if it does not obscure content.
- Touch targets are at least 44 by 44 CSS pixels.
- Focus order follows the visual reading order.

## Explicit non-goals

- Checkout or order creation.
- Payment, refunds, tax, shipping, discounts, or invoices.
- Inventory reads, inventory reservation, or stock promises.
- Raffle entries or winner payment.
- Saved-address collection.
- New Supabase schema or RLS changes.
- Client access to the Commerce secret key.
- Global Cart/Account navigation before separate approval.
- Enabling any Production runtime flag or writing Production data.
- ERP reads or mutations.

## Approval questions

1. Approve `/cart` as a dedicated guest-first review page.
2. Approve quantity update/remove plus Shop navigation as the only first-slice
   actions, with no checkout button.
3. Approve current published catalog price/media as presentation data that is
   re-read on each server view and never locked by the cart.
4. Approve the aggregate unavailable-line notice until the service can safely
   support per-line recovery.
5. Approve a private, no-store, runtime-gated implementation that is not added
   to global navigation and does not enable Production flags.
6. Approve guest-first behavior with optional Account linkage deferred to its
   existing independent runtime gates.

## Approval record

The owner approved `CART-UI-01` on 2026-09-19. The first implementation remains
guest-cookie-first and default-off. Reading or mutating a customer-attached cart
after a successful Auth merge remains a separate boundary before those runtimes
can be enabled together.
