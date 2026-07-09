# UI and Motion Rules

## Ownership

This file is the authoritative owner of Luminal Factory visual direction, surface and accent direction, product presentation priority, motion vocabulary, motion budget, animation technology choices, 3D asset rules, pointer interaction, mobile behavior, reduced-motion behavior, and hard visual guardrails.

Third-party UI recommendations and external references are advisory. Adapt them to this file, approved page scripts, and formal specifications.

## Experience Direction

Luminal Factory is a dark contemporary artisan gallery.

The website should present collectible objects with atmosphere, depth, and restraint.

The website must remain usable as commerce.

## Core Visual Characteristics

The visual experience should feel:

- dark
- editorial
- physical
- atmospheric
- controlled
- experimental
- object-focused

Avoid visual language associated with:

- generic SaaS
- gaming RGB
- cyberpunk
- excessive neon
- template ecommerce
- AI-generated gradient spam

## Surface Direction

Recommended dark surface hierarchy:

- Primary background: #050505
- Secondary background: #0A0A0A
- Surface: #101010
- Elevated surface: #161616

Suggested low-contrast border:

    rgba(255, 255, 255, 0.08)

Suggested primary text:

    #F2F2F0

Suggested secondary text:

    #9A9A96

These are directional values.

Promote finalized values into project design tokens.

## Accent Direction

Accent is material-driven.

Preferred reflective colors:

- Ice blue: #B9E9FF
- Pale pink: #F3C9E8
- Lavender: #C8C4FF
- Diamond white: #EEF8FF

Do not make every button bright blue or pink.

Accent should primarily appear in:

- reflection
- refraction
- selected states
- light sweeps
- 3D materials
- intentional focus moments

## Typography

Typography is part of the composition.

Use confident scale contrast.

Large headings may function as spatial elements.

Avoid repeating the common SaaS pattern of:

- eyebrow
- centered heading
- centered paragraph
- two buttons
- three feature cards

Editorial layouts may use asymmetry and deliberate offsets.

## Product Priority

Presentation priority:

1. Object.
2. Story.
3. Commerce.

This does not mean commerce controls should be hard to find.

Product media should receive visual priority.

Commerce actions must remain clear and responsive.

## Motion Philosophy

Motion communicates:

- material
- weight
- assembly
- depth
- transition between states

Motion should not exist only to decorate.

## Motion Vocabulary

### ASSEMBLE

Fragments align into final form.

Use for:

- hero typography
- selected identity moments
- object titles

### SLICE

Visual material separates into vertical or faceted sections.

Use for:

- page transition
- selected image reveals
- crystal-inspired transitions

### DEPTH

Objects approach or recede from the viewer.

Use for:

- hero objects
- product focus
- raffle presentation

### REFRACTION

Light shifts across a surface.

Use for:

- crystal materials
- selected CTA states
- object interaction

### SETTLE

Motion resolves with physical weight.

Allow subtle lag or controlled overshoot.

### VEIL

A full-screen transition layer.

Use between selected major experiences.

Do not apply a full viewport transition to every minor action.

## Motion Budget

Each viewport may contain:

- 1 primary motion
- a maximum of 2 secondary motions

Example hero:

Primary motion:

- 3D object scene

Secondary motions:

- typography assembly
- pointer interaction

Do not add additional random particles or continuous background effects to the same viewport.

## Animation Technology

Use the simplest appropriate technology.

### CSS

Use CSS for:

- hover
- simple transforms
- simple opacity
- basic state change

### Motion

Use Motion for:

- component interaction
- local layout transition

### GSAP

Use GSAP for:

- timelines
- scroll choreography
- pinned sequences
- page transitions
- complex state transitions

### React Three Fiber

Use React Three Fiber for:

- real 3D scenes
- custom lights
- custom pointer behavior
- shaders

### Model Viewer

Use Model Viewer for:

- product inspection
- rotate and zoom interaction
- simple GLB presentation

Do not use a WebGL scene for an effect achievable with CSS.

## GetLayers Soda Reference

Soda is a technical motion reference.

Study:

- central real 3D object
- cursor-driven camera orbit
- background and foreground depth layers
- repeated GLB instances
- pointer proximity interaction
- GSAP state switching
- texture swapping

Luminal adaptation must be:

- slower
- heavier
- darker
- more magnetic
- less playful
- less elastic
- more controlled

Do not reproduce:

- bubbles
- fruit explosion
- bright beverage palette
- continuous energetic bounce

## Home Hero Direction

Current directional concept:

1. Crystal Slice entry.
2. Central hero object.
3. Foreground and background crystal depth.
4. Pointer-driven object tilt.
5. Magnetic crystal drift.
6. Scroll depth sequence.

The exact Home script is not finalized.

Do not implement this as a finished page before the Home page specification is approved.

## 3D Asset Rules

Production sculpt masters must not be shipped directly to the browser.

A web model is a derived asset.

Conceptual pipeline:

    Nomad or sculpt master
    -> Blender
    -> decimate or retopology
    -> UV and bake when required
    -> material optimization
    -> web GLB

Use appropriate compression and asset optimization when production assets are finalized.

Do not publish STL manufacturing assets.

## Pointer Interaction

Pointer interaction should feel intentional.

Preferred cursor states may include:

- EXPLORE
- DRAG
- VIEW
- ENTER
- OPEN

Do not use a glowing cursor trail across the entire site.

3D proximity interaction should favor:

- magnetic drift
- slow avoidance
- controlled rotation
- settle

rather than chaotic repulsion.

## Mobile

Desktop effects must not automatically be copied 1:1 to mobile.

Mobile may use:

- automatic object rotation
- simplified 3D scenes
- lower object counts
- reduced scroll choreography
- static visual fallback

Commerce workflows must remain fully usable.

## Reduced Motion

Respect `prefers-reduced-motion`.

Critical navigation and commerce must work without animation.

Reduced motion may:

- skip slice choreography
- disable parallax
- reduce 3D camera movement
- replace scroll timelines with static transitions

## Hard Guardrails

Default to restrained, material-led atmosphere: one primary motion, at most two secondary motions per viewport, object-focused composition, and accents that behave like reflection or refraction rather than generic decoration.

Do not introduce:

- random particle fields
- mouse trails
- constant glitch
- chromatic aberration everywhere
- excessive glassmorphism
- excessive gradients
- neon borders on all controls
- animated backgrounds without purpose
- multiple competing hero effects
