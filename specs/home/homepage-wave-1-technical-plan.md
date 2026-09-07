# Homepage Wave 1 Technical Plan

Status: `IMPLEMENTED_WITH_ASSET_SYNC_LIMITATION`
Date: 2026-09-07

## Scope and evidence

The owner-approved experience script is the six-part Luminal Revival sequence recorded in the Wave 1 addendum of the formal Home specification. Repository audit found a clean `work` branch at `3e2b447`, no local or remote `master`, no configured Git remote, and no uncommitted changes. Existing scripts are `lint`, `typecheck`, `test`, `security`, `build`, and aggregate `check`. Existing dependencies already include Motion, GSAP, and Lenis, but Wave 1 needs none of them: CSS is sufficient.

The connected-resource inventory exposed no Google Drive resources or templates in this Codex session. The only approved visual binary available locally is `public/brand/luminal-factory-logo-primary.png`. Product imagery is therefore an explicit sync limitation: the implementation creates stable media frames and honest labels but does not invent, hotlink, or misclassify imagery. Replacing those frames with owner-approved optimized local exports is a follow-up asset-only operation.

## Architecture

- `src/app/page.tsx` remains a thin Server Component route.
- `src/features/home/home-page.tsx` owns semantic Home composition and remains server-rendered.
- `src/content/homepage.ts` owns typed static editorial content.
- `src/app/globals.css` extends existing tokens and contains responsive/reduced-motion presentation.
- Header, footer, navigation, UI primitives, and all commerce/data services remain unchanged.

## Experience mapping

1. **Luminal Revival hero:** subdued approved crystal mark, central object media frame, Archive primary CTA and Shop secondary CTA.
2. **Featured Object:** oversized media frame, title, collection/year, story, and Archive record link.
3. **Revival:** short Lazy Factory → Luminal Factory identity bridge with “Formerly Lazy Factory.”
4. **Selected Archive:** four-item editorial grid and full Archive link.
5. **Made at Luminal:** concept, sculpt, making, and finish as customer-facing craft narrative.
6. **Commerce split:** equal Shop and Commission doors, followed by the existing minimal footer.

## Motion, responsive, and accessibility

The primary motion is a one-shot hero object settle using transform and opacity. Secondary behavior is limited to existing link/CTA hover feedback and arrow response. There is no parallax loop, pointer listener, observer, timer, client island, or WebGL. Reduced motion removes the reveal and nonessential transitions. Tablet collapses major compositions; mobile uses single-column media/process and exposes every action without hover. Semantic sections, one `h1`, ordered headings, visible focus, textual links, reserved media aspect ratios, and useful placeholder labels are preserved.

## Trust and domain boundary

No Auth, cart, merge, order, payment, inventory, raffle, Supabase schema, RLS, runtime flag, API route, OTP path, production record, or gated feature is changed. The page makes no active-raffle, stock, price, winner, or payment claim. No STL, ZBrush source, sculpt master, GLB, or other production master is published.

## Asset completion gate

Before the visual batch can be considered production-media complete:

1. Expose the approved Drive folder/files to this Codex session or place exports in an agreed local staging path.
2. Record subject, ownership approval, dimensions, crop, alt text, and Home role.
3. Export browser-safe AVIF/WebP/JPEG variants without upscaling or production masters.
4. Copy only approved derivatives into `public/images/home/` with stable names.
5. Replace the two media frames and four Archive studies, then run desktop/mobile/reduced-motion visual checks and the full repository gate.

## Validation and rollback

Run `git diff --check`, `npm run lint`, `npm run typecheck`, `npm test`, `npm run security`, and `npm run build`; then inspect desktop/mobile screenshots. Rollback is source/docs/tests only and has no data rollback.
