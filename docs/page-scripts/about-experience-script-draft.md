# About Experience Script Draft

Status: `OWNER_APPROVED_FOR_FIRST_IMPLEMENTATION_SLICE`
Date: 2026-08-09
Gate: Experience definition only. This document does not authorize ecommerce, Supabase, ERP, hiring, customer accounts, or operational claims.

## Scope

Define a dedicated `/about` page for Luminal Factory and replace the current navigation-only `#about` anchor with a real route after implementation is verified.

The page should explain what Luminal Factory is, what kinds of objects it makes, how the studio approaches craft and small-batch production, and how the public storefront surfaces relate to one another.

## Approved brand line

Replace the legacy footer line `Made slowly. Made to stay.` with:

**Shaped by light. Crafted to last.**

Rationale:
- `Shaped by light` connects the Luminal name and the approved logo's luminous/faceted object language without making a literal material claim.
- `Crafted to last` keeps the studio's maker/craft character while sounding more intentional and contemporary than the old slow-craft line.
- Use this as a restrained brand line, not repeated as filler across every page.

## Experience goal

Give a visitor enough context to understand the studio without turning the page into a corporate profile, staff directory, or unverifiable history page.

## Narrative sequence

1. **Studio identity**
   - Luminal Factory as a small creative/maker studio focused on artisan keycaps, collectible objects, character/object studies, and custom commission work.
   - Keep language concise, object-led, and craft-focused.
   - The approved brand line may appear once as supporting identity language when compositionally useful.

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

## Approval decision

Owner approved on 2026-08-09:
1. `/about` as the dedicated About route.
2. Keep the compact Home About teaser and link it to `/about`.
3. Use a studio/craft narrative without team biographies in the first slice.
4. Use static repository content with no database/CMS.
5. Keep Commission/contact intent on `/commission` rather than adding a second form.
6. Replace the old footer slogan with `Shaped by light. Crafted to last.` as part of the About implementation slice.
