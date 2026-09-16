---
name: design-taste-frontend
description: Use to set the visual read and critique hierarchy, density, motion, spacing, and anti-template quality in Luminal storefront work before a UI batch is considered finished.
metadata:
  source: Leonxlnx/taste-skill v2
  license: MIT upstream
  adaptation: luminal-factory-commerce
---

# Design Taste for Luminal

This skill is an art-direction and critique layer, not a design system. Luminal's `ui-rules.md`, approved page scripts, accessibility rules, and commerce behavior always win.

## Design read first

Before meaningful storefront UI work, state a one-line design read from the actual brief and current implementation:

- surface kind and visitor intent;
- audience;
- visual language;
- one primary visual idea.

Default Luminal read when the brief does not override it:

> Dark contemporary artisan gallery for design-conscious collectors; object-first, editorial, physical, atmospheric, and controlled.

Do not default to generic SaaS composition, centered template sections, card grids, AI-purple glow, or motion added only because a library makes it easy.

## Luminal dials

Use these as critique dials, not implementation APIs:

- `DESIGN_VARIANCE: 8` — editorial asymmetry is welcome when hierarchy stays legible.
- `MOTION_INTENSITY: 6` — one authored motion moment plus at most two supporting motions per viewport.
- `VISUAL_DENSITY: 3` — collectible objects need breathing room; supporting metadata should compress before the focal object does.

Change a dial only when the user brief or an approved page script clearly requires it.

## Review axes

### Hierarchy

- Can a new visitor identify the focal object before reading every label?
- Is the primary action obvious without turning the page into a CTA grid?
- Does each section have one clear visual center?
- Does the composition still work when motion is disabled?

### Density

- Give hero and product media enough negative space to feel collectible.
- Compress metadata and supporting copy rather than shrinking the focal object.
- Avoid repeated card shells when proximity and spacing communicate the group more clearly.
- Large surfaces must earn their empty space with scale, material, imagery, or intentional composition.

### Motion

- One primary motion per viewport, at most two supporting motions.
- Prefer weight, settle, depth, and refraction over bounce or constant movement.
- Continuous effects must justify GPU cost and stop when offscreen when possible.
- Mobile receives a simpler choreography rather than a shrunken desktop scene.
- Interaction needs a visible state change; ambient glow alone is not an affordance.

### Material

- Treat ice, rose, lavender, gold, and white as reflected light, not generic UI colors.
- Keep surfaces predominantly black and near-black so product material remains the visual event.
- Light should appear to come from a deliberate source rather than from every edge at once.

### Interaction

- Hover should communicate activation before decoration: border, surface, or depth response first; glow supports that response.
- Focus states must remain visible and independent from hover.
- Touch targets must not depend on hover behavior.
- Pointer effects must remain local unless `ui-rules.md` explicitly approves a global behavior.

## Anti-slop pass

Before delivery, remove or redesign anything that could be transplanted unchanged into a generic SaaS landing page:

- equal feature-card rows with identical weight;
- decorative gradients without material meaning;
- repeated eyebrow + centered heading + centered paragraph scaffolds;
- glass panels used only because the page is dark;
- oversized empty cards whose content has no visual counterweight;
- motion that repeats the same entrance on every section.

## Final critique

Before delivery:

1. remove one unnecessary decorative treatment;
2. verify the page is still recognizably Luminal without animation;
3. confirm the focal object or idea still wins the squint test;
4. confirm the page does not become denser simply because more effects were added.

## Source

Upstream reference: `Leonxlnx/taste-skill` v2.

Use upstream methodology as critique input only. Do not import its stylistic defaults wholesale or let it override Luminal's approved visual contracts.
