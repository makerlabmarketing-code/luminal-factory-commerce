# Archive Detail Foundation Technical Plan

Status: implementation slice
Date: 2026-08-09
Base: owner-approved Archive detail specification
Database gate: `NOT_APPLICABLE_NO_DATA_CHANGE`

## Goal

Implement static `/archive/[slug]` historical/editorial detail pages for the existing curated Archive placeholders without introducing transactional commerce or a database dependency.

## Implementation

- Evolve the existing `ArchivePresentationEntry` source rather than introducing a second archive model.
- Keep stable public `slug` values and change index hrefs from hash anchors to `/archive/[slug]`.
- Add bounded story, historical notes, and presentation facts. These remain explicit placeholder/editorial data, not verified production-history claims.
- Add `getArchiveEntryBySlug(slug)`.
- Add a thin Next.js Server Component route at `src/app/archive/[slug]/page.tsx`.
- Generate static params from the same curated source.
- Generate truthful per-entry metadata.
- Use `notFound()` for unknown slugs.
- Add a reusable `ArchiveDetail` presentation component using existing Archive visual primitives.
- Update Archive index cards to navigate to real detail routes.

## Explicit non-goals

- Live archive database.
- Supabase access or migration.
- ERP changes.
- Price, inventory, sale state, cart, checkout, payment, or order behavior.
- Raffle-entry or winner behavior.
- Unverified customer, release-volume, launch-date, or sales-history claims.

## Validation

- `npm run lint`
- `npm run typecheck`
- `npm test`
- `npm run build`
- GitHub CI `quality` success.
- Vercel Preview READY for the latest commit.
- Build output includes static `/archive/[slug]` pages for all curated entries.
- Unknown slug resolves through `notFound()`.
- Archive cards link to `/archive/[slug]`.
- Database gate remains `NOT_APPLICABLE_NO_DATA_CHANGE`.
