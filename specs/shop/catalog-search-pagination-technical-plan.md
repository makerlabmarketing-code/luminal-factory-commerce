# Phase 5 Catalog Search, Filter and Pagination Technical Plan

## Metadata
- Date: 2026-08-10
- Base commit: `da533fedc3c46ce99069b5334a0244f32713c37d`
- Branch: `feat/catalog-search-pagination`
- Commerce Supabase project: `bkmbhcfokobmhfzgsfzh`
- Database mode: read-only

## Objective
Extend the server-first Shop catalog adapter with URL-driven search, schema-backed filters and bounded pagination without introducing client-side commerce state or transactional behavior.

## Query contract
`/shop` accepts these optional GET parameters:
- `q`: trimmed text query, maximum 80 characters.
- `type`: one of `artisan_keycap`, `collectible_object`, `custom_object`, `other`.
- `release`: one of `direct`, `preorder`, `informational`.
- `page`: positive integer, clamped to a safe upper bound.

Unknown values are ignored instead of being passed through to PostgREST.

## Read behavior
- Page size: 12 products.
- Request `pageSize + 1` rows to derive `hasNextPage` without a count query.
- Published-product RLS remains the final visibility boundary.
- Search matches public product `name` or `description` only.
- Filters apply only to the schema-constrained public fields `product_type` and `release_type`.
- Sort order remains newest published first.

## Fallback semantics
If Commerce Supabase configuration is missing or the Data API request fails, use the existing curated fixture fallback. Query parameters may filter the fixture list locally for continuity, but the source remains explicitly `fixture-fallback`.

A successful live API response with zero rows is authoritative and must remain empty.

## UI behavior
- Search/filter controls use a normal GET form so state is represented in the URL and works without client JavaScript.
- Reset links to `/shop`.
- Pagination uses plain links and preserves active query/filter parameters.
- No infinite scroll.
- No cart, checkout, order, payment or inventory controls.

## Security and data boundary
The adapter continues to read only:
- `products`
- embedded public `product_prices`
- embedded public `product_media`

Forbidden in this slice:
- inventory quantities
- customers
- orders/order_items
- payments/refunds
- commerce_events
- service-role/secret keys
- ERP reads or writes
- raffle persistence/backend

## Validation gate
1. Tests cover parameter normalization, schema allowlists, PostgREST query construction, pagination and fallback behavior.
2. GitHub `quality` passes on exact head.
3. Vercel Preview reaches READY on exact head.
4. Commerce DB remains read-only.
5. ERP remains untouched.
