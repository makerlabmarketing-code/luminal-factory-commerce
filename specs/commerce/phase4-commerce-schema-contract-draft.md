# Phase 4 Commerce Schema Contract Draft

Status: `DRAFT_READY_FOR_TECHNICAL_VALIDATION`
Date: 2026-08-10
Database mutation: `NONE`
Target persistence: dedicated Commerce Supabase project, pending architecture/cost gate

## Goal

Define the smallest durable schema that can support the next normal-commerce roadmap slices without coupling the storefront to ERP internals.

This contract deliberately excludes chance-based raffle participation/winner mechanics. The `raffles` entity is limited to public presentation metadata for the existing informational Raffle surface.

## Core tables

### 1. `products`

Purpose: canonical commerce object identity.

Proposed columns:

```text
id uuid primary key default gen_random_uuid()
slug text not null unique
name text not null
description text null
product_type text not null
status text not null
published_at timestamptz null
created_at timestamptz not null default now()
updated_at timestamptz not null default now()
```

Suggested `status` values for the first catalog contract:

- `DRAFT`
- `PUBLISHED`
- `ARCHIVED`

Do not infer sale availability from this field alone.

### 2. `product_variants`

Purpose: SKU/colorway/material-specific commerce identity.

```text
id uuid primary key
product_id uuid not null references products(id)
sku text null unique
slug text not null
name text not null
status text not null
created_at timestamptz not null
updated_at timestamptz not null
unique(product_id, slug)
```

### 3. `product_media`

Purpose: ordered public media references.

```text
id uuid primary key
product_id uuid not null references products(id)
variant_id uuid null references product_variants(id)
media_type text not null
storage_path text not null
alt_text text not null
sort_order integer not null default 0
is_primary boolean not null default false
created_at timestamptz not null
```

Do not place production sculpt masters/manufacturing source files in the public media contract.

### 4. `product_prices`

Purpose: explicit price history/authority instead of embedding one mutable price field in `products`.

```text
id uuid primary key
product_id uuid not null references products(id)
variant_id uuid null references product_variants(id)
currency text not null
amount_minor bigint not null
is_active boolean not null default true
valid_from timestamptz null
valid_until timestamptz null
created_at timestamptz not null
```

Use integer minor units, not floating point currency values.

### 5. `inventory_items`

Purpose: storefront finished-product availability only.

```text
id uuid primary key
product_id uuid not null references products(id)
variant_id uuid null references product_variants(id)
on_hand integer not null default 0
reserved integer not null default 0
updated_at timestamptz not null
```

Raw materials stay outside the Commerce storefront schema. Atomic reservation/stock mutation belongs to a later trusted operation.

### 6. `raffles`

Purpose: informational public event metadata only.

```text
id uuid primary key
slug text not null unique
product_id uuid null references products(id)
title text not null
summary text null
presentation_status text not null
opens_at timestamptz null
closes_at timestamptz null
published_at timestamptz null
created_at timestamptz not null
updated_at timestamptz not null
```

No entry, participant, winner, draw, eligibility or raffle-payment tables are part of this contract.

### 7. `customers`

Purpose: customer profile boundary, distinct from ERP employees.

```text
id uuid primary key
auth_user_id uuid null unique
email_normalized text null
full_name text null
created_at timestamptz not null
updated_at timestamptz not null
```

Final identity/email ownership should be revisited in Phase 6 when Supabase Auth is introduced.

### 8. `orders`

Purpose: normal customer commercial obligation.

```text
id uuid primary key
order_number text not null unique
customer_id uuid not null references customers(id)
status text not null
currency text not null
subtotal_minor bigint not null
discount_minor bigint not null default 0
shipping_minor bigint not null default 0
tax_minor bigint not null default 0
total_minor bigint not null
created_at timestamptz not null
updated_at timestamptz not null
```

Suggested first lifecycle direction:

