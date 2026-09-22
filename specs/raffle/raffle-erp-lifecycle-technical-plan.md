# Raffle ERP Lifecycle Technical Plan

## Status

- Prepared: 2026-09-22
- Business flow: approved
- Production data/schema writes: not authorized
- Runtime/email activation: not authorized
- Execution gate: `RAFFLE-ERP-LIFECYCLE-01`
- Shipping-data decision: `OPTION_B_FULL_ADDRESS_AT_ENTRY_APPROVED_2026-09-22`
- Remaining Production gate: schema/API implementation approval

## Current Production facts

Read-only Production inspection on 2026-09-22 confirms:

- migration `20260918063545_create_raffle_entry_foundation` is applied
- `public.raffles`: 0 rows
- `public.raffle_entries`: 0 rows
- raffle guest-entry rate-limit persistence exists
- `submit_guest_raffle_entry` exists
- published-raffle public SELECT policy exists
- raffle-entry browser enumeration remains denied
- `orders`, `order_items`, `payments` already exist and currently contain 0 rows
- `orders` already models subtotal, shipping, tax and grand total
- order statuses are `pending | confirmed | cancelled | fulfilled`
- payment statuses are `pending | authorized | succeeded | failed | cancelled`

The existing order/payment schema can be reused. Do not create a parallel raffle-order table.

## Recommended domain seam

Add one dedicated winner-allocation relation instead of placing winner/payment fields on `raffle_entries`.

Conceptual relation:

```text
raffle_winner_allocations
- id uuid pk
- raffle_id uuid fk -> raffles
- raffle_entry_id uuid fk -> raffle_entries
- allocation_sequence integer
- status text
- payment_deadline_at timestamptz
- fulfillment_due_at timestamptz nullable
- order_id uuid nullable unique fk -> orders
- selected_at timestamptz
- confirmed_at timestamptz nullable
- cancelled_at timestamptz nullable
- completed_at timestamptz nullable
- cancellation_reason text nullable
- created_at / updated_at
```

Allocation states:

```text
SELECTED
CONFIRMED
PAYMENT_PENDING
PAID
FULFILLING
COMPLETED
CANCELLED
REALLOCATED
```

Constraints to review before migration:

- one allocation sequence number per raffle
- one allocation per raffle entry
- linked order may belong to only one allocation
- payment deadline required from `PAYMENT_PENDING` onward until paid/cancelled
- cancelled allocation keeps its original entry and audit history
- reallocation creates a new allocation for another entry rather than rewriting the previous winner

## Order creation point

Recommended first-release behavior:

1. ERP selects an eligible entry -> allocation `SELECTED`
2. ERP confirms winner and shipping amount
3. Commerce trusted operation atomically creates:
   - allocation transition to `PAYMENT_PENDING`
   - one `orders` row with status `pending`
   - one `order_items` snapshot
   - one manual payment row with status `pending`
4. ERP receives the resulting order number/amount due
5. ERP sends the winner payment email
6. Staff verifies the transfer
7. Commerce trusted operation atomically marks payment `succeeded`, order `confirmed`, allocation `PAID`
8. ERP sends the payment-confirmed / fulfillment email
9. Staff moves allocation/order through fulfillment
10. completion sets order `fulfilled` and allocation `COMPLETED`

This creates orders only for confirmed winners, never for ordinary raffle entries.

## Manual payment provider

First release may use an explicit manual provider identifier such as:

```text
manual_bank_transfer
```

The payment row must still be an authoritative financial record.

Staff verification must be a privileged Commerce mutation, not a browser-only visual toggle.

A successful payment confirmation should record:

- actor
- timestamp
- payment reference/note where approved
- amount and currency
- source allocation/order
- idempotency key

Do not store bank credentials or sensitive secrets in Commerce rows.

## ERP -> Commerce Admin API

Extend the existing `lfc-hmac-v1` boundary. Proposed least-privilege scopes:

