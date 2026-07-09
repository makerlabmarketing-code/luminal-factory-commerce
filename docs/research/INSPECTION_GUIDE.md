# Reference Inspection Guide

## Purpose

Use this guide when studying external websites as references for Luminal
Factory. The goal is to understand useful behavior, structure, and technical
patterns, then translate them into Luminal-specific direction.

This is not a cloning workflow. Do not copy another brand's identity, assets,
copy, product names, or complete layouts.

## Phase 1: Scope

Identify:

- reference URL
- exact page or section being studied
- analysis mode: visual, motion, interaction, 3D, layout, commerce, content
  structure, engineering architecture, or component behavior
- Luminal page or feature the reference may inform

Do not inspect an entire site when the request concerns one interaction or
section.

## Phase 2: Observed Experience

Document what can be directly observed before inferring implementation:

- page or section sequence
- primary visual object or content focus
- layout rhythm and spatial layers
- interaction triggers
- motion start state, transition, and settle behavior
- responsive behavior
- loading, empty, and error states when visible

Separate:

- `OBSERVED`: visible behavior
- `SOURCE-CONFIRMED`: behavior verified by source, prompt, or code
- `INFERRED`: plausible implementation based on inspection

## Phase 3: Luminal Adaptation

For each useful reference behavior, record:

```text
REFERENCE BEHAVIOR

WHY IT WORKS

DO NOT COPY

LUMINAL ADAPTATION
```

Luminal adaptation must respect:

- raffle-first commerce priority
- approved page scripts and specifications
- dark, editorial, atmospheric, physical, object-focused, controlled, and
  experimental visual direction
- motion budget of one primary motion and no more than two secondary motions per
  viewport
- reduced-motion behavior and mobile fallbacks

## Phase 4: Technical Assessment

Identify the simplest plausible technology for the observed behavior.

Use the Luminal motion hierarchy:

- CSS for simple visual transitions
- Motion for local component and layout interaction
- GSAP for choreographed timelines, scrolling, and coordinated state transitions
- React Three Fiber for custom real-time 3D scenes
- Model Viewer for simple product GLB inspection

Do not recommend WebGL merely because a scene looks visually rich.

## Phase 5: Output

When a reference materially affects project direction, a page specification, a
motion system, commerce structure, or implementation planning, create or update
a durable note under:

```text
docs/research/references/
```

Use sections for:

- Scope
- Why This Reference Matters
- Observed Experience
- Interaction Model
- Spatial Layers
- Motion Breakdown
- Technical Assessment
- Source-Confirmed Details
- What Must Not Be Copied
- Luminal Adaptation
- Performance Considerations
- Applicable Luminal Pages

Reference analysis does not authorize major page implementation. The
specification-first workflow still applies.
