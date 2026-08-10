# Phase 5 Catalog Adapter Technical Plan

## Metadata
- Date: 2026-08-10
- Base commit: `90bb028bbbb5b0fbc6a21759b646921d4e9bad34`
- Branch: `feat/catalog-supabase-adapter`
- Commerce Supabase project: `bkmbhcfokobmhfzgsfzh`
- Database mode: read-only

## Objective
Move Shop listing/detail reads behind a server-side Commerce catalog adapter while preserving a truthful fallback when deployment configuration is missing or the Data API is temporarily unavailable.

## Configuration
The adapter reads:
- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY`

`NEXT_PUBLIC_SUPABASE_ANON_KEY` remains a temporary legacy fallback during configuration migration, but new setup uses the modern publishable key.

No secret/service-role key is required or permitted for Phase 5 public catalog reads.

## Read boundary
The adapter may select only public catalog fields from:
- `products`
- `product_prices`
- `product_media`

It must not query:
- `inventory_items`
- `customers`
- `orders`
- `order_items`
- `payments`
- `refunds`
- `commerce_events`

RLS remains the final authorization boundary.

## Fallback semantics
- Missing Supabase configuration: render the existing curated presentation fixtures and mark the source as `fixture-fallback`.
- Configured API request failure: render the existing fixtures and mark the source as `fixture-fallback`.
- Successful API response with zero published products: return an empty catalog so the Shop empty state is truthful.
- Successful API response with published products: map them to Shop presentation entries and mark the source as `commerce-catalog`.

## Product mapping
- Product `slug`, `name`, `description`, `product_type`, and `release_type` become public Shop fields.
- The first active/public price is presentation-only pricing information, not a checkout promise.
- Media records are used only when the stored path is directly renderable by the existing presentation layer; otherwise the existing internal placeholder remains visible.
- No stock quantity is exposed.
- No purchase controls are introduced.

## Detail behavior
`/shop/[slug]` first asks the live catalog adapter for the slug. If configuration/data is unavailable, it may resolve the existing curated fixture slug. Unknown slugs continue to use `notFound()`.

## Validation gate
1. Source-level tests cover configuration, REST request boundaries, zero-row semantics, failure fallback and forbidden-table absence.
2. GitHub `quality` passes on exact head.
3. Vercel Preview reaches READY on exact head.
4. Commerce DB remains read-only during Phase 5 adapter implementation.
5. No ERP mutation.
6. No raffle persistence/backend.
