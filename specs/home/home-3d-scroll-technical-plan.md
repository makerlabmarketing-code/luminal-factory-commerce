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
5. Mount the Hero model eagerly behind the loader for the first Home visit.
6. Keep the visual 3D layer fixed on eligible desktop clients while scroll maps section positions to transform keyframes.
7. Disable page-wide traversal for coarse pointer, narrow viewport and reduced motion.
8. Preserve raffle-first authority: if a featured raffle is present, fall back to the current inline Hero object until a dedicated raffle/model integration is approved.

## Intro lifecycle

```text
Home hydration
  -> lock document scroll
  -> eager Hero object mount behind veil
  -> minimum 2.1s identity reveal
  -> wait for object ready OR maximum 4.8s fallback
  -> logo settles from center to top-left
  -> veil fades
  -> unlock scroll
  -> mark intro seen for current browser session
```

The timer does not pretend to measure asset progress. The object-ready event is the readiness boundary.

## Desktop scroll keyframes

- Hero: large object on the right.
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
