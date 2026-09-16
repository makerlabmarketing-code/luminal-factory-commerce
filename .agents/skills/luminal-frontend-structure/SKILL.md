---
name: luminal-frontend-structure
description: Use to review and improve Luminal frontend layout structure, reading order, grouping, rhythm, responsive behavior, and bounded visual QA without changing product truth or business logic.
metadata:
  source: pbakaus/impeccable methodology
  license: Apache-2.0 upstream
  adaptation: luminal-factory-commerce
---

# Luminal Frontend Structure Review

This skill adapts structural review ideas from Impeccable into the existing Luminal workflow. It is guidance only. It does not install or require the Impeccable CLI, binary, hook, browser tooling, or any runtime dependency.

Luminal's `ui-rules.md`, page scripts, accessibility requirements, commerce behavior, and Production gates remain authoritative.

## 1. Establish the spatial thesis

Before moving boxes, state:

- the primary reading or task path;
- what belongs together and what must separate;
- which element leads and which supports;
- the intended density and spacing rhythm;
- how the structure changes on mobile, tablet, wide desktop, keyboard, and touch.

If those relationships are unclear, do not solve the page by adding more containers.

## 2. Run the visual structure pass

Review representative states with these questions:

### Reading order

Use the squint test. With details visually blurred, can the primary element, secondary element, and major groups still be identified in the intended order?

### Grouping

Are related items grouped by proximity, or are borders/cards compensating for weak spacing?

### Rhythm

Do tight and generous intervals create cadence, or is the same gap repeated until every section has equal weight?

### Structure

Does the topology match the content? Repeated cards and columns are valid only when their information is truly equivalent.

### Density

Does the amount of information in each region match visitor intent and frequency of use? Marketing/gallery surfaces should not inherit dashboard density.

### Adaptation

At narrow, intermediate, and wide sizes, determine what reorders, collapses, wraps, scrolls, or becomes static. DOM order and focus order must remain coherent with the visual order.

### Extremes

Check long copy, short copy, missing media, loading/error/empty states, zoom, sticky elements, and small touch targets before calling the structure finished.

## 3. Apply with the existing stack

- Group by meaning and proximity before adding borders or elevation.
- Use deliberate contrast between tight and generous spacing.
- Prefer stable grid relationships over percentage flex math.
- Use depth only when it clarifies hierarchy or state.
- Make optical corrections only after inspecting the rendered result.
- Preserve semantic HTML, keyboard order, focus states, and reduced-motion behavior.
- Do not introduce a new layout or animation dependency only to solve spacing or hierarchy.

## 4. Interaction hierarchy

For interactive surfaces, activation must read in this order:

1. state change or affordance;
2. local material response;
3. decorative light or motion.

A glow without a clear hover/focus state is decoration, not interaction.

## 5. Bounded QA

Avoid endless visual iteration.

1. Inspect desktop and mobile together when possible.
2. Collect defects into one batch.
3. Fix the batch.
4. Run at most one confirmation pass before handing off for user review, unless a real regression remains.

Use existing Preview, screenshots, CI, and free project tooling. Do not require a paid browser service to complete this skill.

## Source

Methodology adapted from `pbakaus/impeccable` concepts such as spatial thesis, squint/grouping/rhythm review, responsive extremes, and bounded QA. Do not copy or install the upstream toolchain as part of normal Luminal frontend work.
