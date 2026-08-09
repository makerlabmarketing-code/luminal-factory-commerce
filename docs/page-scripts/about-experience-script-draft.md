# About Experience Script Draft

Status: `DRAFT_FOR_OWNER_REVIEW`
Date: 2026-08-09
Gate: Experience definition only. This document does not authorize ecommerce, Supabase, ERP, hiring, customer accounts, or operational claims.

## Scope

Define a dedicated `/about` page for Luminal Factory and replace the current navigation-only `#about` anchor with a real route after implementation is verified.

The page should explain what Luminal Factory is, what kinds of objects it makes, how the studio approaches craft and small-batch production, and how the public storefront surfaces relate to one another.

## Experience goal

Give a visitor enough context to understand the studio without turning the page into a corporate profile, staff directory, or unverifiable history page.

## Narrative sequence

1. **Studio identity**
   - Luminal Factory as a small creative/maker studio focused on artisan keycaps, collectible objects, character/object studies, and custom commission work.
   - Keep language concise, object-led, and craft-focused.

2. **What we make**
   - Artisan keycaps.
   - Small collectible objects / character studies.
   - Custom and branded object commissions when appropriate.
   - Do not invent production quantities, client counts, awards, or capacity.

3. **How work moves through the studio**
   - Concept and form development.
   - 3D sculpt / prototyping.
   - Printing, mold/casting or other approved making processes depending on the object.
   - Finishing, presentation, and release.
   - This is editorial context, not a production SLA.

4. **Small-batch philosophy**
   - Emphasize deliberate iteration and material/finish attention.
   - Avoid fake sustainability, luxury, handmade-percentage, or scarcity claims unless verified later.

5. **Explore Luminal**
   - Raffle: release discovery.
   - Archive: historical/editorial object record.
   - Shop: direct object discovery foundation.
   - Commission: inquiry/review path.

6. **Contact boundary**
   - About itself does not become a generic contact form.
   - Commission inquiries stay on `/commission`.

## First-slice data direction

Static typed content in the repository is sufficient. No database or CMS is required for the first implementation.

Suggested content groups:
- hero / studio summary
- object categories
- process steps
- studio principles
- route bridges

## Visual direction

- Continue the current dark-gallery language.
- Use large editorial typography and generous negative space.
- Object/process sections should feel like a studio notebook translated into a public gallery, not a SaaS About page.
- Existing ice, lavender, pale rose, metal/glass cues remain accents.
- No stock photography.
- No portraits or team headshots in the first slice.

## Accessibility/responsive

- Exactly one `h1`.
- Semantic sections and ordered process list.
- Route bridges are normal links and keyboard reachable.
- No essential hover-only interaction.
- Mobile reading order follows the narrative sequence.
- Reduced-motion users lose no information.

## Explicit non-goals

- Staff biographies or personal data.
- Hiring/careers.
- Legal/company registration details.
- Investor/company metrics.
- Client logos or testimonials.
- Awards or press claims.
- Live CMS/database.
- Supabase migration.
- ERP changes.

## Approval questions

1. Approve `/about` as the dedicated About route.
2. Approve keeping the existing compact Home About teaser while making it link to `/about`.
3. Approve a studio/craft narrative without team biographies in the first slice.
4. Approve static repository content with no database/CMS.
5. Approve routing Commission/contact intent back to `/commission` rather than adding a second form.
