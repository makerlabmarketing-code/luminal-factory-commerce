# Cart Page Specification

## Document metadata

| Field | Value |
|---|---|
| Status | `APPROVED` / `CODE_COMPLETE_LOCAL_PREVIEW_REVIEW_PENDING` |
| Owner | Luminal Factory Commerce storefront |
| Last updated | 2026-09-19 |
| Source experience script | `docs/page-scripts/cart-experience-script-draft.md` |
| Related roadmap phase | Phase 6 — Cart and customer identity |
| Runtime status | `DEFAULT_OFF_FAIL_CLOSED` |

This specification defines the first `/cart` UI only. It does not approve
runtime activation, global navigation, checkout, order/payment creation,
inventory authority, address collection, Production mutation, or ERP work.

## Page purpose and domain boundary

`/cart` lets a guest or eligible signed-in customer review direct-shop purchase
intent. The following invariants are mandatory:

- Cart is not Order.
- Quantity is requested quantity, not reserved stock.
- Displayed price is the current published catalog price, not a locked price.
- Raffle Entry is not Cart Line.
- Checkout, payment, fulfillment and ERP remain outside this slice.

## Route and rendering contract

- Route: `/cart`.
- Thin dynamic Server Component with private, no-store behavior.
- Exactly one `h1`.
- No cart token, database cart ID, token hash, secret or internal error in HTML,
  JSON, logs, analytics, metadata, or client props.
- When `COMMERCE_GUEST_CART_ENABLED` is not exactly `true`, fail closed before
  cart persistence access.
- Do not add Cart to desktop or mobile global navigation in this slice.
- Metadata is `noindex, nofollow`; no cart contents enter canonical metadata.

## Information architecture

1. Global header.
2. Cart heading and purchase-intent note.
3. Aggregate unavailable-line notice when applicable.
4. Available cart-line list.
5. Current catalog estimate.
6. Checkout-preparing boundary and Shop action.
7. Empty/unavailable feedback.
8. Global footer.

## Presentation contract

The page consumes a server-normalized view. Proposed shape:

```ts
type CartPageView = Readonly<{
  state: "ready" | "empty" | "unavailable";
  currency: "USD";
  expiresAt?: string;
  lines: readonly CartPageLine[];
  unavailableLineCount: number;
  subtotalMinor?: number;
  subtotalLabel?: string;
  estimateStatus: "complete" | "incomplete" | "unavailable";
}>;

type CartPageLine = Readonly<{
  productId: string;
  variantId: string | null;
  slug: string;
  title: string;
  variantLabel?: string;
  requestedQuantity: number;
  unitPriceMinor?: number;
  unitPriceLabel?: string;
  lineEstimateMinor?: number;
  lineEstimateLabel?: string;
  media: ApprovedCatalogMedia | TruthfulMediaFallback;
}>;
```

The exact implementation may refine names but must preserve the trust boundary.

## Data authority and enrichment

The existing cart API owns only:
- `productId`;
- nullable `variantId`;
- `requestedQuantity` from 1 through 99;
- `currency` and expiry;
- aggregate `unavailableLineCount`.

A new server-only presentation adapter must batch-read the current published
catalog for all returned identities and validate its payload. It may expose only
the fields needed by the page: slug, name, selected active variant label,
current USD price, and primary approved media.

Requirements:
- no browser-held Supabase secret;
- no per-line request waterfall;
- no fixture fallback represented as a live cart product;
- missing or malformed catalog rows fail closed for that presentation line;
- an incomplete price set yields no subtotal rather than a partial subtotal;
- use checked integer arithmetic and reject values outside safe integer bounds;
- never persist presentation price/media/name into the cart as authority.

## State matrix

