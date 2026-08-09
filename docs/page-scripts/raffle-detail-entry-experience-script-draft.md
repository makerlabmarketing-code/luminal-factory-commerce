# Raffle Detail + Entry Experience Script Draft

Status: `DRAFT_FOR_OWNER_REVIEW`
Date: 2026-08-09
Gate: Experience/data-contract definition only. No form, auth, Supabase mutation, payment, order, or ERP change is approved by this document.

## Scope

This slice defines the future `/raffle/[slug]` detail page and the public entry submission experience that follows the static `/raffle` discovery foundation.

The critical boundary remains:
- Raffle is not Product.
- Raffle Entry is not Order.
- Entry creates no revenue.
- Winner selection/admin belongs to approved operational workflow.
- Payment/order behavior happens only after a successful winner path according to the final commerce contract.

## Experience goal

Give a collector enough verified information to decide whether they are eligible and want to submit exactly one valid raffle entry, while making the submission state, duplication rules, timing, and later winner/payment boundary unambiguous.

## Proposed narrative

1. Release identity and authoritative raffle status.
2. Approved opening/closing timestamps in `Asia/Ho_Chi_Minh`.
3. Public eligibility and stable rules summary.
4. Entry form only when authoritative state is `open` and server-side eligibility permits submission.
5. Submission acknowledgement with immutable entry reference.
6. Duplicate/retry handling that never creates multiple valid entries accidentally.
7. Post-close status explains that winner selection is not performed by the public page.
8. Winner/payment/order flow remains a later surface unless separately approved.

## Proposed entry fields

Minimum proposed fields for owner review:
- email
- display/name for communication
- raffle identifier supplied by trusted server route, never editable by client
- required agreement to approved raffle rules/privacy copy

Potentially deferred unless business rules require them:
- phone
- shipping address
- social handle
- region/country

No file upload is proposed for raffle entry.

## Identity proposal

Preferred first implementation direction: guest entry by verified/normalized email, with server-side uniqueness per raffle.

Alternative: require authenticated customer account before entry.

This decision must be owner-approved before implementation because it materially changes friction, duplicate enforcement, privacy, and Supabase RLS design.

## Entry lifecycle proposal

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

- One valid entry per normalized identity per raffle unless final rules explicitly approve otherwise.
- Repeated submit/retry must return the existing valid entry or an equivalent stable result, not create duplicates.
- Client-generated request token may assist idempotency, but database uniqueness remains the hard guard.
- Duplicate responses should be calm and informative, not treated as a fatal system error.

## Privacy and security principles

- Collect only fields required for raffle participation.
- Do not expose entrant lists publicly.
- Do not expose internal winner administration state.
- Public reads must not permit enumeration of private entries.
- Entry writes require server-side validation and anti-abuse/rate limiting.
- Secrets/service-role credentials never reach the browser.

## Future winner boundary

This spec does not approve public winner selection or order creation.

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

## Owner approval questions

1. Approve `/raffle/[slug]` as the public detail route.
2. Choose identity model: guest email entry or required customer account.
3. Approve one valid entry per normalized identity per raffle as the default uniqueness rule.
4. Approve minimal fields: email + display/name + required rules/privacy agreement.
5. Confirm that phone, shipping address, social handle and file upload stay out of the entry form unless later required.
6. Approve server/database-authoritative timing and eligibility with no browser-only enforcement.
7. Approve that payment/order/winner administration remain a later separately approved slice.
