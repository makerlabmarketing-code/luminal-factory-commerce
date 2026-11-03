# Homepage layout and performance pass

Status: approved direction for the current standalone Commerce stabilization slice. This is not a final redesign of every storefront page and does not resume ERP integration.

## Goal

Make the existing Homepage feel more like a dark artisan gallery while reducing unnecessary initial rendering and animation cost.

## Composition

Keep the current narrative order:

1. Hero / Mono Meowhe
2. Featured object
3. Revival interlude
4. Selected archive
5. Making process
6. Shop / Commission split

The pass should strengthen hierarchy rather than add sections.

### Hero

- Let the object occupy more visual area than the copy on wide screens.
- Keep copy left-aligned and compact.
- Preserve two clear actions without introducing additional promo cards.
- Decorative brand imagery must not compete with critical content or 3D resources for initial bandwidth.

### Featured object

- Keep large media plus a restrained sticky story column.
- Preserve generous negative space and avoid adding another animation layer.

### Revival interlude

- Use it as a quiet transition between one-object storytelling and the archive grid.
- No additional client-side animation is required.

### Archive

- Preserve the uneven editorial grid and product-first imagery.
- Defer below-fold rendering where the browser can do so safely.

### Making process

- Keep the current numbered sequence because the content is genuinely sequential.
- Sticky cards remain the primary scroll choreography for this viewport.
- Do not add particles, shader backgrounds, or extra continuous movement.

### Commerce split

- Keep Shop and Commission as two strong destination surfaces.
- The hover response is enough; no WebGL is needed here.

## Performance rules for this pass

- Keep Homepage itself a Server Component.
- Do not add Three.js / R3F yet.
- Keep Model Viewer isolated to the Hero client boundary.
- Pause Hero auto-rotation when the stage is offscreen.
- Remove non-essential continuous glow animation from the Hero stage.
- Do not priority-load purely decorative hero imagery.
- Use browser rendering deferral for safe below-fold sections.
- Preserve the cached/timeout-bounded Hero configuration read.
- Respect `prefers-reduced-motion` and retain the local Hero fallback.

## 2026-11-03 Lighthouse remediation

The owner requested correction of the Home Lighthouse findings. The intro no longer covers readable content with an opaque curtain or locks document scrolling; navigation is rendered in its usable state. Supporting copy and CTAs never wait for a reveal animation. Only desktop title transforms animate, without blur. The desktop/tablet 3D stage uses the existing idle scheduler even when selected as the primary scene. At <=699px the stage is disabled before a WebGL probe or runtime/model request, and the empty reserved corridor is removed. Live breakpoint and reduced-motion changes dispose/reinitialize the viewer safely. Hidden error-fallback artwork is lazy/low priority. The Meowhe colorway field exposes its accessible group role.

The original local production build scored Performance 57 / Accessibility 96 with FCP 1.06s, LCP 5.23s, TBT 1,030ms, Speed Index 3.51s and CLS 0. A post-change sample scored 94 / 100, LCP 3.03s, TBT 48ms, Speed Index 1.80s and CLS 0. These are synthetic cold mobile samples, not field data or a guaranteed Production score. Browser extensions are excluded. Production measurements and smoke results are recorded in the delivery handoff.

The Next.js legacy polyfill audit is a small framework compatibility cost; do not remove framework polyfills or narrow supported browsers speculatively. The Home response remains request-rendered so published Hero/raffle data is not frozen. The bfcache/no-store diagnostic is not addressed by weakening that freshness contract. Extension-owned scripts are outside storefront source and must be excluded when retesting.

## Mobile

- Keep a single-column hero. Phones <=699px render the copy and actions without a 3D stage; tablets retain the object.
- Avoid additional parallax layers.
- Keep tablet 3D inspectable and reduced motion static; do not load model-viewer on phones.
- Keep Shop and Commission stacked.

## Exit criteria

- Existing page hierarchy remains understandable without animation.
- The Hero feels object-led rather than text-led on wide screens.
- No new runtime dependency is added.
- No new Production env, Supabase mutation, or runtime flag is required.
- Repository quality gate passes.

## 2026-11-03 — Preserve approved motion after performance remediation

Restore the approved liquid FlexCarousel as an optional desktop enhancement. Its
chunk is requested only within 240px of the gallery and only with a fine pointer,
wide viewport, normal motion and no data-saver preference. Native images remain
visible until real textures are ready; module/image/WebGL failures retain native
navigation. Repeated intersection callbacks never reset an already-ready canvas.
The existing engine pauses offscreen and cleans up on teardown. Mobile/reduced
motion stay native; wheel input continues vertical page scrolling.

The first-visit desktop brand intro again has its dark veil and logo materialize /
dock sequence. The veil exits in CSS at 760ms and the entire decorative layer has
a 1500ms safety exit even without hydration. Logo docking begins on its own short
timer, independent of runtime/model downloads. Navigation/copy remain rendered,
scroll is not locked, and phone/reduced-motion visits skip the decorative layer.
The original multi-second wait for 3D is not reinstated. Performance must be
remeasured with this restored motion; earlier scores describe the prior batch.

The intro session marker is versioned to v2 so prior v1 visits can see the restored first-visit sequence once after rollout.
