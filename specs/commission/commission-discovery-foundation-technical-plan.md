# Commission Discovery Foundation Technical Plan

Status: `IMPLEMENTATION_READY`
Date: 2026-08-09
Scope: static `/commission` discovery foundation only.

## Objective

Implement the owner-approved first Commission slice as a truthful, non-transactional storefront route that explains commission fit, categories, preparation, collaboration process, and current discovery-only availability.

## Why this slice

Commission is fourth in the approved raffle-first navigation hierarchy after Raffle, Archive, and Shop. The page should become a real destination before any request form, persistence, payment, upload, or operational integration is introduced.

## Implementation

1. Add typed presentation-only content in `src/features/commission/commission-content.ts`.
2. Add a server-rendered presentation component in `src/features/commission/commission-discovery.tsx`.
3. Add thin route composition and metadata at `src/app/commission/page.tsx`.
4. Change the global Commission navigation entry from unavailable anchor fallback to real `/commission` route.
5. Add source-level tests for route semantics, navigation, presentation boundaries, and prohibited transactional/data behavior.
6. Preserve existing global styles and reusable section/card/process primitives; do not add a dependency or new animation library.

## Presentation contract

The content module owns only public presentation values:

- availability mode: `coming-soon`
- neutral availability label
- approved commission categories
- collaboration process
- preparation guidance
- expectation guidance
- Archive bridge

These values are not database entities or domain lifecycle enums.

## Data and Supabase impact

None.

- No Supabase client or query.
- No migration, table, RLS policy, storage bucket, generated DB type, or secret.
- No request persistence.
- No production availability service.

Database gate for this slice: `NOT_APPLICABLE_NO_DATA_CHANGE`.

## Commerce and ERP boundary

The page must state and preserve that:

- a commission inquiry/request is not an order
- submission is not implemented
- no production slot is reserved
- no quote, invoice, deposit, payment, or fulfillment obligation is created
- internal review remains an ERP concern and is not exposed in storefront code

## UI and motion

Reuse the existing dark editorial gallery system. The first slice requires no custom continuous motion and no WebGL. Existing focus and reduced-motion behavior remain authoritative.

Desktop and mobile must both render the same information hierarchy. No pointer-only interaction is permitted.

## Validation

Required evidence before merge:

- branch diff remains bounded to Commission presentation/docs/navigation/tests
- `/commission` route exists with exactly one `h1`
- Commission navigation points to `/commission` and is available
- source contains no Supabase query/schema, file upload, checkout, payment, order creation, or ERP mutation
- Vercel Preview deployment reaches `READY`
- Preview `/commission` responds successfully
- GitHub/Vercel required status checks succeed

## Explicit non-goals

- inquiry form
- file upload
- authentication
- customer account
- availability API
- Supabase persistence
- ERP integration
- quote calculation
- price range
- turnaround promise
- deposit/payment
- order creation
- production capacity reservation