| State | Required behavior | Forbidden behavior |
|---|---|---|
| Runtime disabled | Truthful unavailable state or route-level not-found decision from implementation plan | Persistence access or configuration detail |
| No valid cookie/cart | Empty state and Shop link | Automatic cart creation on page view |
| Empty cart | Empty state and Shop/Archive navigation | Fake checkout CTA |
| Ready | Current lines, quantities and complete estimate when possible | Stock or reservation claim |
| Some stale lines | Aggregate notice plus valid lines | Stale title/media inference |
| Catalog enrichment failure | Preserve safe page shell and mark unavailable/incomplete | Fixture data presented as authoritative |
| Mutation pending | Disable only the affected line actions and announce progress | Double submission |
| Mutation conflict | Preserve last confirmed view, explain current unavailability, refresh/retry path | Optimistic success claim |
| Rate limited/service unavailable | Generic retry-later feedback | Internal limiter/service detail |

## Quantity and removal behavior

- Allowed quantity: integer 1–99, matching the existing request contract.
- Controls must be labeled with the corresponding product name.
- A mutation sends only the existing strict POST action schema and required
  same-origin headers.
- UI updates only from the confirmed response or a subsequent confirmed read.
- Setting a line to zero is not supported; removal uses `remove_line`.
- Failures retain the last confirmed quantity.

## Estimate contract

- Currency is USD only after the approved `CART-USD-01` amendment.
- `subtotalMinor` is the checked sum of current unit minor values multiplied by
  confirmed requested quantities.
- Show subtotal only if every visible line has a valid current USD price.
- Do not calculate shipping, tax, discount, deposit or a final total.
- Include copy that checkout will validate price and availability again.
- Client formatting may mirror the server label but is not transactional
  authority.

## Unavailable-line contract

The current service returns only a count after filtering unavailable selections.
The page may therefore show an aggregate notice, but may not name, price or
individually mutate those rows.

Returning unavailable identities, bulk cleanup, or automatic deletion changes
the service/privacy contract and requires a separately reviewed slice.

## Account and identity behavior

- Guest cart review does not require login.
- Cart ownership remains the opaque `HttpOnly` cookie or the existing trusted
  customer attachment after a verified merge.
- Email and user metadata are never cart authorization keys.
- The page does not describe internal merge outcomes.
- Saved addresses and order history are not loaded by Cart.

## Responsive and accessibility requirements

- Semantic `main`, headings, list structure, buttons and status regions.
- Visible keyboard focus and no pointer-only action.
- Quantity controls and remove actions have unique accessible names.
- Mutation feedback uses a polite live region; urgent system failures may use
  an alert.
- Media has approved alt text or an intentionally empty alt when decorative.
- 390px, 768px and 1440px layouts must not horizontally overflow.
- Touch targets meet the 44px minimum.
- Reduced motion preserves all content and controls.

## Security, privacy and caching

- Reuse the existing strict POST-only `/api/cart` boundary for mutations.
- Keep origin, content type, custom header, source identity and durable rate
  limiting requirements unchanged.
- Cart responses and route rendering are private and no-store.
- Do not put cart state into URLs, search parameters, local storage, public
  caches or analytics payloads.
- Generic public failures only; server logs must exclude cookie/token/content.

## Validation gate

Before any merge:
- behavior tests for presentation normalization, checked estimates and failure
  states;
- route tests for private/no-store, noindex, one `h1`, disabled runtime and no
  automatic cart creation;
- interaction tests for update/remove, pending and failure behavior;
- security assertions for token/secret/log/cache boundaries;
- 390px, 768px and 1440px browser review;
- keyboard, focus, live-region and reduced-motion review;
- `npm run check`;
- exact-source deployment verification only after separate push approval.

## Approval gate

Implementation is blocked until the owner approves:

`CART-UI-01`

That approval authorizes only the default-off UI and server presentation
adapter described here. It does not authorize runtime activation, Production
cart creation, global navigation, checkout, payment, order or ERP behavior.

## Implementation note

`CART-UI-01` was approved on 2026-09-19. The implemented first slice resolves
the opaque guest-cart cookie only. An authenticated customer-attached cart needs
a separately reviewed read/mutation path before Customer Auth, merge and Cart
can be enabled together; email is not used as a shortcut for ownership.

That follow-up is now drafted in
`customer-cart-boundary-specification.md` and remains blocked on
`CART-CUSTOMER-BOUNDARY-01`. The draft adds no runtime, SQL or Production
authority.
