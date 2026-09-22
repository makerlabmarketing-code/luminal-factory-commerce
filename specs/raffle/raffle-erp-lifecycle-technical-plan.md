# Raffle ERP Lifecycle Technical Plan

## Status

- Prepared: 2026-09-22
- Business flow: approved
- Production data/schema writes: not authorized
- Runtime/email activation: not authorized
- Execution gate: `RAFFLE-ERP-LIFECYCLE-01`
- Blocking business decision: shipping-data collection point

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

This is the only business decision that blocks the first schema/API implementation.

To calculate shipping before the winner payment email, choose one:

### Option A: collect full shipping data at raffle entry

Pros:
- total shipping can be calculated immediately after winner selection

Cost:
- stores full address/phone PII for every entrant, including non-winners

### Option B: collect minimal location at entry, full address only for winner

Example entry fields:
- country/region
- city/province
- postal code where applicable

Pros:
- materially less PII for non-winners
- enough for fixed/zone-based shipping rules

Cost:
- exact shipping may require a later winner-only address step

### Option C: collect no shipping data until winner

Pros:
- strongest data minimization

Cost:
- requires one extra winner contact step before ERP can send the final payment total

Recommended default: **Option B** if Luminal uses predictable region/zone shipping; otherwise **Option C**.

Do not implement full-address collection for every entrant without explicit approval.

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
