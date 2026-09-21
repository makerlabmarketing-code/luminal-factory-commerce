# Catalog Onboarding Specification

## Document metadata

- **Status:** `PREPARED_OWNER_INPUT_REQUIRED`
- **Date:** 2026-09-20
- **Application:** Luminal Factory Commerce
- **Database:** `bkmbhcfokobmhfzgsfzh`
- **Planning gate:** `CATALOG-ONBOARDING-01`
- **Live data gate:** `CATALOG-PROD-ONBOARDING-01`
- **Runtime state:** every Commerce and raffle runtime flag remains `false`

## Purpose

Onboard one real, owner-approved direct-shop product so the published catalog,
Shop presentation and later Phase 6 integrated cart smoke have a truthful
Production prerequisite. This is content onboarding, not a temporary test
fixture.

The first slice creates exactly:

- one published `products` row;
- one active `product_variants` row;
- one active variant-specific `product_prices` row in VND;
- one primary image `product_media` row.

It does not create inventory, orders, payments, customers, carts, raffle data,
ERP records or a new runtime surface.

## Verified Production baseline

Read-only inspection on 2026-09-20 confirmed:

| Resource | Count |
| --- | ---: |
| Products | 0 |
| Published products | 0 |
| Variants / active variants | 0 / 0 |
| Prices / active prices | 0 / 0 |
| Product media | 0 |
| Storage buckets / objects | 1 / 0 |

The only Storage bucket is the public, purpose-specific `homepage-hero`
bucket. It must not be repurposed for catalog media. The first catalog item may
use an approved root-relative WebP already shipped with the storefront; a
future Storage-backed catalog needs its own separately reviewed bucket and
upload policy.

## Required owner decisions

No Production data operation may start until all fields below are explicit.

| Field | Required decision |
| --- | --- |
| Product | Public name and stable lowercase slug |
| Product type | One of `artisan_keycap`, `collectible_object`, `custom_object`, `other` |
| Description | Final truthful storefront copy |
| Variant | Public variant name and unique SKU |
| Price | Final VND amount; VND has zero decimal minor units |
| Media | Exact approved local WebP path, alt text and crop suitability |
| Publication | Explicit approval to publish immediately |

Candidate local media already present in the reviewed storefront include
Lolipop, Mictlán and Mono archive WebPs below `/images/home/`. Their existing
Homepage approval does not silently grant catalog-product usage; the owner must
select the exact image for this product operation.

## Data contract

### Product

- `slug` matches `^[a-z0-9]+(?:-[a-z0-9]+)*$` and is permanent.
- `name` and `description` contain only approved product facts.
- `release_type = 'direct'`.
- `status = 'published'` only in the final atomic operation.
- `published_at` is the operation timestamp and is not future-dated.

### Variant

- belongs to the new product;
- has one owner-approved, unique SKU;
- `is_active = true`;
- uses an empty attributes object unless a reviewed attribute is required.

### Price

- belongs to both the new product and its one active variant;
- `currency = 'VND'`;
- `amount_minor` equals the approved whole-VND amount;
- `is_active = true`, with no end date;
- is the only active price for this product/variant.

### Media

- belongs to the product and may be variant-specific;
- `media_type = 'image'`;
- `storage_path` is one approved root-relative local WebP path for this first
  slice;
- includes truthful alt text;
- `sort_order = 0` and `is_primary = true`;
- does not introduce a Drive URL or arbitrary remote origin.

## Public and server boundaries

- Existing public grants and RLS remain unchanged: browser roles may read only
  published products, active variants, current active prices and their media.
- Inserts use the existing trusted operator/service boundary only; no browser
  write policy or grant is added.
- The Shop and Cart adapters continue validating the public response as
  untrusted input.
- The Cart line must resolve exactly one price whose `variant_id` equals the
  selected variant; otherwise its estimate correctly remains incomplete.
- Publication does not enable Add to Cart, Auth, merge, customer Cart, raffle,
  checkout, inventory or payment runtime.

## Acceptance criteria

1. The exact owner-approved values are recorded before mutation.
2. One transaction inserts the four reviewed rows and returns their IDs.
3. Anonymous read sees exactly one published direct product, its active
   variant, one matching VND price and one primary image.
4. `/shop` and the product detail route render the approved facts and image
   without falling back to fixture content.
5. `/cart`, `/account` and all mutation routes remain disabled.
6. No other Commerce, raffle, Auth, Storage or ERP row changes.
7. Rollback can target the one recorded product ID and its descendants.

## Gate sequence

1. `CATALOG-ONBOARDING-01` approves this plan and preparation only.
2. The owner supplies and approves the final content matrix.
3. `CATALOG-PROD-ONBOARDING-01` separately authorizes the exact four-row
   Production transaction and its exact rollback if required.
4. A separately approved push/deploy is needed only if selected media is not
   already present on the deployed source.
5. After read-only storefront validation, `CART-INTEGRATED-SMOKE-01` remains a
   distinct live approval for temporary flag activation, OTP and cart writes.

