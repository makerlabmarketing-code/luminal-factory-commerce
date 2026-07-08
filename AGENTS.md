# Luminal Factory Commerce Agent Guide

## Repository Identity

This repository is the public customer-facing storefront for Luminal Factory.

Luminal Factory is a raffle-first artisan commerce and collectible-object brand focused primarily on artisan keycaps and crafted objects.

This repository is not a generic ecommerce starter.

This repository is not the Luminal Factory ERP.

The storefront owns public brand experience and customer-facing commerce workflows.

The ERP owns operational back-office workflows.

Do not move ERP-only workflows into this repository unless an approved architecture change explicitly requires it.

ERP-only concerns include:

- staff management
- attendance
- payroll
- internal production administration
- operational inventory administration
- internal finance administration
- raffle winner administration
- internal commission operations

## Governing Project Skill

Repository-specific project guidance lives in:

    .agents/skills/luminal-commerce/

The primary skill is:

    .agents/skills/luminal-commerce/SKILL.md

For non-trivial work, read the skill and the smallest relevant set of reference files required for the task.

Do not load every reference document when the task only concerns one area.

Relevant references include:

    references/project-context.md
    references/architecture.md
    references/coding-style.md
    references/commerce-domain.md
    references/supabase-contract.md
    references/ui-rules.md
    references/workflow.md

The Luminal Commerce skill governs:

- product direction
- commerce terminology
- architecture boundaries
- Supabase assumptions
- UI direction
- motion principles
- repository workflow

## Reference Analysis Skill

External websites and repositories are references, not final design authorities.

For structured reference analysis, use:

    .codex/skills/reference-analysis/SKILL.md

Use reference analysis for:

- motion research
- interaction research
- 3D scene research
- layout principles
- commerce structure
- component behavior
- technical pattern analysis

Do not perform a pixel-perfect clone by default.

Do not copy:

- branding
- logos
- proprietary assets
- product names
- page copy
- complete page compositions
- visual identity

A reference must be translated into a Luminal-specific adaptation.

When source code, prompts, or implementation evidence are available, distinguish:

- observed behavior
- source-confirmed behavior
- inferred technical implementation

Do not present visual inference as confirmed implementation fact.

## Current Project Phase

The storefront is currently in foundation and design-definition phase.

Major page designs are not all finalized.

The project intentionally works page by page.

Do not build a complete page from a loose description.

Before major page implementation:

1. discuss the experience
2. approve the page script
3. create or update the formal specification
4. clarify ambiguous requirements
5. create the technical plan
6. create implementation tasks
7. analyze artifact consistency
8. implement the approved scope
9. validate
10. identify remaining gaps

The intended workflow is specification-first and design-led.

## Page Approval Gate

A page is not ready for full implementation only because:

- a visual reference was found
- a screenshot exists
- an animation looks interesting
- a user mentioned a section idea
- an AI agent can technically build it

A major page is implementation-ready when its experience script and specification are approved.

Until then, analysis, documentation, prototypes, or isolated technical experiments may be appropriate.

Do not silently turn an experiment into the production page architecture.

## Commerce Priority

The storefront is raffle-first.

Primary commerce priority:

1. Raffle
2. Archive
3. Shop
4. Commission

The exact navigation may evolve through approved design work, but standard ecommerce browsing must not automatically become the dominant experience.

The Home page should prioritize active or current raffle discovery before broad shop browsing.

## Domain Integrity

Preserve domain meaning.

A Product is not a Raffle.

A Raffle Entry is not an Order.

An unsuccessful raffle entry must not create an order.

A Payment is not a Shipment.

A Commission Request is not automatically an Order.

Revenue must derive from authoritative financial transactions and refunds rather than an unrelated manually maintained revenue total.

Do not rename conceptual commerce states independently in the storefront when the state is expected to be shared with the ERP.

Domain contract changes require documentation review.

## Storefront and ERP Data Boundary

The storefront and ERP should eventually use the same Supabase project or an explicitly shared backend data contract.

The final shared-code architecture is not yet locked.

Possible future strategies include:

1. shared domain package
2. monorepo shared package
3. generated database contracts plus shared validation contracts

Do not permanently duplicate evolving shared commerce enums without documenting the risk.

Do not force the repositories into or out of a monorepo before the ERP repository has been audited.

Do not import ERP source code into the storefront through hidden filesystem coupling.

## Architecture Rules

Use Server Components by default.

Use Client Components only when browser interaction is required.

Valid client-side responsibilities include:

- pointer interaction
- browser events
- GSAP timelines
- Lenis integration
- Motion interaction
- React Three Fiber scenes
- Model Viewer interaction
- form interaction
- local visual state

Do not add `"use client"` to an entire page only because one child requires browser APIs.

Keep route files thin.

Route-level code should primarily:

- resolve route parameters
- load page-level server data
- enforce page-level access requirements
- compose the page experience

Keep business rules outside visual components.

Do not place raffle eligibility, payment semantics, inventory enforcement, or commission lifecycle rules directly inside presentational JSX.

Keep Supabase access behind explicit data or service boundaries.

Do not scatter raw Supabase queries through motion, 3D, or visual components.

## Motion Architecture

