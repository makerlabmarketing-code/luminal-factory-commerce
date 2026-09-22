# Raffle Winner → ERP Fulfillment Specification

## Document metadata

- Status: `BUSINESS_FLOW_APPROVED` / `IMPLEMENTATION_GATE_PENDING`
- Date: 2026-09-22
- Owner direction: prioritize Raffle end-to-end before direct-sale Cart
- Production gate: `RAFFLE-ERP-LIFECYCLE-01`

This document defines the business and system boundary from a valid raffle entry through ERP winner operations, customer notification, payment confirmation and fulfillment. It does not authorize Production schema changes, live email delivery or ERP→Commerce activation.

## Product direction

Luminal Factory is raffle-first for artisan keycaps.

Artisan keycaps are not direct-cart products by default. Direct Cart remains for normal in-stock objects such as future 3D toys/models unless a release explicitly uses another approved sale type.

## End-to-end flow

```text
Commerce Raffle
  -> customer submits guest entry form
  -> trusted Commerce boundary validates and persists entry
  -> ERP reads/manages operational raffle data through Commerce Admin API
  -> raffle closes
  -> ERP staff selects and confirms winner
  -> approved public result becomes visible on Commerce
  -> ERP calculates product total + shipping charge
  -> ERP sends winner notification + payment instruction/reference
  -> staff verifies received payment
  -> ERP confirms payment/order fulfillment state
  -> ERP sends payment-success + fulfillment/deadline email
  -> staff fulfills and completes the raffle winner order
```

When a selected winner does not complete payment within the configured deadline, staff may cancel that allocation and manually reallocate to another eligible entry. Automatic expiry/reallocation is deferred until traffic and operational volume justify it.

## System ownership

### Commerce owns

- public raffle discovery and detail
- release media and product presentation
- public rules, timing and availability state
- guest raffle entry boundary
- authoritative persisted raffle/entry state in the Commerce backend
- public approved result presentation
- Commerce Admin API used by ERP
- final authorization and validation of privileged Commerce mutations

### ERP owns

- operational entry review
- customer/contact workbench for raffle operations
- winner selection and confirmation
- shipping quote/charge input
- payment instruction workflow
- manual payment verification
- fulfillment tracking
- cancellation and manual reallocation
- operational email actions and audit trail

ERP browser code must not mutate the Commerce database directly. Privileged requests must go ERP server -> signed Commerce Admin API -> Commerce trusted service -> Commerce database.

## Entry and customer data

A raffle entry remains guest-email based for the first release.

Minimum entry data:

- raffle
- normalized contact email
- display/name
- accepted rules/privacy version
- submitted timestamp
- public acknowledgement/reference where applicable

Release-specific forms may collect shipping-related information only when explicitly approved and necessary. Do not collect extra PII solely for future convenience.

An email match must not silently attach a raffle entry to an authenticated customer account.

## Operational winner allocation

Winner selection must be represented separately from the entry itself.

Conceptual allocation lifecycle:

- `SELECTED`
- `CONFIRMED`
- `PAYMENT_PENDING`
- `PAID`
- `FULFILLING`
- `COMPLETED`
- `CANCELLED`
- `REALLOCATED`

This is an operational winner-allocation lifecycle, not a replacement for the raffle event lifecycle.

Rules:

- unsuccessful entries never become orders
- selecting a winner does not itself recognize revenue
- one allocation may be cancelled without deleting the original entry
- reallocation must preserve history of the prior allocation
- ERP staff identity and timestamps must be auditable for privileged transitions

## Public result contract

Commerce may show raffle results only after ERP/Commerce operational confirmation.

Public result must not expose raw customer PII.

Preferred public identifiers:

- public entry reference
- winner code
- intentionally masked display name

Do not publish full email, phone, address, internal notes or payment information.

## Shipping and payable amount

The payment request for a confirmed winner consists conceptually of:

```text
product amount
+ approved shipping charge
= amount due
```

Shipping charge must be explicit and auditable. Do not overwrite the product's catalog price to include shipping.

The first implementation may allow staff to enter/confirm the shipping charge manually in ERP.

## Payment model

Initial raffle payment confirmation is staff-operated.

- ERP sends a payment instruction/reference after winner confirmation.
- Customer payment is not considered successful merely because an email was sent.
- Staff verifies actual payment receipt.
- Only then may the operational state move to `PAID`.
- Revenue/accounting remains derived from authoritative payment records according to the finance contract.

A future payment-provider webhook or automated reconciliation may replace manual confirmation through a separately approved contract.

## Order creation boundary

Do not create an order for every raffle entry.

The implementation plan must define one explicit trusted transition from confirmed winner/payment workflow into an order/fulfillment obligation.

At minimum, an eventual raffle-winner order must retain linkage to:

- raffle
- original entry
- winner allocation
- selected product/variant
- product amount
- shipping amount
- payment record/reference
- customer/contact snapshot required for fulfillment

The exact moment of order creation must be finalized in the technical plan before schema migration.

## Email workflow

Operational email stages:

1. **Entry received**
   - acknowledgement only
   - no winner implication

2. **Winner confirmed / payment requested**
   - release/product
   - amount due
   - shipping amount
   - payment reference/instructions
   - payment deadline
   - support/contact information

3. **Payment confirmed / fulfillment accepted**
   - payment acknowledgement
   - fulfillment status
   - expected fulfillment or delivery deadline/window

4. **Cancellation/reallocation**
   - only when operationally necessary
   - preserve audit history

All live email sends require an approved template, environment configuration and delivery gate. Retrying a send must not accidentally duplicate operational state changes.

## ERP workbench requirements

The first ERP Raffle Ops module should provide:

- raffle list and current status
- entry count and searchable entry table
- safe customer/contact detail view
- winner allocation action
- shipping charge field
- amount-due calculation
- payment deadline
- send/re-send email action with audit state
- payment confirmation action
- fulfillment status
- cancellation and manual reallocation
- audit history of operator + timestamp + transition

Actions that materially change winner/payment/fulfillment state require server-side authorization and must not rely on UI visibility.

## Commerce public experience

Raffle presentation should behave as a digital exhibition rather than a generic ecommerce grid.

Priorities:

- strong release imagery
- product story and colorway/media
- clear raffle status and timing
- focused entry action while open
- truthful closed/drawing/result states
- historical results and product imagery after completion

Visual composition should adapt Luminal Factory's logo language through geometry, framed planes, flow, depth and controlled light rather than repeatedly stamping the logo as decoration.

Archive should preserve past products and media; upcoming releases should support prepared media before they become active raffles.

## Deferred automation

Do not automate these in the first operational release unless separately approved:

- automatic winner drawing
- automatic payment expiry
- automatic fallback winner selection
- automatic bank/payment reconciliation
- automatic fulfillment completion

Manual ERP actions are acceptable while volume is low, provided transitions are auditable and permissions are enforced.

## Implementation gate

Before `RAFFLE-ERP-LIFECYCLE-01` can be approved for execution:

1. inspect the existing raffle migration/runtime work and current Production schema
2. define winner-allocation persistence without overloading `raffle_entries`
3. lock the order-creation point
4. define ERP Admin API routes/scopes
5. define email template contracts and idempotent send records
6. define PII fields and retention/access rules
7. prepare migration + rollback plan
8. prepare ERP and Commerce implementation tasks
9. identify exact Production/runtime/email activation gates

No Production migration or live email is authorized by this specification alone.