```text
commerce.raffle.read
commerce.raffle.entry.read
commerce.raffle.winner.manage
commerce.raffle.payment.manage
commerce.raffle.fulfillment.manage
commerce.raffle.result.publish
```

Proposed route family:

```text
GET  /api/admin/v1/raffles
GET  /api/admin/v1/raffles/{raffleId}
GET  /api/admin/v1/raffles/{raffleId}/entries

POST /api/admin/v1/raffles/{raffleId}/winner-allocations
POST /api/admin/v1/raffles/{raffleId}/winner-allocations/{allocationId}/confirm
POST /api/admin/v1/raffles/{raffleId}/winner-allocations/{allocationId}/confirm-payment
POST /api/admin/v1/raffles/{raffleId}/winner-allocations/{allocationId}/cancel
POST /api/admin/v1/raffles/{raffleId}/winner-allocations/{allocationId}/fulfillment
POST /api/admin/v1/raffles/{raffleId}/results/publish
```

The final route set should stay narrow. Do not expose a generic CRUD surface.

Each mutation requires:

- ERP authenticated actor + permission
- HMAC signed server request
- exact Commerce scope
- replay protection
- operation idempotency
- Commerce-side state transition validation
- audit record
- bounded response without unrelated PII

## ERP permissions

Recommended new ERP capabilities:

```text
COMMERCE_RAFFLE_VIEW
COMMERCE_RAFFLE_ENTRY_VIEW
COMMERCE_RAFFLE_WINNER_MANAGE
COMMERCE_RAFFLE_PAYMENT_CONFIRM
COMMERCE_RAFFLE_FULFILLMENT_MANAGE
COMMERCE_RAFFLE_RESULT_PUBLISH
```

Owner/admin may receive the full set. Staff must not gain winner/payment capabilities merely because they can view entries.

## ERP email integration

The ERP repository already contains a server-only SMTP/template service and `email_history`.

Use ERP as the operator-facing sender, matching the approved business flow.

Proposed template groups:

```text
RAFFLE_ENTRY_RECEIVED
RAFFLE_WINNER_PAYMENT_REQUEST
RAFFLE_PAYMENT_CONFIRMED
RAFFLE_ALLOCATION_CANCELLED
```

Email sequence:

1. entry received acknowledgement may be Commerce-triggered or ERP-triggered only after an approved ownership decision; do not duplicate-send
2. winner payment request is initiated in ERP only after Commerce returns a successful `PAYMENT_PENDING` transition and order number
3. payment-confirmed email is initiated only after Commerce returns successful payment/order confirmation
4. cancellation email is operator-controlled

For winner/payment emails, ERP must render from authoritative response data rather than recomputing totals in the browser.

If SMTP delivery fails after a Commerce state transition:

- keep the authoritative Commerce state
- show delivery failure in ERP
- allow an idempotent/manual resend
- do not roll back winner/payment state merely because email delivery failed

This avoids a fragile distributed transaction between Commerce and SMTP.

## Public result

Commerce public result is published only through the privileged result-publish transition.

Expose only:

- winner code / public entry reference
- intentionally masked display identifier
- approved release/result copy

Never expose email, address, phone, payment information or ERP operator metadata.

## ERP screen proposal

One Raffle Ops workspace:

```text
Raffle list
  -> Raffle detail
      -> Overview
      -> Entries
      -> Winners
      -> Payment
      -> Fulfillment
      -> Email history
      -> Audit history
```

The main table should favor operational scanning:

- entry/winner identity
- current allocation state
- payment deadline
- amount due
- payment state
- fulfillment state
- latest email result
- next required action

Avoid separate pages for every tiny transition.

## Shipping-data decision

Owner decision on 2026-09-22: **collect the full shipping address during raffle entry**.

The implementation must isolate shipping PII from the core raffle-entry row instead of widening the public-domain entry record with address fields.

Recommended private 1:1 relation:

```text
raffle_entry_shipping_addresses
- raffle_entry_id uuid pk/fk -> raffle_entries(id)
- recipient_name text
- address_line_1 text
- address_line_2 text nullable
- city text
- state_province text
- postal_code text nullable
- country_code char(2)
- phone text nullable
- created_at / updated_at
```

Rules:

- no browser SELECT/INSERT/UPDATE grants
- created only through the trusted raffle-entry operation in the same transaction as the entry
- returned to ERP only through the privileged Commerce Admin API and only to staff with entry/customer-data permission
- never exposed in public raffle results, logs, analytics or generic error payloads
- normalize country code and trim address fields server-side
- keep phone optional at schema level until carrier requirements are locked
- winner/order creation snapshots the shipping destination required for fulfillment so later entry-PII cleanup cannot corrupt an order
- non-winner shipping PII needs a separately approved retention/deletion rule before live raffle activation

The guest-entry request fingerprint/idempotency contract must include the normalized shipping payload. A replay with the same request token but different shipping data fails closed.

## Schema/package work after gate approval

Commerce:

- migration for winner allocation
- trusted RPC/service transitions
- Admin API scopes/routes
- generated types
- tests for transition/idempotency/replay/authorization
- result-publication read model
- rollback + validation SQL
- runtime flags default false

ERP:

- Raffle Ops service adapter
- permission catalog
- server routes/actions
- Raffle Ops UI
- email template integration
- delivery failure/resend state
- tests for authorization, signing and transition handling
- runtime flag default false

## Private raffle test route

For end-to-end testing before a public raffle is listed in navigation, use an unlisted test route that is intentionally absent from menus and public discovery.

Recommended pattern:

```text
/raffle/test/{slug-or-token}
```

or a dedicated test-only route guarded by a server-side runtime flag and opaque test token.

Rules:

- not linked from header, footer, sitemap, archive, home or raffle discovery
- `noindex, nofollow`
- unavailable unless an exact server-side test flag is enabled
- require an opaque, revocable test token or equivalent server-side access check
- test raffles must be explicitly marked as test fixtures and excluded from public result/listing queries
- do not rely on route secrecy alone as authorization
- use the same trusted entry API and database rules as the real raffle so the test exercises the actual flow
- test email delivery and ERP integration remain separately gated
- test fixture cleanup must be exact and auditable

This private route is preferred over weakening the public raffle visibility contract.

## Customer data retention and loyalty

Owner direction on 2026-09-22: raffle customer/contact and shipping data may be retained beyond one raffle so Luminal can recognize repeat customers and later support loyalty/VIP benefits.

Do not make raffle-entry PII itself the permanent loyalty source of truth.

Recommended model:

```text
raffle entry
  -> operational submission snapshot

customer/contact profile
  -> reusable identity/contact/address book

customer activity / loyalty ledger
  -> future points, repeat-purchase/VIP history
```

Rules:

- the raffle entry preserves the historical submission snapshot
- reusable customer/address records must be created or linked through an explicit trusted transition
- email equality alone must not silently merge unrelated identities
- marketing/benefit eligibility must be separated from operational raffle consent
- promotional messaging requires a separate marketing preference/consent state where applicable
- loyalty points/VIP status must be derived from auditable activity, not manually overwritten totals
- address reuse should support multiple addresses and a default-address concept rather than one address column on the customer row
- public result and analytics must never expose full PII

Initial implementation may retain non-winner address data, but live activation must include a documented retention/access policy and a way to honor later correction/deletion requirements without corrupting raffle history or fulfilled orders.

## Activation sequence

1. repository implementation and tests
2. migration review
3. explicit Production migration approval
4. migration apply + read-only postflight
5. Commerce Admin API credentials/config review
6. ERP integration runtime approval
7. non-destructive read smoke
8. bounded fixture raffle + entry smoke
9. email delivery smoke
10. public result smoke
11. Production live-release approval

Raffle, ERP integration and email flags remain false until their specific activation gates pass.
