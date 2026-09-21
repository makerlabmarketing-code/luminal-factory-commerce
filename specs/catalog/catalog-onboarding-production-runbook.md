# Catalog Onboarding Production Runbook

## Metadata and authority

- **Status:** `PREPARED_APPROVAL_REQUIRED`
- **Target:** Luminal Factory Commerce project `bkmbhcfokobmhfzgsfzh`
- **Required live gate:** `CATALOG-PROD-ONBOARDING-01`
- **Expected operation:** one product, one variant, one price, one media row
- **Runtime before and after:** every Commerce and raffle flag is `false`

This runbook does not itself authorize Production writes. It may be executed
only after the owner approves the final content matrix and the live gate.

## Private operation record

Before execution, record without secrets:

- exact GitHub `master` and Vercel Production source SHA;
- product name, slug, type, description and publication decision;
- variant name and SKU;
- approved USD `amount_minor = 7000`;
- media path and alt text;
- generated product, variant, price and media IDs after commit.

Do not place service keys, tokens, cookies or other credentials in the record.

## Read-only preflight

1. Require a clean reviewed repository tree and a `READY` Production
   deployment for the recorded source.
2. Confirm every Commerce and raffle runtime flag is exactly `false`.
3. Confirm catalog counts still match the expected baseline, or stop and review
   any new row before continuing.
4. Confirm the approved slug and SKU do not already exist.
5. Confirm the local WebP exists on the deployed source and resolves with HTTP
   200. Do not upload it to `homepage-hero`.
6. Confirm existing catalog RLS policies and grants have not changed.
7. Confirm zero unexpected cart, customer, order, payment, inventory, raffle or
   Auth activity relevant to this operation.

Stop on source drift, content ambiguity, an already-used slug/SKU, missing
media, enabled runtime, unexpected catalog rows, or RLS/grant drift.

## Reviewed atomic operation

Use one transaction through the trusted database operator boundary. Substitute
only the approved content values; do not add additional rows.

```sql
begin;

with new_product as (
  insert into public.products (
    slug, name, description, product_type, status, release_type, published_at
  ) values (
    :slug, :name, :description, :product_type, 'published', 'direct', statement_timestamp()
  )
  returning id
), new_variant as (
  insert into public.product_variants (
    product_id, sku, name, attributes, is_active
  )
  select id, :sku, :variant_name, '{}'::jsonb, true
  from new_product
  returning id, product_id
), new_price as (
  insert into public.product_prices (
    product_id, variant_id, currency, amount_minor, is_active
  )
  select product_id, id, 'USD', 7000, true
  from new_variant
  returning id
), new_media as (
  insert into public.product_media (
    product_id, variant_id, media_type, storage_path, alt_text, sort_order, is_primary
  )
  select product_id, id, 'image', :media_path, :alt_text, 0, true
  from new_variant
  returning id
)
select
  (select id from new_product) as product_id,
  (select id from new_variant) as variant_id,
  (select id from new_price) as price_id,
  (select id from new_media) as media_id;

commit;
```

Run the transaction once. If it fails, roll it back and stop; do not edit live
rows interactively or retry with broadened content.

## Read-only postflight

1. Query the four recorded IDs and prove their foreign-key relationship.
2. Require exactly one active matching variant price in USD at `7000` minor
   units (`$70.00`).
3. Read through the anonymous/public API and require exactly the approved
   published fields; sensitive tables remain unavailable.
4. Check `/shop` and `/shop/:slug` for name, description, price, image, alt
   text, canonical metadata and no application console error.
5. Confirm `/cart` and `/account` still show the disabled boundary and mutation
   APIs fail closed without cookie or data change.
6. Reconfirm aggregate counts for inventory, customers, carts, orders,
   payments, refunds, raffle rows and Storage objects did not change.
7. Run database advisors and inspect Vercel runtime errors read-only.

## Exact rollback

Rollback is allowed only for the four IDs recorded by this operation. The
product foreign key cascades to its variant, price and media, so first prove all
descendants belong exclusively to the recorded product, then execute:

```sql
begin;

delete from public.products
where id = :recorded_product_id
  and slug = :recorded_slug;

-- Require exactly one deleted product row before committing.
commit;
```

After rollback, prove all four recorded IDs are absent and every aggregate
count has returned to its preflight value. Never truncate, delete by time range
or target an unrecorded product.

## Success boundary

Success means the permanent approved product is publicly readable and renders
correctly, no unrelated data changed, and every runtime flag remains false.
It does not authorize the later integrated Cart smoke or Phase 7 work.
