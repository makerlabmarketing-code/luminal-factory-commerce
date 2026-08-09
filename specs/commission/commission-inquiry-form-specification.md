# Commission Inquiry Form Specification

## Document metadata

- Status: `DRAFT` / `REVIEW_REQUIRED`
- Date: 2026-08-09
- Implementation status: `BLOCKED_PENDING_OWNER_APPROVAL`
- Database status: `NOT_APPLICABLE_NO_DATA_CHANGE`
- Source experience script: `docs/page-scripts/commission-inquiry-experience-script-draft.md`

This specification defines the first inquiry UX contract for `/commission`. It does not authorize a live submission provider, database persistence, order creation, payment, upload, or ERP changes.

## Purpose

Provide a bounded way for a prospective client to prepare and submit a commission inquiry after reading scope/process information, while keeping the distinction between inquiry and commercial commitment explicit.

## Form fields

Required:
- `name`: string, human-readable display/contact name
- `email`: valid email address
- `category`: controlled category value
- `summary`: multiline project summary
- `privacyAccepted`: explicit acknowledgement

Optional:
- `referenceUrl`: URL only
- `timingContext`: short free text
- `budgetContext`: short free text

The first slice must not collect shipping address, phone, file attachments, payment data, tax/invoice identity, or account credentials.

## Category contract

Suggested values:
- `artisan-keycap`
- `collectible-object`
- `branded-custom-object`
- `other-unsure`

Labels remain user-facing and may be localized independently of the stable values.

## Validation

Client-side validation may improve UX but must not be treated as the authority for a future live transport.

Rules:
- trim name and summary
- normalize email casing/whitespace for transport only; preserve user-facing value as appropriate
- reject empty required fields
- validate email syntax with shared application schema
- validate `referenceUrl` only when populated
- cap free-text lengths to prevent accidental giant submissions
- show field-level errors and a summary/focus path suitable for keyboard users

Recommended presentation limits for the future implementation:
- name: 2–120 characters
- email: max 254 characters
- summary: 20–3000 characters
- timingContext: max 300 characters
- budgetContext: max 300 characters
- referenceUrl: max 1000 characters

These are UX/application constraints, not database column definitions.

## Submission states

The UI state machine must support:
- `idle`
- `validating`
- `submitting`
- `received-for-review`
- `validation-error`
- `transport-error`

While submitting:
- disable duplicate submission controls
- keep status understandable without relying on animation alone
- preserve typed data unless a confirmed successful submission occurs

## Success semantics

Allowed meaning:
- inquiry has been received for studio review

Not allowed:
- commission accepted
- quote approved
- order created
- slot reserved
- production scheduled
- payment required

Do not promise response timing unless an operational SLA is separately approved.

## Error semantics

Validation error:
- identify fields needing correction
- keep all other entered values

Transport error:
- explain that submission was not confirmed
- keep entered values where possible
- allow retry
- an explicit studio contact fallback may be provided

Never render a success state when transport acknowledgement is ambiguous.

## Privacy/security boundary

Any future live implementation must:
- send data only through a trusted server boundary or approved external form service
- never expose secrets in browser code
- avoid public inquiry enumeration
- collect only the minimal data defined here
- avoid marketing reuse without separate consent
- define retention/deletion behavior before persistent storage is introduced

If persistence is later introduced, it requires a separate dedicated commerce data/security specification. The existing ERP Supabase project remains out of scope.

## Transport options for later decision

Preferred future direction:
1. Next.js server endpoint/server action validates the same shared schema.
2. Server sends the inquiry through an approved transactional email/form provider.
3. Provider acknowledgement maps to a privacy-safe success/failure response.
4. Optional persistence may be added later only after a dedicated commerce database is approved.

A primary `mailto:` flow is not preferred because reliable validation, acknowledgement, and retry behavior are weaker, but it can serve as a contact fallback.

## Anti-abuse expectations for live submission

The later technical plan should address:
- honeypot or equivalent low-friction bot signal
- server-side rate limiting
- body/field size limits
- origin/request validation as appropriate
- no user-controlled email headers
- safe logging without full inquiry content or unnecessary PII

CAPTCHA should not be introduced by default unless abuse data justifies its UX cost.

## Accessibility

- every field has a persistent label
- required/optional status is not color-only
- validation messages are associated with fields
- textarea is used for summary
- keyboard submit and retry work
- pending status is announced accessibly
- success/error feedback uses semantic live/status patterns without stealing focus unnecessarily

## Implementation boundary after approval

After owner approval:
- create a technical plan branch from latest `master`
- select/verify an actual submission transport before adding a working submit button
- implement the form UI and shared validation schema
- if transport cannot yet be approved, the UI must remain clearly disabled/coming-soon rather than simulating submission

## Explicit non-goals

- Quote generation.
- Pricing engine.
- Production booking.
- Order/invoice creation.
- Payment/deposit.
- File upload.
- Customer account/auth.
- Supabase migration.
- ERP mutation.

## Validation gate for later implementation

Before merge of a live inquiry slice:
- lint/typecheck/tests/build pass
- Vercel Preview READY
- successful submission verified against the approved transport in Preview or a safe test environment
- failure path verified
- no secrets exposed client-side
- no ERP/Supabase mutation unless separately approved

## Approval gate

Implementation remains blocked until the owner approves the field set, success semantics, no-upload boundary, and separation of transport selection into the next technical slice.
