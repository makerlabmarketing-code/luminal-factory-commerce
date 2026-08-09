# Archive Detail Page Specification

## Document metadata
- Status: `DRAFT` / `REVIEW_REQUIRED`
- Date: 2026-08-09
- Implementation status: `BLOCKED_PENDING_OWNER_APPROVAL`
- Database status: `NOT_APPLICABLE_NO_DATA_CHANGE`
- Source script: `docs/page-scripts/archive-detail-experience-script-draft.md`

## Purpose

`/archive/[slug]` is a focused editorial detail surface for one Luminal Factory archive record. It extends the current curated Archive foundation without introducing live commerce or unverified historical claims.

## Information architecture
1. Global header.
2. Archive identity hero with title, collection, year, and dominant media.
3. Historical/story context.
4. Material/making memory notes.
5. Structured archive facts.
6. Supporting media record.
7. Explicit historical/non-commerce boundary.
8. Back-to-Archive and optional related discovery.
9. Global footer.

## Route contract
- Route: `/archive/[slug]`.
- Resolve from the same typed static source as the Archive index.
- Missing slug uses Next.js `notFound()`.
- Detail routes may be statically generated from approved placeholder slugs.
- Index card hrefs should become `/archive/<slug>` only after detail route verification.

## Presentation contract

Evolve the current `ArchivePresentationEntry` with fields such as:
- `slug`
- `title`
- `collection`
- `year`
- `description`
- `story`
- `materialNote`
- `historicalNotes: readonly string[]`
- `facts: readonly { label: string; value: string }[]`
- `media`
- `status`
- `href: /archive/<slug>`
- `isPlaceholder`

The same source must serve index and detail views. Do not introduce a second conflicting archive model.

## First-slice behavior
- Three current curated placeholders may receive static detail pages.
- No remote data loading.
- No Supabase access.
- No sale state, price, stock, inventory, cart, checkout, payment, or order controls.
- Placeholder media stays explicitly marked with `productionApproved: false` and internal source metadata.
- Unknown historical facts are omitted rather than invented.

## Historical boundary
Archive detail represents prior work/history, not current purchase availability.

The page must not imply:
- current stock
- current price
- a live purchase opportunity
- edition quantity
- release dates beyond verified source data
- collaborator/material claims not approved by the owner

## SEO / metadata
- Generate metadata from the resolved static archive record.
- Placeholder pages use truthful, non-production language.
- No invented historical release claims in title/description.
- Preview indexing continues to follow existing repository environment behavior.

## Accessibility / responsive
- Exactly one `h1`.
- Semantic `main`, sections, lists/definition lists.
- Year/status understandable without color.
- Mobile first viewport shows archive identity and year before secondary notes.
- No hover-only essential controls.
- Keyboard focus remains visible.
- Reduced motion preserves all navigation/content.

## Suggested implementation files
- `src/app/archive/[slug]/page.tsx`
- evolve `src/features/archive/archive-content.ts`
- `src/features/archive/archive-detail.tsx`
- update `src/features/archive/archive-collection.tsx`
- dedicated test file
- technical plan under `specs/archive/`

Suggested content API:
- `getArchiveEntryBySlug(slug)`
- existing `getCuratedArchiveEntries()` remains the index source

## Validation gate
Before implementation merge:
- GitHub CI `quality` passes.
- Vercel Preview is READY for latest commit.
- Vercel build output includes `/archive/[slug]` static generation.
- all current approved placeholder slugs generate detail routes.
- invalid slug is guarded by `notFound()`.
- Archive index cards link to real detail routes.
- exactly one `h1` on detail presentation.
- no Supabase/database/transaction code introduced.
- database gate stays `NOT_APPLICABLE_NO_DATA_CHANGE`.

## Future data gate
A future live Archive data slice must separately define:
- dedicated commerce/content persistence source
- historical content ownership and approval workflow
- media storage and publication authority
- published/unpublished lifecycle
- SEO canonical behavior
- Supabase RLS/storage policies if Supabase is selected
- migration and rollback plan

## Non-goals
- Live Archive database.
- Current sale state.
- Price/inventory/SKU.
- Cart/checkout/payment/order.
- Customer auth.
- Supabase migration.
- ERP mutation.

## Approval gate
Implementation remains blocked until owner approval of this static `/archive/[slug]` detail foundation.
