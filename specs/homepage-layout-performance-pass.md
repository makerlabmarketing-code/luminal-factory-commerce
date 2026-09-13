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

## Mobile

- Keep a single-column hero with the object after the copy.
- Avoid additional parallax layers.
- Let the existing 3D object remain inspectable, but do not add desktop-only motion systems to mobile.
- Keep Shop and Commission stacked.

## Exit criteria

- Existing page hierarchy remains understandable without animation.
- The Hero feels object-led rather than text-led on wide screens.
- No new runtime dependency is added.
- No new Production env, Supabase mutation, or runtime flag is required.
- Repository quality gate passes.
