# Comeback — participation and confirmation

Owner request 9 October 2026: a new colorway raffle, opening price 80 USD,
Saturday opening and closing two days later, form-based participation, DB
persistence, ERP participant management and successful-registration email.
Owner clarified the window as 10 October 2026 12:00 to 12 October 2026 12:00
Asia/Ho_Chi_Minh. New colorway name/image are pending; keep it unpublished.

Participation uses the existing guest entry form, server validation, Turnstile,
rate limiting and atomic shipping RPC. One normalized email per raffle; stable
submission tokens preserve idempotency. Failed submissions create no email.

The confirmation job is created in the entry transaction, then sent after the
HTTP response. Mail transport failures do not reverse successful registration.
The private queue owns leases, bounded retry and provider idempotency. Email
only confirms registration, never a winner, payment or order. It includes the
raffle title and entry reference, not the shipping address. Existing/test entries
are excluded. Provider acceptance is distinguished from inbox delivery.

ERP reads the selected raffle's customer names, emails, registration times and
shipping data through the existing HMAC service boundary. Dedicated raffle
and participant permissions are required; Product permission does not confer
access. No customer data is copied into the ERP database.

A DB clock function advances published non-test SCHEDULED/OPEN raffles only.
It cannot publish drafts or revert drawn/completed/cancelled releases. Cron
opening may lag up to a minute; the existing entry RPC rejects submission at
the exact closing boundary independently of cron.

The unpublished draft exists as d6c1e22d-bca6-4570-a678-f944e56af855. Price is
currently recorded in draft copy. Before publishing, associate the real
colorway and set authoritative product_prices to USD 8000 minor units, then
verify public detail and winner price snapshots. Shipping and final rules
must be completed before publication.

The reviewed forward/validation/rollback package, exact activation steps and
isolated test scope are in supabase/drafts/comeback-entry-email/README.md.
Production SQL and actual mail delivery remain pending the new package gate;
standing deployment authorization covers repository changes with mail off.
