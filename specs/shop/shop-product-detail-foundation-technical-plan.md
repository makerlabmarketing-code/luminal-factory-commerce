# Shop Product Detail Foundation Technical Plan

## Metadata
- Date: 2026-08-09
- Owner approval: `2026-08-09`
- Source spec: `specs/shop/shop-product-detail-page-specification.md`
- Scope: static `/shop/[slug]` presentation foundation
- Database gate: `NOT_APPLICABLE_NO_DATA_CHANGE`

## Baseline
- Base branch: `master`
- Base commit: `e402291d5e91b3363edadd89afb3110afbe01252`
- Feature branch: `feat/shop-product-detail-foundation`
- Existing Shop source: `src/features/shop/shop-content.ts`

## Implementation
1. Evolve the existing typed Shop presentation source with explicit public slugs, story, craft notes, facts, truthful availability labels, and real detail hrefs.
2. Keep the three existing internal placeholder studies as the only static detail records.
3. Add `getShopEntryBySlug(slug)` and use the same source for index and detail routes.
4. Add `/shop/[slug]` as a thin Server Component with `generateStaticParams`, per-slug metadata, and `notFound()` for invalid slugs.
5. Add a reusable `ShopProductDetail` presentation component.
6. Change Shop index cards from anchor-only discovery to verified detail links.
7. Add source-level tests for route shape, slug contract, not-found handling, navigation, one-h1 semantics, and transaction/data boundaries.

## Explicit non-goals
- Supabase or any database access.
- Product price or currency.
- Inventory/stock authority.
- SKU or variant selectors.
- Add to Cart / Buy Now controls.
- Checkout/payment/order creation.
- Authentication/customer profile.
- Shipping/tax calculation.
- ERP mutation.

## Validation gate
Before merge:
- GitHub CI `quality` passes.
- Vercel Preview is `READY` for the latest PR commit.
- Vercel build output includes `/shop/[slug]` static generation.
- At least one generated placeholder slug is included in static params.
- Invalid slug path is guarded by `notFound()`.
- Shop index links use `/shop/<slug>`.
- Database gate remains `NOT_APPLICABLE_NO_DATA_CHANGE`.
