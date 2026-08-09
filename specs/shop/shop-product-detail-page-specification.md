# Shop Product Detail Page Specification

## Document metadata

- Status: `DRAFT` / `REVIEW_REQUIRED`
- Date: 2026-08-09
- Implementation status: `BLOCKED_PENDING_OWNER_APPROVAL`
- Database status: `NOT_APPLICABLE_NO_DATA_CHANGE`
- Source experience script: `docs/page-scripts/shop-product-detail-experience-script-draft.md`

This specification defines the bounded static `/shop/[slug]` product-detail foundation. It does not authorize live catalog, inventory, cart, checkout, payment, order, Supabase, or ERP changes.

## Page purpose

`/shop/[slug]` is the focused public detail surface for a directly purchasable or potentially directly purchasable Luminal Factory collectible. The first slice is editorial/presentation-only and must not imply a live transactional state.

Primary user outcome: understand the object, its collection/material/craft context, and its truthful current availability state.

## Information architecture

1. Global header.
2. Product identity + dominant media hero.
3. Availability/status block.
4. Object story and craft/material notes.
5. Product facts.
6. Supporting media/gallery.
7. Direct-purchase boundary notice in the first static slice.
8. Related discovery/back-to-Shop bridge.
9. Global footer.

## Route scope

Approved implementation target, once owner review is complete:

- `/shop/[slug]`

First implementation may expose detail pages for the three current curated placeholder entries by converting their `presentationKey` values to stable public slugs or introducing explicit `slug` fields.

Do not treat internal IDs as permanent public URLs by accident.

## Presentation contract

Suggested type:

- `slug: string`
- `title: string`
- `collection: string`
- `type: string`
- `summary: string`
- `story: string`
- `materialNote: string`
- `craftNotes: readonly string[]`
- `facts: readonly { label: string; value: string }[]`
- `media: readonly PresentationMedia[]`
- `presentationStatus: "detail-only" | "coming-soon" | "unavailable" | "archived"`
- `availabilityLabel: string`
- `isPlaceholder: boolean`

The existing `ShopPresentationEntry` may be evolved carefully so list and detail views share one typed source where useful. Avoid creating a second conflicting object model for the same presentation-only data.

## First-slice behavior

For current placeholder entries:
- product detail route resolves from static typed content
- no remote loading state
- no Supabase access
- no price
- no stock quantity
- no purchase CTA
- no variant/SKU selector
- no cart or checkout
- placeholder status remains explicit in media metadata and page copy

Missing slug:
- use Next.js `notFound()` rather than silently falling back to another item

## Availability behavior

`detail-only`:
- object can be explored but purchasing is not enabled

`coming-soon`:
- future direct availability may be intended but no date/price is promised

`unavailable`:
- object is not currently offered for direct purchase

`archived`:
- historical product detail only; may bridge to Archive

Do not add `in-stock` or `sold-out` until inventory authority exists.

## Media/gallery

- Use approved `next/image` patterns already present in the repo.
- First media item is the hero image.
- Additional media may render in a simple accessible gallery/grid.
- No carousel dependency is required for the first slice.
- Placeholder media must preserve `productionApproved: false` / internal-source semantics.
- Image failure should degrade to text-first product context and an approved placeholder/fallback.

## SEO/metadata

- Generate truthful metadata per slug from the static presentation source.
- Placeholder pages must not publish invented product claims.
- Preview/non-production indexing follows the repository's existing environment metadata behavior.

## Responsive/accessibility

- Exactly one `h1`.
- Semantic `main` and sections.
- Status understandable without color alone.
- Product facts use semantic lists or definition structures.
- Keyboard focus visible.
- No hover-only essential interaction.
- Mobile first viewport prioritizes product identity, dominant media, availability, and back navigation.
- Reduced motion must preserve all content/navigation.

## Architecture

Suggested files:

- `src/app/shop/[slug]/page.tsx`
- evolve `src/features/shop/shop-content.ts`
- `src/features/shop/shop-product-detail.tsx`

The route should remain a thin Server Component.

Suggested content API:
- `getShopEntryBySlug(slug)`
- `getCuratedShopEntries()` remains for index

If static paths are generated, use the same typed content source and avoid duplicated slug lists.

## Index integration

After detail route verification:
- update Shop cards from `/shop#...` anchors to `/shop/[slug]`
- preserve card hierarchy and existing presentation-only status
- no transaction controls on index cards

## Validation

Before merge of the implementation slice:
- `npm run lint`
- `npm run typecheck`
- `npm test`
- `npm run build`
- `npm run check` if defined
- Vercel Preview READY
- at least one placeholder `/shop/[slug]` route returns 200
- invalid slug resolves to 404/not-found
- Shop cards navigate to real detail routes
- exactly one h1 on detail page
- no Supabase/catalog/inventory/cart/checkout/payment/order code introduced
- database gate remains `NOT_APPLICABLE_NO_DATA_CHANGE`

## Future transactional gate

A later direct-purchase slice requires a separate approved specification covering at minimum:
- dedicated commerce Supabase project or other authoritative catalog service
- product/variant/SKU model
- price/currency contract
- inventory authority and reservation semantics
- cart model
- checkout/payment provider
- order idempotency and lifecycle
- customer/guest checkout identity decision
- tax/shipping behavior
- refund/cancellation rules
- RLS/server boundaries and migration plan
- ERP integration boundary if any

## Non-goals

- Live product database.
- Price.
- Inventory.
- SKU/variant selection.
- Add to Cart / Buy Now.
- Checkout/payment.
- Order creation.
- Customer account/auth.
- Shipping/tax calculation.
- Supabase migration.
- ERP mutation.

## Approval gate

Implementation remains blocked until owner approval of this static `/shop/[slug]` product-detail foundation. After approval, create a separate technical plan and feature branch from the latest `master`.
