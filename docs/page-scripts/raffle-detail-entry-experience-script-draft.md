# Raffle Detail + Entry Experience Script

Status: `OWNER_APPROVED_FOR_FIRST_INTERACTIVE_SLICE`
Date: 2026-08-09
Owner approval: `2026-08-09`
Gate: Guest-email detail/entry experience approved for technical planning. Payment, order creation, winner administration, and ERP changes remain separately gated.

## Scope

This slice defines the future `/raffle/[slug]` detail page and the public entry submission experience that follows the static `/raffle` discovery foundation.

The critical boundary remains:
- Raffle is not Product.
- Raffle Entry is not Order.
- Entry creates no revenue.
- Winner selection/admin belongs to approved operational workflow.
- Payment/order behavior happens only after a successful winner path according to the final commerce contract.

## Approved experience goal

Give a collector enough verified information to decide whether they are eligible and want to submit exactly one valid raffle entry, while making the submission state, duplication rules, timing, and later winner/payment boundary unambiguous.

## Approved narrative

1. Release identity and authoritative raffle status.
2. Approved opening/closing timestamps in `Asia/Ho_Chi_Minh`.
3. Public eligibility and stable rules summary.
4. Entry form only when authoritative state is `open` and server-side eligibility permits submission.
5. Submission acknowledgement with a stable public entry reference for a newly accepted entry.
6. Duplicate/retry handling that never creates multiple valid entries accidentally.
7. Post-close status explains that winner selection is not performed by the public page.
8. Winner/payment/order flow remains a later surface unless separately approved.

## Approved entry fields

First interactive slice:
- email
- display/name for communication
- raffle identifier supplied by trusted server route, never editable by client
- required agreement to approved raffle rules/privacy copy

Deferred unless later business rules require them:
- phone
- shipping address
- social handle
- region/country
- file upload

## Approved identity model

First implementation uses **guest email entry**.

Identity rules:
- normalize email server-side
- one valid entry per normalized email per raffle
- database uniqueness is the hard duplicate guard
- no customer account/authentication is required for the first entry slice
- duplicate lookup/response must not expose another entrant's private information

## Entry lifecycle

Presentation states:
- `ready`
- `submitting`
- `submitted`
- `duplicate`
- `closed`
- `ineligible`
- `unavailable`
- `error-retryable`

The server/database is authoritative for open/closed state and duplicate/eligibility decisions. Browser time or disabled-button state is not enforcement.

## Duplicate and idempotency principles

- One valid entry per normalized email per raffle.
- Repeated submit/retry must return a stable semantic result and never create duplicates.
- Client-generated request token may assist idempotency, but database uniqueness remains the hard guard.
- Duplicate responses are calm and privacy-safe.
- Public duplicate response defaults to a generic `already_entered` acknowledgement rather than returning private details from an existing entry.

## Privacy and security principles

- Collect only fields required for raffle participation.
- Do not expose entrant lists publicly.
- Do not expose internal winner administration state.
- Public reads must not permit enumeration of private entries.
- Entry writes require server-side validation and anti-abuse/rate limiting.
- Secrets/service-role credentials never reach the browser.

## Persistence direction

Supabase is approved as the persistence direction for the first interactive slice, subject to direct inspection of the current commerce project before any migration is authored or applied.

No schema change is authorized by this experience document alone. The implementation branch must first inspect current tables, policies, migrations, and naming conventions, then produce a reviewed migration/RLS plan.

## Future winner boundary

This approval does not authorize public winner selection or order creation.

A later winner/payment slice must define:
- how selected winners are notified
- payment deadline
- expiration/cancellation/redraw behavior
- when an order is created
- relationship between raffle winner and inventory allocation
- ERP ownership and audit trail

## Explicit non-goals for the first interactive entry slice

- Payment collection.
- Order creation.
- Winner selection algorithm.
- ERP winner administration UI.
- Shipping/fulfillment.
- Public entrant list.
- File upload.
- Browser-authoritative eligibility.
- Mandatory customer account/authentication.

## Approval record

Owner approved on 2026-08-09:
1. `/raffle/[slug]` as the public detail route.
2. Guest email as the first identity model.
3. One valid entry per normalized email per raffle.
4. Minimal fields: email + display/name + required rules/privacy agreement.
5. Phone, shipping address, social handle, region/country, and file upload remain deferred.
6. Server/database-authoritative timing and eligibility with no browser-only enforcement.
7. Supabase as the intended persistence layer, pending direct schema inspection and migration/RLS review.
8. Privacy-safe generic acknowledgement for duplicate submissions.
9. Payment/order/winner administration remain a later separately approved slice.
