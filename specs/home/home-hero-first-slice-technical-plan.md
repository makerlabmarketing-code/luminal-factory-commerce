# Home Hero First Slice Technical Plan

Status: `IMPLEMENTATION_READY`
Date: 2026-08-05
Scope: Global visual foundation + Home raffle discovery hero shell only.

## Current source assessment

- `src/app/page.tsx` currently owns the full Home JSX directly, including a generic studio hero, multiple lower Home sections, and in-page anchors.
- `src/components/layout/navigation.ts` contains fragment navigation but uses the old order and `Gallery` label instead of the approved `Archive` label.
- `src/components/layout/header.tsx` renders a placeholder cart link. This conflicts with the first-release account/cart decision.
- `src/components/layout/mobile-navigation.tsx` renders the same placeholder cart link in the mobile menu.
- `src/app/globals.css` already centralizes tokens, responsive behavior, visible focus, sticky header, and reduced-motion handling.
- `tests/foundation.test.mjs` validates landmarks, navigation links, reduced motion, documentation artifacts, and schema guards, but it reflects the older Home skeleton and cart placeholder.

## Exact files expected to change

- Documentation: `docs/page-scripts/home-raffle-first-experience-script-draft.md`, `specs/home/home-page-specification.md`, `docs/ECOMMERCE_IMPLEMENTATION_ROADMAP.md`, `docs/current-ecommerce-operator-handoff.md`.
- New plan: `specs/home/home-hero-first-slice-technical-plan.md`.
- Source: `src/app/page.tsx`, `src/content/homepage.ts`, `src/components/layout/navigation.ts`, `src/components/layout/header.tsx`, `src/components/layout/mobile-navigation.tsx`, `src/app/globals.css`.
- Tests: `tests/foundation.test.mjs`.

## Component tree

- `Home` route remains a Server Component and composes:
  - `Header`
  - `main#main-content`
    - `section#raffle.home-hero` with the raffle discovery landmark and hero content
    - `section#release-information.release-info` as the semantic CTA destination
  - `Footer`
- `Header` remains server-rendered and delegates only mobile menu state to `MobileNavigation`.
- `MobileNavigation` remains the only client island in this slice.

## Server/client boundaries

- Home content is static typed presentation data imported on the server.
- No Supabase query, authentication state, cart state, payment state, order state, or raffle business state is introduced.
- Browser-only behavior remains limited to mobile navigation disclosure.

## Content model

The hero uses a typed presentation model with `mode`, `eyebrow`, `statusLabel`, `title`, `description`, `primaryAction`, `timingLabel`, `timeZoneLabel`, `media`, and `metadata` fields. This model is not a future raffle enum or database contract.

## Responsive behavior

- Large desktop/desktop: controlled two-column editorial layout with object-focused media and copy beside it.
- Tablet: reduced asymmetry while preserving CTA and status priority.
- Mobile: copy, CTA, metadata, and media stack without hover dependency; CTA appears immediately after supporting copy.

## Motion plan

- One primary CSS reveal for the object/media composition.
- Secondary motion is limited to restrained copy reveal and existing header color/backdrop transitions.
- `prefers-reduced-motion` disables or collapses animation duration globally.
- No WebGL, no 3D dependency, no continuous expensive animation.

## Accessibility plan

- Maintain `header`, `main`, named `section`, and `footer` landmarks.
- Keep one `h1` in the hero.
- CTA is a semantic anchor that targets an existing section.
- Mobile nav remains button-controlled with `aria-expanded` and `aria-controls`.
- Placeholder media is labeled as non-production; decorative layers are `aria-hidden`.
- Focus visibility remains centralized.

## Performance plan

- No new dependency, font, autoplay video, 3D viewer, or remote media.
- CSS-only material placeholder avoids image payload and hydration risk.
- Server Components remain the default; only mobile navigation hydrates.

## Placeholder asset strategy

Use an internal CSS material study labeled `PLACEHOLDER MEDIA — NOT PRODUCTION APPROVED`. It is replaceable through the typed presentation model and must not be described as approved product media.

## Test plan

Update tests to assert the approved navigation order, no account/cart placeholder, semantic hero/raffle section, CTA anchor validity, no fake countdown/open claim, reduced-motion support, safe forthcoming labels for unavailable routes, and documentation approval status.

## Rollback considerations

Revert this slice by restoring the prior Home skeleton, old navigation labels/order, old header/mobile cart placeholder, associated CSS, and documentation status updates. No data rollback is required because no database, Supabase, payment, order, cart, or authentication contract is mutated.

## Explicit non-goals

No full Archive, Shop, Commission, raffle entry form, account, cart, authentication, payment, order, Supabase data fetching, production raffle contract, production media approval, 3D viewer, dependency installation, or ERP workflow.
