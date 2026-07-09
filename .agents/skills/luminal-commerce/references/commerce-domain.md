# Commerce Domain

## Ownership

This file is the authoritative owner of Luminal Factory commerce meaning: products, variants, sale types, raffle concepts, lifecycle states, raffle entries, winners, payments, orders, refunds, shipments, inventory meaning, preorder, commissions, customers, archive meaning, revenue rules, and domain change rules.

Use `supabase-contract.md` for persistence, RLS, data access, trusted enforcement, storage, schema changes, and generated database types.

## Core Principle

Luminal Factory is raffle-first artisan commerce.

The domain must model collectible objects, sales events, financial transactions, and fulfillment as distinct concerns.

Do not reduce the domain to a generic products-and-cart model.

## Product

A product represents a collectible or sellable object.

Examples:

- artisan keycap
- collectible object
- accessory
- art lamp

A product may exist independently of an active sale.

A product may later appear in:

- a raffle
- direct stock
- preorder
- archive

A product is not a raffle.

## Product Variant

A product may have variants or colorways.

Example:

    VOID SMILE
    ├── OBSIDIAN
    ├── CRYSTAL
    └── BLOOD MOON

Variant-specific data may include:

- SKU
- colorway
- media
- price
- inventory
- web 3D asset
- texture assets

Do not create multiple unrelated product records solely because a material texture differs.

## Sale Types

Supported conceptual sale types are:

- RAFFLE
- IN_STOCK
- PREORDER
- COMMISSION

These represent commerce behavior.

Do not infer sale behavior solely from stock quantity.

## Raffle

A raffle is a sales event associated with one or more eligible collectible objects according to the final schema.

A raffle may define:

- opening time
- closing time
- entry rules
- entry capacity if applicable
- winner capacity
- payment deadline
- eligibility rules
- public instructions

## Raffle Lifecycle

The current conceptual lifecycle is:

- DRAFT
- SCHEDULED
- OPEN
- CLOSED
- DRAWING
- DRAWN
- PAYMENT_PENDING
- FULFILLING
- COMPLETED
- CANCELLED

These states are conceptual until the shared domain contract is finalized.

Do not rename these states independently in the storefront.

## Raffle Entry

A raffle entry represents a customer's participation in a raffle.

An entry is not an order.

An entry does not create revenue.

An entry may later become associated with a selected winner and payment workflow.

The database must enforce the final entry uniqueness and eligibility rules.

The client UI is not the sole enforcement layer.

## Winner

Winner selection is an operational process.

The ERP should own winner management and administrative selection workflow.

The storefront may:

- show customer winner status
- show payment deadline
- allow authorized winner payment
- show public results when approved

The storefront must not expose privileged winner selection capabilities.

## Payment

Payments represent financial transactions.

Revenue must derive from successful payment transactions and refunds.

Do not manually create a primary revenue total that becomes independent from payment history.

Conceptually:

    gross paid
    - successful refunds
    = net recognized commerce inflow

Final accounting and reporting rules belong to the finance design.

## Order

An order represents a commercial fulfillment obligation.

An order may originate from:

- direct purchase
- preorder
- raffle winner purchase

A raffle entry itself is not an order.

Do not create an order for every unsuccessful raffle entry.

## Refund

A refund belongs to a financial transaction or payment relationship.

Refunds must affect derived revenue reporting.

Do not overwrite the original payment amount to represent a refund.

Preserve transaction history.

## Shipment

Shipment state is separate from payment state.

For example:

    payment succeeded
    shipment pending

is a valid combination.

Do not infer fulfillment solely from payment completion.

## Inventory

Inventory must distinguish between:

- raw material inventory
- finished product stock

The ERP may eventually own both.

The storefront should consume only the public availability state required for commerce.

Do not expose internal inventory quantities unless intentionally designed.

## In Stock

An IN_STOCK item is directly purchasable while available.

Stock enforcement must happen at a trusted server or database boundary.

The client must not be considered authoritative for remaining stock.

## Preorder

A preorder is available within a defined ordering period.

Preorder availability is time-bound.

A preorder may have:

- opening time
- closing time
- quantity cap
- estimated fulfillment period

Do not model a preorder as infinite in-stock inventory unless that is explicitly the business rule.

## Commission

A commission begins as a structured request.

A commission request may include:

- customer information
- project intent
- reference media
- expected object type
- budget context
- notes

A commission request is not immediately an order.

Operational review occurs in the ERP.

Later states may include:

- SUBMITTED
- REVIEWING
- ACCEPTED
- DECLINED
- QUOTED
- DEPOSIT_PENDING
- IN_PRODUCTION
- COMPLETED
- CANCELLED

The final lifecycle must be defined before implementation.

## Customer

A customer may:

- enter raffles
- purchase products
- submit commission requests
- manage addresses
- view eligible order and raffle information

Customer identity and ERP staff identity are different access concerns.

Do not expose ERP role logic through public customer interfaces.

## Archive

The archive is a collectible history.

It is not merely a list of sold-out products.

Archive records or public archive presentation may include:

- product
- collection
- series
- year
- sale history
- colorway
- media
- story or lore
- historical availability

The archive is part of Luminal Factory's brand memory.

## Domain Change Rule

Any change to:

- lifecycle states
- sale types
- payment semantics
- order creation rules
- raffle entry rules
- ownership boundaries

must be treated as a domain contract change.

Update the relevant documentation before or with the implementation.