Motion is part of Luminal Factory's product experience.

Motion must communicate:

- material
- weight
- assembly
- depth
- state transition

Use the simplest appropriate technology.

Use CSS for:

- simple hover
- opacity
- basic transforms
- basic visual state transitions

Use Motion for:

- local component interaction
- layout transitions
- interface state changes

Use GSAP for:

- choreographed timelines
- scroll sequencing
- pinned sections
- page transitions
- coordinated multi-element state changes

Use React Three Fiber for:

- custom real-time 3D scenes
- custom lighting
- complex pointer-reactive 3D interaction
- shaders

Use Model Viewer for:

- simple GLB presentation
- product inspection
- rotate and zoom experiences

Do not introduce WebGL solely because an element rotates.

## Motion Budget

Each viewport should normally contain:

- one primary motion
- a maximum of two secondary motions

Before adding another continuous visual effect, identify its role.

Do not introduce:

- random particle backgrounds
- glowing pointer trails
- constant glitch
- permanent chromatic aberration
- excessive glassmorphism
- competing continuous hero animations

The Luminal adaptation of energetic references should generally feel:

- slower
- heavier
- darker
- magnetic
- controlled
- refractive

## 3D Rules

Production sculpt masters are not browser assets.

Do not publish STL manufacturing files or high-density sculpt masters as public web assets.

Web 3D models are derived distribution assets.

A typical asset pipeline may include:

    sculpt master
    -> optimization
    -> retopology or decimation when appropriate
    -> material and texture preparation
    -> web GLB
    -> production optimization

Keep 3D scene logic separate from commerce and Supabase logic.

A 3D scene must have a mobile and reduced-motion strategy before production completion.

Do not use real-time 3D for every product card.

## Visual Direction

Luminal Factory should feel like a dark contemporary artisan gallery.

The experience should be:

- dark
- editorial
- atmospheric
- physical
- object-focused
- controlled
- experimental

Material references may include:

- obsidian
- dark metal
- aged metal
- crystal
- diamond
- refraction
- iridescent reflection
- liquid surfaces

Preferred reflective accent families include:

- ice blue
- pale pink
- lavender
- diamond white

These are material and light cues.

Do not automatically turn them into bright default button colors.

Avoid:

- generic SaaS composition
- gaming RGB
- cyberpunk UI
- neon everywhere
- generic AI gradients
- template ecommerce layouts

External references must be adapted into Luminal Factory's visual system.

## Dependency Rules

Before adding a dependency:

1. inspect `package.json`
2. identify the problem being solved
3. check whether an existing dependency already owns that responsibility
4. confirm the dependency matches project architecture

Current conceptual responsibilities are:

- GSAP: timeline and scroll choreography
- Motion: local component interaction
- Lenis: smooth scrolling
- React Three Fiber: custom real-time 3D
- Model Viewer: simple product 3D inspection
- Supabase: shared backend
- Zod: boundary validation
- React Hook Form: complex interactive forms

Do not install overlapping libraries without explicit justification.

Do not install future dependencies only because they may be useful someday.

## Coding Rules

Use strict TypeScript.

Do not use `any`.

Do not use unsafe type assertions to hide uncertain data.

Validate untrusted boundaries.

Prefer explicit domain names over generic names.

Keep components focused.

Clean up:

- event listeners
- animation contexts
- observers
- timers
- animation frames

Do not leave browser effects running after a component unmounts.

Preserve unrelated behavior during focused tasks.

Do not perform repository-wide aesthetic refactors during an unrelated feature task.

## Supabase and Security

Never expose privileged Supabase credentials through `NEXT_PUBLIC_*`.

Do not commit environment secrets.

Assume customer-owned data requires appropriate RLS or a trusted server boundary.

Critical raffle, inventory, and payment rules must not rely only on browser state.

Do not mark payment as successful because a browser reached a success page.

Do not treat a disabled button as a security or commerce enforcement mechanism.

## Validation

Before assuming a package script exists, inspect:

    npm run

Use the actual scripts defined by the repository.

Relevant validation may include:

    npm run lint
    npm run typecheck
    npm run build
    npm run test

Use:

    npm run check

only when the repository defines the script.

For motion-heavy changes, also validate:

- initial load
- repeated interaction
- pointer behavior
- scroll behavior
- resize
- cleanup
- reduced motion
- mobile fallback

For 3D changes, also validate:

- slow asset loading
- asset load failure
- resize
- mobile behavior
- device performance
- scene cleanup

For commerce changes, also validate:

- trust boundary
- authentication assumptions
- duplicate submissions
- stale data
- lifecycle rules
- time-based state
- error handling

Do not claim validation passed unless the command or check was actually performed.

## Documentation Changes

Update durable project guidance when changing:

- architecture boundaries
- commerce domain contracts
- raffle lifecycle
- payment semantics
- Supabase assumptions
- motion conventions
- repository workflow

Do not update long-lived documentation for trivial implementation details.

## Completion Behavior

After non-trivial implementation work, report:

1. what changed
2. important files changed
3. validation performed
4. known limitations
5. unresolved domain or architecture decisions

Keep completion summaries factual.

Do not claim a page, feature, test, or validation step is complete when it was not actually completed.