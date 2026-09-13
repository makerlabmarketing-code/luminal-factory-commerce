---
name: design-taste-frontend
description: Use to critique density, motion, hierarchy, spacing, and visual restraint in Luminal storefront work before a UI batch is considered finished.
metadata:
  source: Leonxlnx/taste-skill
  license: MIT upstream
  adaptation: luminal-factory-commerce
---

# Design Taste for Luminal

This skill is a critique layer, not a design system. Luminal's `ui-rules.md` remains the source of truth.

## Review axes

### Hierarchy

- Can a new visitor identify the focal object before reading every label?
- Is the primary action obvious without turning the page into a CTA grid?
- Does each section have one clear visual center?

### Density

- Give hero and product media enough negative space to feel collectible.
- Compress metadata and supporting copy rather than enlarging every surface.
- Avoid repeated card shells when simple spatial separation communicates more clearly.

### Motion

- One primary motion per viewport, at most two supporting motions.
- Prefer weight, settle, depth, and refraction over bounce or constant movement.
- Continuous effects must justify their GPU cost and should stop offscreen when possible.
- Mobile receives a simpler choreography rather than a shrunken desktop scene.

### Material

- Use ice, rose, lavender, and white accents as reflected light, not generic UI colors.
- Keep surfaces predominantly black and near-black so product material remains the visual event.

### Interaction

- Hover states should reveal affordance, not restyle the entire component.
- Focus states must remain visible.
- Touch targets must not depend on hover behavior.

## Final critique

Before delivery, remove one unnecessary decorative treatment and verify that the page is still recognizably Luminal without animation. If it is not, the static composition is too weak.

## Source

Upstream reference: `Leonxlnx/taste-skill`.

Use the upstream project as a design-critique reference only. Do not import its stylistic defaults wholesale.
