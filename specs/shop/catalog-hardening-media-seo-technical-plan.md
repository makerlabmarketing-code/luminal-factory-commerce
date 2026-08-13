# Phase 5 Catalog Hardening, Media and SEO Technical Plan

## Metadata

- Date: 2026-08-11
- Base commit: `955d4f99bbd308b9dbe82192cf19dc43ac2e5771`
- Branch: `feat/catalog-hardening-media-seo`
- Commerce Supabase project: `bkmbhcfokobmhfzgsfzh`
- Database mode: read-only

## Objective

Complete the remaining safe presentation work for the Phase 5 catalog: validate the external Data API payload, render approved public catalog media with a recoverable fallback, and publish truthful canonical metadata without introducing transaction or identity behavior.

## Runtime evidence at slice start

- The Commerce project is `ACTIVE_HEALTHY`.
- All eleven Commerce tables have RLS enabled.
- The live database contains zero published products, zero published media records and zero active published prices.
- No Storage bucket exists yet.
- This slice must not create a bucket, seed a product, mutate the schema, or modify ERP.

## Data boundary

- Continue selecting only published `products` with public `product_prices` and `product_media` relations.
- Parse every Data API response as unknown and validate it with Zod before mapping.
- A malformed or failed response follows the existing curated fallback path.
- A successful empty response remains authoritative and renders the empty state.
- Inventory, customers, orders, order items, payments, refunds, events and raffles remain outside the adapter.

## Media boundary

- Local root-relative paths are allowed, excluding protocol-relative paths.
- Remote media is allowed only over HTTPS, from the configured Commerce Supabase origin, and below `/storage/v1/object/public/`.
- Bare bucket paths, private Storage paths and arbitrary remote origins do not render.
- Catalog images use `next/image`; catalog video uses a muted, user-controlled, inline player without autoplay.
- Media load failure returns to the existing labeled Luminal placeholder instead of leaving a broken frame.
- `next.config.ts` derives the exact Supabase hostname from the configured public project URL and restricts optimization to the public Storage path.

## Metadata boundary

- `/shop` is the canonical listing URL.
- Search, filter and pagination URLs remain functional but are `noindex,follow` to avoid indexing duplicate result combinations.
- Product detail pages use their stable catalog slug as canonical.
- A valid catalog image may be used in product Open Graph metadata; fixtures and invalid media do not claim a production social image.
- Missing product slugs remain noindex and resolve through the existing not-found behavior.
- Detail reads are request-memoized so metadata and page composition do not duplicate the same catalog request.

## Validation gate

1. Focused tests cover payload validation, media origin/path restrictions, image/video fallback and metadata behavior.
2. `npm run check` passes locally.
3. `git diff --check` and secret-pattern review pass.
4. A read-only Supabase query reconfirms the catalog/public boundary.
5. GitHub `quality` passes on the exact pushed head.
6. Only one Vercel Preview attempt is used for this grouped slice; no no-op retrigger commits.
7. No Commerce database mutation and no ERP change occur.
