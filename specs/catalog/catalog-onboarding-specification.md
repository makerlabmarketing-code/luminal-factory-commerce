# Catalog Onboarding Specification

## Document metadata

- **Status:** `COMPLETED_EXISTING_PRODUCTION_VALIDATED`
- **Original date:** 2026-09-20
- **Production execution:** 2026-09-21
- **Revalidation:** 2026-09-24
- **Application:** Luminal Factory Commerce
- **Database:** `bkmbhcfokobmhfzgsfzh`
- **Live data gate:** `CATALOG-PROD-ONBOARDING-01`
- **Runtime state:** Commerce Cart/Auth runtime remains disabled

## Purpose

Record the first permanent published Commerce catalog object and its public
presentation boundary.

This catalog entry is an **artisan keycap**. Luminal Factory's business rule is
that artisan keycaps are sold through the raffle flow, not through Cart.
Publishing a keycap in the public catalog does not make it Cart-eligible.

## Production record

Read-only verification on 2026-09-24 confirms the transaction had already been
executed on 2026-09-21. Do not execute the onboarding transaction again.

| Field | Production value |
| --- | --- |
| Product ID | `4717c1b7-1bd1-45a6-b310-a116c60fe8bc` |
| Product name | `Meowhe Lolipop` |
| Slug | `meowhe-lolipop` |
| Product type | `artisan_keycap` |
| Description | `Meowhe Lolipop is the first colorway of the Meowhe artisan keycap, combining a candy-inspired palette with mismatched eyes and a mischievous grin. Originally introduced during the Lazy Factory chapter, it returns as part of Luminal Factory’s revival.` |
| Release type | `direct` |
| Status | `published` |
| Variant ID | `7f8dfd08-f4ca-485d-b69a-f337e19622c5` |
| Variant | `Lolipop` |
| SKU | `LF-MEOWHE-LOLIPOP-01` |
| Price ID | `26ee2912-b5f4-4c4e-b3dd-02693aa399a1` |
| Currency | `USD` |
| Price | `7000` minor units = `$70.00` |
| Media ID | `2a334d13-925e-4524-8e4d-6ee86089b23c` |
| Media path | `/images/home/gallery/lolipop-candy-stones.webp` |
| Media alt | `Meowhe Lolipop artisan keycap photographed on pastel candy stones` |
| Published at | `2026-09-21T07:26:35.468166Z` |

A separate draft product, `raffle-flow-test-object`, exists only for raffle
flow testing and is not public catalog content.

## Validation evidence — 2026-09-24

- Production has exactly one published Meowhe Lolipop product, one matching
  active variant, one active USD price and one primary media row.
- `/shop` publicly renders Meowhe Lolipop at $70.
- `/shop/meowhe-lolipop` returns HTTP 200.
- Customers, carts, cart items, inventory, orders, payments and refunds remain
  zero-row.
- Catalog RLS continues to expose only published products and their active
  variants/prices/media.
- Vercel reported no runtime error for Shop/Cart/Account routes in the
  postflight window.
- Supabase advisors produced no new catalog-specific warning/error.

## Cart / raffle boundary

- `artisan_keycap` is raffle-only.
- Guest Cart and verified Customer Cart must reject `artisan_keycap`.
- A future `CART-INTEGRATED-SMOKE-01` requires an approved published
  non-keycap toy / 3D model product.
- Meowhe Lolipop must not be used as the Cart smoke fixture.
- Checkout/order/payment work remains outside this catalog gate.

## Safety note

The 2026-09-24 approval of `CATALOG-PROD-ONBOARDING-01` was treated as a
reconfirmation after preflight discovered the already-existing 2026-09-21
Production row. No duplicate insert or content mutation was performed.

Any future content change to Meowhe Lolipop requires a new targeted approval;
do not reuse this onboarding gate for updates.
