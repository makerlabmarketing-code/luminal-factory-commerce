# Archive Detail Experience Script Draft

Status: `DRAFT_FOR_OWNER_REVIEW`
Date: 2026-08-09
Gate: Experience definition only. This document does not approve live historical claims, catalog data, commerce actions, Supabase schema, or ERP changes.

## Scope

This slice defines a dedicated `/archive/[slug]` detail experience for Luminal Factory collectible history.

The first implementation remains static and presentation-only, using the existing curated archive placeholders until approved historical content is available.

## Experience goal

Give collectors a focused editorial record for one archived object without turning Archive into a shop page. The detail view should feel like a museum card expanded into a quiet object dossier: visual, context, material memory, year, and historical notes.

## Narrative sequence

1. Archive identity hero: title, collection, year, dominant object study, archive marker.
2. Historical context: approved release story or placeholder study context.
3. Material / making memory: approved notes only, no invented process claims.
4. Archive facts: year, collection, object type or release metadata only when source-approved.
5. Media record: approved historical media when available; internal placeholders stay labeled non-production.
6. Historical boundary: Archive is not a current sale surface; no price, stock, cart, checkout, payment, or order CTA.
7. Related discovery: return to Archive index, optionally bridge to Shop or Commission when appropriate.
8. Global footer.

## Route contract

- Public route: `/archive/[slug]`.
- Slug is a stable public presentation identifier.
- Missing slug returns not-found.
- Archive cards switch from anchor links to detail routes only after route verification.

## First-slice data

Reuse and evolve the existing `ArchivePresentationEntry` instead of creating a competing archive model. The first implementation may add:
- `story`
- `historicalNotes[]`
- `facts[]`
- real `/archive/<slug>` href

No database columns are implied.

## Visual direction

- One dominant portrait-oriented object study.
- Preserve current dark archive tone and restrained ice/lavender/rose/smoke accents.
- More editorial and historical than Shop detail.
- Year and collection should be visible near the first viewport.
- Placeholder media must remain explicitly marked as internal/non-production.

## Responsive/accessibility

- Exactly one `h1`.
- Logical semantic sections.
- Historical status readable without color alone.
- Mobile prioritizes title, year, object media, and archive context before secondary notes.
- Keyboard-visible navigation.
- Reduced motion preserves all content.

## Explicit non-goals

- Live archive database.
- Price or current availability.
- Add to Cart / Buy Now.
- Checkout/payment/order.
- Inventory/SKU.
- Customer account/auth.
- Supabase migration.
- ERP changes.
- Unverified historical release claims.

## Approval questions

1. Approve `/archive/[slug]` as the archive detail route.
2. Approve first implementation as static/presentation-only using current curated archive placeholders.
3. Approve Archive detail as historical/editorial, explicitly separate from Shop transaction language.
4. Approve evolving the existing typed Archive source with story, historical notes and facts.
5. Approve keeping live historical data/database integration for a later independently specified slice.
