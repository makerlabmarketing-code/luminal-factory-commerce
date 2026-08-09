# Commission Inquiry Experience Script Draft

Status: `DRAFT_FOR_OWNER_REVIEW`
Date: 2026-08-09
Gate: Experience definition only. This document does not approve an email provider, database persistence, order creation, payment, upload, or ERP integration.

## Goal

Turn `/commission` from discovery-only into a clear inquiry handoff without pretending that an inquiry is a quote, booking, order, or production slot.

## User journey

1. Read scope and process on `/commission`.
2. Reach a dedicated inquiry section after understanding expectations.
3. Provide only the minimum information needed for studio review.
4. Review consent/privacy language.
5. Submit once through an approved transport in a later implementation slice.
6. Receive a truthful acknowledgement that the inquiry was received for review, not accepted as a commission.
7. If submission fails, preserve entered content where possible and offer retry/contact fallback.

## Proposed fields

Required:
- name / display name
- email
- commission category
- short project summary
- rules/privacy acknowledgement

Optional:
- reference/context URL
- target timing context
- budget context

Not in first slice:
- shipping address
- phone number
- file upload
- payment information
- account creation
- invoice details

## Category values

Use the same categories already presented on the Commission discovery page:
- Artisan keycap
- Collectible object
- Branded / custom object
- Other / unsure

## Summary field

The project summary should ask for concept, intended object/use, scale/context, and the most important constraint. It must be a textarea, not a single-line text input.

## Submission states

- idle
- validating
- submitting
- received-for-review
- validation-error
- transport-error

Success copy must say the request has been received for review. It must not say "approved", "booked", "order created", "slot reserved", or promise a response time unless an operational SLA is later approved.

## Duplicate/retry behavior

First implementation should prevent accidental double-submit in the browser. A later server transport should be designed for safe retries/idempotency where feasible.

## Privacy and data minimization

- Explain why email and project context are requested.
- Collect only fields needed for initial review.
- Do not collect sensitive payment or shipping data.
- Do not expose inquiries publicly.
- Do not reuse inquiry data for unrelated marketing without separate consent.

## Transport decision deferred

This experience script intentionally does not select the submission transport. Candidate later implementations may include:
- trusted server route that sends studio email through an approved provider
- dedicated commerce persistence plus notification after a separate data/security specification

Avoid `mailto:` as the primary submission path if it prevents reliable validation/acknowledgement, but it may remain an explicit contact fallback.

## Explicit boundaries

An inquiry:
- is not an order
- is not a quote
- does not reserve production capacity
- does not create an invoice
- does not trigger payment
- does not authorize production

## Approval questions

1. Approve the proposed minimal fields.
2. Approve optional timing and budget context.
3. Approve no upload in the first inquiry slice.
4. Approve success semantics as "received for review" only.
5. Approve choosing submission transport in a separate technical slice after this UX contract is locked.
