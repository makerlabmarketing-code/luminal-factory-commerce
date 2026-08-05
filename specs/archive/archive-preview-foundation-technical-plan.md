# Archive Preview Foundation Technical Plan

Status: `IMPLEMENTATION_READY`
Date: 2026-08-05
Scope: Home Archive Preview + `/archive` route foundation only.

## Current source assessment

- `src/app/page.tsx` is a Server Component that composes the approved raffle-first hero, release information section, and minimal About section.
- `src/content/homepage.ts` owns the Home hero presentation model and static placeholder content; it must remain presentation-only.
- `src/components/layout/navigation.ts` already follows the approved order but `Archive` still points to the Home release anchor instead of a real route.
- `src/app/globals.css` centralizes tokens, responsive rules, focus behavior, sticky-header scroll margins, and reduced-motion support.
- Tests currently cover the hero shell, navigation order, non-transactional claims, reduced motion, documentation, and schema guards.

## Information hierarchy

1. Raffle discovery remains the highest-priority Home content.
2. Release information confirms the non-transactional status of the current slice.
3. Archive preview appears after raffle-first content as a quieter historical showcase.
4. About remains a lower-priority orientation section.
5. `/archive` provides an indexable foundation for curated historical presentation without filters, search, pagination, or detail routes.

## Home preview scope

The Home preview renders three to four curated placeholder archive entries with an eyebrow, heading, supporting copy, entry summaries, and a CTA to `/archive`. It must not look like a product grid and must avoid price, stock, sold-out, rating, cart, buy, or raffle-entry claims.

## `/archive` route scope

The route provides metadata, one `h1`, introductory copy, an archive list/grid, empty-state capability, and a link back to Home raffle discovery. It does not provide search, filters, pagination, detail pages, CMS, Supabase queries, or user-specific state.

## Component tree

- `src/app/page.tsx`
  - `Header`
  - `main#main-content`
    - approved `section#raffle`
    - approved `section#release-information`
    - `ArchivePreviewSection`
    - `section#about`
  - `Footer`
- `src/app/archive/page.tsx`
  - `Header`
  - `main#main-content`
    - archive hero/header section
    - `ArchiveCollection`
    - route footer CTA
  - `Footer`
- `src/features/archive/archive-content.ts` owns typed curated presentation data.
- `src/features/archive/archive-preview-section.tsx` renders the Home preview.
- `src/features/archive/archive-collection.tsx` renders route/list presentation and empty state.

## Typed presentation model

The model includes `id`, `slug`, `title`, `collection`, `year`, `description`, `materialNote`, `media`, `status`, `href`, and `isPlaceholder`. It is intentionally named as a presentation model, not a production database contract, and must not duplicate commerce business enums.

## Server/Client Component boundary

All archive files in this slice are Server Components or plain typed data. No browser-only state, Supabase client, authentication, cart, payment, order, or raffle transaction code is introduced.

## Responsive behavior

Home preview uses a compact editorial list/grid that stacks on mobile. `/archive` uses a large intro plus responsive curated grid. Cards preserve media aspect ratio, do not depend on hover, and keep touch targets large.

## Accessibility

Sections use `aria-labelledby`, stable heading order, one `h1` per route, semantic lists for collections, visible focus inherited from global CSS, non-nested interactive cards, and descriptive alt text for placeholder media. Decorative layers are `aria-hidden`.

## Image strategy

No external or proprietary media is added. Placeholder media is rendered with internal CSS surfaces, fixed aspect ratios, labels, and alt text. Each entry is marked as curated placeholder pending production content approval.

## Performance

The slice adds no dependencies, no images, no video autoplay, no 3D, and no client hydration beyond the existing mobile navigation island. CSS placeholders avoid CLS through reserved aspect ratios.

## Tests

Tests cover Home preview placement after raffle-first content, CTA to `/archive`, archive route existence and single `h1`, typed curated model, forbidden commerce claims, no Supabase query, navigation status, reduced motion support, and documentation status.

## Rollback

Revert the archive feature directory, `/archive` route, Home preview composition, navigation href change, CSS additions, tests, and documentation updates. No data rollback is required.

## Non-goals

No full Archive system, Supabase connection, CMS, search, filters, pagination, detail route, production media, raffle transaction, payment, order, cart, authentication, account, Shop route, Commission route, migration, 3D, dependency installation, ERP workflow, or live data mutation.
