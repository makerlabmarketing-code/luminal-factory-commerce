# Commission Inquiry Technical Plan

Status: IMPLEMENTATION_SLICE
Date: 2026-08-09
Owner approval: commission inquiry experience/form specification approved.
Database gate: NOT_APPLICABLE_NO_DATA_CHANGE

## Goal

Enable a real commission inquiry form without introducing order, quote, payment, production booking, file upload, Supabase persistence, or ERP mutation.

## Transport

- Server route: `POST /api/commission-inquiry`
- Provider: Resend Email API over HTTPS using native `fetch`
- No provider SDK dependency is added.
- Environment variables:
  - `RESEND_API_KEY`
  - `COMMISSION_INQUIRY_FROM_EMAIL`
  - `COMMISSION_INQUIRY_TO_EMAIL`
- UI is fail-closed. If any required server env is missing, the public page states that inquiry submission is not configured and does not render an active submission form.

## Validation and privacy

- Shared Zod contract defines accepted fields and length limits.
- Required: requestId, name, email, category, project summary, privacy acknowledgement.
- Optional: reference URL, timing context, budget context.
- Hidden honeypot field must remain empty.
- No file upload.
- No inquiry payload is persisted in Supabase or ERP.
- Server logs transport status only and must not log inquiry content or email addresses.

## Delivery semantics

- `requestId` is used as the Resend `Idempotency-Key` to reduce duplicate sends on retries.
- Email `reply_to` points to the submitter email so studio replies can remain in normal email workflow.
- Successful API response means only that the inquiry transport accepted the message.
- UI success copy explicitly states that this is not commission acceptance, quote, invoice, payment, order, or production reservation.

## Failure semantics

- Missing transport env -> HTTP 503 `transport_unavailable`.
- Invalid body/content type -> 4xx `invalid_input`.
- Provider/network failure -> HTTP 502 `transport_failed`.
- Client presents a retry-safe generic message without exposing provider internals.

## Validation before merge

- `npm run lint`
- `npm run typecheck`
- `npm test`
- `npm run build`
- GitHub CI quality gate success
- Vercel Preview READY
- `/commission` renders without configured secrets and does not falsely expose a working submit state
- build includes `/api/commission-inquiry`
- no Supabase migration or ERP code changes

## Production activation after merge

The form becomes active only after all three server-only environment variables are configured in Vercel and a new deployment is produced. The sending domain/address must be verified with the email provider before using it as `COMMISSION_INQUIRY_FROM_EMAIL`.
