# HOME-3D-SCROLL-01 Technical Plan

Status: `OWNER_APPROVED / PROTOTYPE_IMPLEMENTATION`
Date: 2026-09-23

## Goal

Adapt the motion principles visible in the owner-supplied NOZO recording into Luminal Home without copying the reference identity or assets.

## Architecture

1. Keep `HomePage` server-rendered.
2. Add one narrow client island, `HomeImmersiveExperience`.
3. Reuse `HeroObjectStage` and the existing Model Viewer runtime.
4. Add an explicit Hero object-ready browser event.
5. Mount the Hero model eagerly in the page, independently of navigation and copy.
6. Keep the visual 3D layer fixed on eligible desktop clients while scroll maps section positions to transform keyframes.
7. Disable page-wide traversal for coarse pointer, narrow viewport and reduced motion.
8. Preserve raffle-first authority: if a featured raffle is present, fall back to the current inline Hero object until a dedicated raffle/model integration is approved.

## Intro lifecycle

The page and navigation are available on first paint. The home model starts loading immediately on eligible devices. Its first-frame callback starts a 1.6-second reveal with a 20 px lift and a scale change from 96% to 100%. The atmosphere brightens first and copy follows at 100 ms intervals. The scroll controller owns the model transform throughout. Scrolling during the intro eases out its remaining offset over 200 ms. If the first frame arrives after a scroll, the model fades into the active scroll pose.

## Desktop scroll keyframes

- Hero: horizontally centered with the character raised slightly to balance its base.
- Meet Meowhe: settle the model on the left and hold its size/orientation.
- Colorways: on arrival, immediately play a reversible staggered 2.96-second reveal from behind the model. Curved travel decelerates with cubic ease-out as circles grow from 8% to full size.
- Reverse scroll: the first upward scroll immediately rewinds the timeline toward the current model position, including while the scene remains pinned. Play the exact reveal timeline backward at the same speed: circles follow the same curved paths and shrink in reverse stagger order, while the title and light fade along the same timeline. There is no accelerated return or extra hold after the last circle settles. Replay when scrolling down again.
- Stage light: a restrained static beam brightens with the reveal and connects the model, title and three separated colorways.
- Exit: limit the section to 125svh so the model and composition leave after a short hold, rather than requiring several wheel gestures. The model scrolls out with the sticky Meet Meowhe composition. It does not travel through subsequent sections or fade independently.
- Mobile: use a compact upper-left model, centered title and separated surrounding circles. Reduced motion shows the static composition.

Actual section offsets are measured from the DOM after hydration and recomputed on resize.

## Validation

Repository checks:
- typecheck/build through Vercel Preview.
- static contract tests for the readiness event, max loader timeout, mobile/reduced-motion gates and reference-asset isolation.

Manual visual checks required before Production merge:
- first hard load.
- repeat load in same session.
- slow model load/failure.
- scroll forward/backward.
- resize.
- mobile.
- reduced motion.
- active featured-raffle fallback.

## Production gate

This prototype may be Previewed for visual approval. Merge to Production only after the owner confirms motion feel, model path and loader timing.

## Featured-to-gallery motion

Meowhe moves to the center of section three and eases to a front view. Six production photos follow one rising cylindrical path with narrow gaps. A shared perspective scales both axes, and adjoining slices within each photo follow the bend. After Meowhe is covered, the spiral gets 0.42 additional stable viewport heights of scroll and sweeps to the upper right after entering from the lower left. The stationary caption starts fading before the corner arrivals. Gallery tiles begin their staggered flight while the last spiral tile is still visible, then settle around the vertical center. The gallery uses about 60% of the desktop viewport, capped at 72rem, and the rear pass is farther from the camera and its arrivals use the longer scroll interval. The first photo hides Meowhe at the center. The complete strip exits above the viewport as tiles begin flying in from all four corners of the viewport. Scroll controls both phases in either direction. The cyan stroke is paused for this handoff. Phones retain the photo stand-in, and the static grid remains available for reduced-motion and constrained devices.
