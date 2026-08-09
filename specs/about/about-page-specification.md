# About Page Specification

## Document metadata

- Status: `APPROVED` / `IMPLEMENTATION_READY`
- Date: 2026-08-09
- Implementation status: `OWNER_APPROVED_FOR_FIRST_IMPLEMENTATION_SLICE`
- Database status: `NOT_APPLICABLE_NO_DATA_CHANGE`
- Source experience script: `docs/page-scripts/about-experience-script-draft.md`

This specification defines the bounded static `/about` foundation. It does not authorize CMS/database work, Supabase migration, ERP changes, staff biographies, careers, or unverified studio claims.

## Page purpose

`/about` is the dedicated public studio-context page for Luminal Factory.

Primary user outcome: understand what the studio makes, how objects move from concept to finished presentation, and where to go next for Raffle, Archive, Shop, or Commission.

## Approved brand line

The legacy footer line `Made slowly. Made to stay.` is retired in this slice.

Approved replacement:

**Shaped by light. Crafted to last.**

Usage rules:
- Footer uses the new two-part line.
- About may use it once as supporting identity language if compositionally useful.
- Do not repeat it across every section or route.
- Treat `Shaped by light` as brand metaphor, not a literal manufacturing/material claim.

## Route scope

Approved implementation target:

- `/about`

After route verification:
- Header About navigation changes from `#about` to `/about`.
- Footer About navigation changes from `#about` to `/about`.
- Home keeps a concise About teaser and adds a normal link to `/about`.
- Footer replaces the old slogan with the approved brand line.

## Information architecture

1. Global header.
2. Studio identity hero.
3. What we make.
4. How an object moves through the studio.
5. Studio principles / small-batch philosophy.
6. Explore Luminal route bridges.
7. Commission/contact boundary.
8. Global footer.

## Static content contract

Suggested repository-only presentation model:

```ts
type AboutPresentation = Readonly<{
  eyebrow: string;
  brandLine: string;
  title: string;
  summary: string;
  objectCategories: readonly {
    title: string;
    description: string;
  }[];
  processSteps: readonly {
    number: string;
    title: string;
    description: string;
  }[];
  principles: readonly {
    title: string;
    description: string;
  }[];
  routeBridges: readonly {
    label: string;
    description: string;
    href: "/raffle" | "/archive" | "/shop" | "/commission";
  }[];
}>;
```

The first slice should use a single typed repository content source. No CMS abstraction is required.

## Content boundaries

Allowed first-slice claims:
- Luminal Factory is a small creative/maker studio.
- Focus includes artisan keycaps, collectible objects, object/character studies, and custom commission work.
- Work may involve concept development, 3D sculpt/prototyping, printing, mold/casting, finishing, and presentation depending on the object.
- Releases and commissions are handled through their dedicated public surfaces.

Do not invent:
- founding year unless verified
- team names/biographies
- employee counts
- customers/clients
- production volume
- awards or press
- sustainability claims
- guaranteed handmade percentage
- lead times or production capacity
- legal/company registration facts

Unknown facts are omitted rather than filled with marketing copy.

## Home integration

The current Home `#about` teaser remains intentionally short.

Implementation should:
- preserve the teaser as a lightweight end-of-home context block
- add a link such as `Tìm hiểu về Luminal` to `/about`
- avoid duplicating the full About page on Home
- keep Home's primary purpose focused on release/object discovery

## Route bridges

Raffle:
- release/discovery context
- link `/raffle`

Archive:
- historical/editorial object record
- link `/archive`

Shop:
- direct object discovery
- link `/shop`

Commission:
- custom-object inquiry/review path
- link `/commission`

About must not create another commission/contact submission route.

## Visual direction

- Reuse the existing dark gallery/studio visual system.
- Large editorial heading, restrained mono eyebrow labels, generous vertical spacing.
- Process can reuse or adapt existing ordered-step primitives.
- Principles should remain text-led rather than dashboard/card-heavy.
- Existing ice/lavender/rose accents are sufficient.
- No new image dependency is required for the first slice.
- The approved brand line should feel integrated with the logo/identity, not styled as a loud marketing banner.

## SEO/metadata

- Title: truthful About/Luminal Factory studio context.
- Description: mention artisan keycaps, collectible objects, studio/making approach without exaggerated claims.
- Preview environments continue existing noindex behavior.
- No Organization schema with unverified legal details in this slice.

## Accessibility/responsive

- Exactly one `h1`.
- Logical h2/h3 order.
- Ordered list for process when sequence matters.
- Links have meaningful text outside visual context.
- Mobile reading order follows identity → objects → process → principles → explore.
- Keyboard focus remains visible.
- No essential information depends on animation, color, or hover.

## Architecture

Suggested files:

- `src/app/about/page.tsx`
- `src/features/about/about-content.ts`
- `src/features/about/about-presentation.tsx`

Expected existing-file changes:
- `src/components/layout/header.tsx` or shared navigation source
- `src/components/layout/footer.tsx` or shared navigation source
- `src/app/page.tsx` for Home teaser link

Keep the route component thin and presentation data typed.

## Validation before implementation merge

- `npm run lint`
- `npm run typecheck`
- `npm test`
- `npm run build`
- GitHub CI quality success
- Vercel Preview READY
- `/about` returns 200
- Header/Footer About links resolve to `/about`
- Home About teaser links to `/about`
- Footer renders `Shaped by light. Crafted to last.` and no longer renders `Made slowly. Made to stay.`
- exactly one `h1` on `/about`
- no Supabase/CMS/ERP code introduced
- database gate remains `NOT_APPLICABLE_NO_DATA_CHANGE`

## Non-goals

- CMS.
- Database-backed About content.
- Team/staff directory.
- Personal profiles.
- Careers/hiring.
- Generic contact form.
- Customer testimonials.
- Client logos.
- Press/awards.
- Legal registration details.
- Supabase migration.
- ERP mutation.

## Approval gate

Owner approval recorded on 2026-08-09. Implementation may proceed in a separate technical-plan/feature branch from the latest `master` after this documentation PR passes its delivery gates and merges.
