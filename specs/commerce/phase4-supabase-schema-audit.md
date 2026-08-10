# Phase 4 Supabase Schema Audit

Status: `READ_ONLY_AUDIT_COMPLETE`
Date: 2026-08-10
Supabase mutation: `NONE`
ERP mutation: `NONE`

## Purpose

Validate the currently connected Supabase schema before designing the Luminal Factory commerce persistence layer.

The target commerce chain requested for Phase 4 review is:

`products -> raffles -> customers -> orders -> order_items -> payment status`

This chain describes the business areas to cover. It does **not** mean every table should have a direct foreign key to the next table.

## Connected Supabase project

The only currently connected project is:

- Project: `Luminal Factory`
- Project ref: `kwfmfmpgpbfewpiizesv`
- PostgreSQL: 17
- Region: `ap-northeast-1`
- Current use: ERP / internal operations

Read-only inspection confirms the public schema is dominated by internal ERP concerns such as employees, attendance, finance, projects, payroll and production workflow.

## Exact table check

The following intended commerce tables do **not** currently exist in `public`:

- `products`
- `raffles`
- `customers`
- `orders`
- `order_items`
- `payments`

The following similarly named tables do exist:

- `product_categories`
- `production_orders`

They must not be mistaken for the missing commerce entities.

## Existing `product_categories`

`product_categories` is a small ERP-side category tree with:

- `id bigint`
- `name text`
- `parent_id bigint nullable`
- `created_at timestamptz nullable`

It may later become an integration reference, but Phase 4 must not assume it is the storefront catalog authority without an explicit cross-system contract.

## Existing `production_orders`

`production_orders` is an internal manufacturing/workflow entity. Its fields include production code, project linkage, product-or-collection text, colorway, planned/completed quantities, workflow stages, PM/Creative Lead employee ownership and material requirements.

It is **not** a customer commerce order and must not be renamed, reused or exposed directly as `orders`.

Required separation:

- commerce `orders` = customer purchase / commercial fulfillment obligation
- ERP `production_orders` = internal manufacturing execution

A later Phase 8 integration may connect them through an explicit handoff/reference contract.

## Recommended Phase 4 persistence boundary

Do not add the storefront commerce tables to the existing ERP Supabase project implicitly.

Recommended architecture:

1. Dedicated Supabase project for Commerce.
2. Storefront owns public/customer commerce persistence there.
3. ERP remains untouched during Commerce Phases 4-7.
4. Phase 8 introduces an explicit integration contract between Commerce and ERP instead of sharing internal tables directly.

Why this is preferred:

- avoids coupling public customer RLS to ERP staff authorization;
- isolates customer PII, orders and payment metadata from payroll/finance/attendance tables;
- reduces blast radius of storefront migrations;
- lets Commerce schema evolve before ERP handoff is finalized;
- removes ambiguity between customer `orders` and internal `production_orders`.

This recommendation conflicts with the older repository note that Storefront and ERP would eventually share one Supabase project. Updating that authoritative persistence contract is a system-wide architecture decision and should happen only after the dedicated-project decision is accepted.

## Target safe commerce entities

### `products`

Public catalog identity for sellable/collectible objects.

Minimum direction:

- `id uuid`
- `slug text unique`
- `name text`
- `description text nullable`
- `product_type text`
- `status text`
- `published_at timestamptz nullable`
- timestamps

Product price and stock should not be mixed into a single mutable product row when variant-level authority is required. Variant/media/price/inventory tables can be added in the detailed Phase 4 model.

### `raffles` — informational metadata only

A public event/presentation record may exist for the already-present informational Raffle surface.

Safe Phase 4 scope:

- `id uuid`
- `slug text unique`
- `product_id uuid nullable`
- public title/copy
- public presentation status
- optional published/open/close timestamps for display
- timestamps

Explicitly excluded:

- entries
- participant/customer linkage
- winner selection
- winner persistence
- random selection operations
- payment eligibility created from raffle participation

Therefore `raffles` has **no customer/order participation relationship in the current implementation scope**.

### `customers`

Customer identity/profile boundary, separate from ERP `employees`.

Minimum direction:

- `id uuid`
- `auth_user_id uuid unique nullable` until Phase 6 auth is enabled
- `email` handled according to the final auth/profile contract
- public/customer-safe profile fields only
- timestamps

Customer PII requires RLS and privacy review before implementation.

### `orders`

Commercial fulfillment obligation for normal commerce flows.

Minimum direction:

- `id uuid`
- `order_number text unique`
- `customer_id uuid`
- `status text`
- `currency text`
- immutable/derived monetary totals according to the final order contract
- timestamps

For the safe current roadmap, order origins should cover normal direct/preorder commerce only. Raffle participation must not be used to create orders in this implementation work.

### `order_items`

Immutable purchase-line snapshot.

Minimum direction:

- `id uuid`
- `order_id uuid`
- `product_id uuid`
- `variant_id uuid nullable`
- item name/SKU snapshot as applicable
- `quantity integer`
- unit price/currency snapshot
- timestamps

The line snapshot prevents later product edits from rewriting purchase history.

### `payments`

Authoritative payment transaction records.

Minimum direction:

- `id uuid`
- `order_id uuid`
- `provider text`
- provider transaction/reference id
- `status text`
- `amount`
- `currency`
- timestamps

Payment state must come from trusted server/provider workflows, not from the browser.

## Payment status design

Preferred rule: `payments.status` is authoritative.

Do **not** maintain an independently editable `orders.payment_status` value that can drift away from transaction history.

Expose order payment state through a derived query/view/service projection, for example conceptually:

- `UNPAID`
- `PENDING`
- `PAID`
- `PARTIALLY_REFUNDED`
- `REFUNDED`
- `FAILED`

Exact status names remain a Phase 7 payment contract decision.

## Relationship model

Recommended relationship shape:

```text
products
  ├─ product variants / media / prices / inventory (Phase 4 detailed model)
  └─ raffles (informational presentation metadata only)

customers
  └─ orders
       ├─ order_items ──> products / variants
       └─ payments
            └─ derived order payment status
```

Important: `raffles` is deliberately **not** connected to customers, entries, winners or orders in the current safe implementation scope.

## RLS direction

When the dedicated Commerce project is created:

- enable RLS on every exposed table;
- public product/raffle reads should use explicit allowlisted fields/policies;
- customer-owned rows should be scoped to authenticated customer identity;
- browser code must never receive service-role credentials;
- order/payment mutations must remain server/trusted-boundary operations;
- internal provider/payment metadata must not be exposed through public selects.

## Conclusion

The existing Supabase project does not contain the requested commerce chain and should remain an ERP database.

Phase 4 can continue with a dedicated Commerce schema design. Actual project creation and migrations remain gated because a new Supabase project changes system architecture and may introduce recurring cost.