- `DRAFT`
- `PENDING_PAYMENT`
- `CONFIRMED`
- `CANCELLED`
- `FULFILLING`
- `COMPLETED`

Final order lifecycle remains locked before checkout implementation.

### 9. `order_items`

Purpose: immutable purchase snapshots.

```text
id uuid primary key
order_id uuid not null references orders(id) on delete restrict
product_id uuid not null references products(id)
variant_id uuid null references product_variants(id)
product_name_snapshot text not null
variant_name_snapshot text null
sku_snapshot text null
quantity integer not null check (quantity > 0)
unit_price_minor bigint not null
currency text not null
line_total_minor bigint not null
created_at timestamptz not null
```

### 10. `payments`

Purpose: authoritative transaction state.

```text
id uuid primary key
order_id uuid not null references orders(id)
provider text not null
provider_reference text null
status text not null
amount_minor bigint not null
currency text not null
failure_code text null
created_at timestamptz not null
updated_at timestamptz not null
unique(provider, provider_reference)
```

Provider reference uniqueness must account for providers that do not issue a reference until later; exact constraint can be implemented as a partial unique index.

### 11. `refunds` (Phase 7-ready, can be deferred from first migration)

Purpose: preserve transaction history instead of overwriting successful payments.

```text
id uuid primary key
payment_id uuid not null references payments(id)
provider_reference text null
status text not null
amount_minor bigint not null
created_at timestamptz not null
```

## Derived payment status

Do not make a manually writable `orders.payment_status` authoritative.

Later expose `order_payment_status` as a view/service projection derived from `payments` and `refunds`.

Conceptual projection:

```text
no successful payment            -> UNPAID
payment processing               -> PENDING
successful paid total >= order   -> PAID
successful refund < paid total   -> PARTIALLY_REFUNDED
successful refund >= paid total  -> REFUNDED
latest/only attempt failed       -> FAILED (presentation context only)
```

The exact provider semantics are finalized in Phase 7.

## Foreign-key topology

```text
products
  ├── product_variants
  ├── product_media
  ├── product_prices
  ├── inventory_items
  └── raffles [public metadata only]

customers
  └── orders
       ├── order_items ──> products / product_variants
       └── payments
            └── refunds
```

There is intentionally no `raffles -> customers/orders` relationship in this safe implementation contract.

## Public read boundary

Phase 5 should not query raw tables from React components.

Recommended service contracts:

```text
getPublishedProducts()
getProductBySlug(slug)
getPublishedArchiveObjects()
getPublishedRafflePresentation()
```

Use explicit field selections or public views. Internal cost, supplier, staff, provider metadata and private notes must remain excluded.

## RLS baseline

All exposed tables must have RLS enabled before any browser/client integration.

Initial direction:

- catalog public reads: published products/media/active prices through explicit policies/views;
- raffle presentation: public read only for published informational records;
- customers/orders/order_items: customer-scoped reads only after Phase 6 identity exists;
- payments/refunds: server-mediated by default; browser access only if a narrow customer-safe view is justified;
- writes for orders/inventory/payments: trusted server/database operations, never browser-authoritative.

## Migration slicing

Recommended migration order once a dedicated Commerce project exists:

1. Catalog foundation: `products`, `product_variants`, `product_media`, `product_prices`.
2. Availability: `inventory_items`.
3. Informational Raffle metadata: `raffles` only.
4. Customer/order foundation: `customers`, `orders`, `order_items`.
5. Payment foundation: `payments`; `refunds` can wait for Phase 7.
6. RLS/policies/views.
7. Seed only approved non-production/sample catalog content.

Do not combine all phases into one giant migration.

## Architecture gate

Before migration 1 is applied, choose the persistence project.

Current recommendation: create a **dedicated Luminal Factory Commerce Supabase project** rather than adding these tables to the live ERP project `kwfmfmpgpbfewpiizesv`.

This is the next material system-wide decision. Project creation also has a Supabase recurring-cost confirmation requirement, so no project is created by this document.