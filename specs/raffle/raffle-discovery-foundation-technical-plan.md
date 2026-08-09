# Raffle Discovery Foundation Technical Plan

Status: `IMPLEMENTATION_READY`
Owner approval: `2026-08-09`
Database gate: `NOT_APPLICABLE_NO_DATA_CHANGE`

## Scope

Implement the owner-approved static `/raffle` discovery foundation only.

Included:
- thin Server Component route at `/raffle`
- typed presentation-only raffle content
- truthful `upcoming` preparing state
- release/context presentation using internal placeholder treatment
- public conceptual raffle process and trust notes
- Archive bridge
- global Raffle navigation changed from `#raffle` to `/raffle`
- tests for route semantics and non-transactional boundaries

Deferred:
- `/raffle/[slug]`
- raffle entry submission
- authentication and eligibility
- winner status/selection
- payment and order creation
- inventory reservation
- Supabase schema/RLS/migrations
- ERP mutations

## Architecture

- `src/app/raffle/page.tsx`: thin route and metadata.
- `src/features/raffle/raffle-content.ts`: typed static presentation contract and deterministic fixture.
- `src/features/raffle/raffle-discovery.tsx`: server-rendered presentation sections.
- Reuse existing global design tokens/components; no new dependency.

The presentation lifecycle union may describe future public states, but this slice renders only a truthful `upcoming` fallback. No browser clock controls eligibility or state transitions.

## Validation

Before merge:
- `npm run lint`
- `npm run typecheck`
- `npm test`
- `npm run build`
- `npm run check`
- GitHub CI quality gate success
- Vercel Preview READY
- `/raffle` returns HTTP 200
- navigation links Raffle to `/raffle`
- exactly one `h1`
- no form, auth, Supabase, payment, order, inventory, or ERP mutation code

## Merge gate

Merge only after required GitHub/Vercel checks pass. The future detail/entry flow remains independently gated.