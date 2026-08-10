# Phase 4 Commerce Core Schema Technical Plan

## Metadata
- Date: 2026-08-10
- Dedicated Supabase project: `Luminal Factory Commerce`
- Project ref: `bkmbhcfokobmhfzgsfzh`
- Region: `ap-northeast-1`
- Base commit: `7732ef0ce2335be4aea52d2b698e9a20dd2434e8`
- Branch: `feat/commerce-core-schema`

## Objective
Create the first versioned Commerce persistence layer without mutating the existing ERP Supabase project.

## Core entities
- `products`
- `product_variants`
- `product_media`
- `product_prices`
- `inventory_items`
- `customers`
- `orders`
- `order_items`
- `payments`
- `refunds`
- `commerce_events` outbox for future ERP financial synchronization
- `order_payment_summary` derived view

## Money model
All amounts are stored as integer minor units (`*_minor`). No floating-point money fields are allowed.

`payments.status` plus successful `refunds` are authoritative for payment state. `order_payment_summary.payment_status` is derived and must not become a separately editable payment-state column on `orders`.

## Data boundaries
- Commerce customer/order/payment data lives only in the dedicated Commerce project.
- Existing ERP project `kwfmfmpgpbfewpiizesv` is not mutated by this migration.
- ERP financial synchronization is deferred to Phase 8 and will consume idempotent Commerce events / financial projections rather than copy the full customer database.
- Raffle remains static/editorial in the storefront and is intentionally excluded from Commerce database persistence.

## RLS and grants
- RLS is enabled on every new table in `public`.
- Public read access is limited to published product/variant/media/price catalog data.
- Inventory quantities, customers, orders, order items, payments, refunds, and commerce events receive no `anon` or `authenticated` policies in Phase 4.
- Server-side privileged operations use `service_role`; no service-role secret is exposed to browser code.

## Raffle boundary
This migration contains no raffle table, entry, participant, ticket, winner, draw, selection, randomization, raffle payment, or customer-to-raffle participation persistence or functions.

## ERP integration preparation
`commerce_events` supports only ordinary commerce financial/fulfillment events in this slice:
- `order_paid`
- `payment_refunded`
- `order_cancelled`

Each event has a unique idempotency key so future ERP synchronization can retry without double-booking revenue.

## Validation gate
Before merge:
1. GitHub CI `quality` passes on the exact PR head.
2. Vercel Preview is READY on the exact PR head.
3. Migration applies successfully to `bkmbhcfokobmhfzgsfzh`.
4. Schema inspection confirms all expected tables/view exist.
5. RLS is enabled on every new table.
6. Security and performance advisors are reviewed after migration.
7. No schema changes are made to ERP project `kwfmfmpgpbfewpiizesv`.
