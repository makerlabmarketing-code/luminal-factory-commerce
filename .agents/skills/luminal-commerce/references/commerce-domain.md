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

The ERP owns winner management, administrative selection, shipping amount confirmation, payment follow-up, fulfillment tracking, cancellation and manual reallocation.

The storefront may:

- show customer winner status
- show payment deadline
- show approved public results
- expose only the customer-facing payment or fulfillment surfaces explicitly approved for a release

The storefront must not expose privileged winner selection capabilities.

Winner allocation is separate from the raffle entry and from the raffle event lifecycle. The first approved operational direction uses these conceptual allocation states:

- SELECTED
- CONFIRMED
- PAYMENT_PENDING
- PAID
- FULFILLING
- COMPLETED
- CANCELLED
- REALLOCATED

A cancelled or reallocated winner relationship must preserve history rather than rewriting the original entry.

Automatic payment expiry and fallback-winner selection are deferred for the initial low-volume workflow; ERP staff may perform those transitions manually with audit history.

## Payment

Payments represent financial transactions.

For the first raffle fulfillment workflow, ERP may send payment instructions and staff may manually verify receipt. Sending a winner email or payment instruction does not mean payment succeeded.

A winner amount due is conceptually:

    product amount
    + explicit shipping charge
    = amount due

Do not overwrite catalog product price to absorb shipping.

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

The winner-to-order transition must be explicit and trusted. The resulting fulfillment obligation must preserve linkage to the raffle, original entry, winner allocation, selected product/variant and authoritative payment context.

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

Permanent customer ownership is established by a verified authentication subject, not by email text alone. A guest cart may later attach to a permanent customer through an explicit, trusted and idempotent transition.

A cart represents purchase intent. It is not an order, payment, stock reservation or authoritative price record.

The approved guest-email raffle identity remains independent: an email match must not silently attach a raffle entry to a customer account.

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

## Raffle ERP Fulfillment Contract

The approved business-flow specification for winner operations, shipping, email, payment confirmation, fulfillment and manual reallocation is:

    specs/raffle/raffle-winner-erp-fulfillment-specification.md

ERP remains the operational owner. Commerce remains the owner of public raffle experience and the final privileged Commerce mutation boundary.

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
