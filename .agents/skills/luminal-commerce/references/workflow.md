# Development Workflow

## Core Workflow

Luminal Factory uses a design-led, specification-first workflow.

The intended sequence is:

1. Discuss.
2. Lock the experience script.
3. Specify.
4. Clarify.
5. Plan.
6. Create tasks.
7. Analyze.
8. Implement.
9. Validate.
10. Converge.

Do not skip directly from a loose idea to full-page implementation.

## Current Project Phase

The storefront is currently in foundation and design-definition phase.

The team is discussing pages individually.

Do not implement a complete page before the page experience has been approved.

Current design discussions may include:

- information hierarchy
- page story
- section order
- interaction
- motion
- 3D usage
- commerce role

## Before Editing

For any non-trivial task:

1. Inspect the repository.
2. Read relevant skill references.
3. Locate existing implementation.
4. Trace dependencies and callers.
5. Inspect package scripts.
6. Identify data and domain impact.

Do not assume the project matches a generic Next.js starter.

## Planning Rule

Separate:

- what
- why
- how
- execution

### What and Why

Belong in the feature or page specification.

### How

Belongs in the technical plan.

### Execution

Belongs in tasks.

Do not pollute product specifications with premature framework details unless the technology is itself a requirement.

## Page Workflow

For each major page:

1. Define page purpose.
2. Define target user.
3. Define primary action.
4. Define narrative sequence.
5. Define sections.
6. Define primary motion.
7. Define secondary motions.
8. Define data requirements.
9. Define mobile behavior.
10. Define reduced-motion behavior.
11. Approve page script.
12. Create formal spec.
13. Create technical plan.
14. Generate tasks.
15. Implement.

## Reference Analysis

External references are studied for specific behavior.

For each reference, identify:

1. What is useful.
2. Why it works.
3. What must not be copied.
4. How Luminal should adapt it.

Do not combine multiple reference sites literally.

## Implementation Scope

Prefer small reviewable changes.

Avoid requests such as:

    build the full ecommerce website

Prefer tasks such as:

    implement the approved Home hero scene according to the current spec

A task should have a clear completion boundary.

## Existing Code

Before replacing existing code:

- inspect why it exists
- inspect callers
- inspect tests
- inspect related documentation

Do not rewrite unrelated code during a focused task.

## Dependencies

Before installing a package:

1. Verify existing dependencies.
2. Identify the problem being solved.
3. Confirm the package matches project architecture.
4. Avoid overlapping libraries.

Current conceptual technology roles:

- GSAP: timeline and scroll choreography
- Motion: local component interaction
- Lenis: smooth scrolling
- React Three Fiber: custom real 3D scenes
- Model Viewer: simple product 3D inspection
- Supabase: shared backend
- Zod: boundary validation
- React Hook Form: complex interactive forms

Do not install another library that duplicates these responsibilities without explicit justification.

## Validation

After code changes, use the repository's actual package scripts.

Do not assume a script exists.

Inspect available scripts with:

    npm run

Expected validation may include:

- lint
- typecheck
- build
- tests

If the repository defines a `check` script, use it.

If not, run the relevant individual scripts.

## Motion Validation

For motion-heavy work, validate:

- initial load
- route transition
- pointer interaction
- scroll interaction
- resize
- repeated interaction
- cleanup after unmount
- reduced motion
- mobile fallback

Do not consider an animation complete because it looks correct on the first desktop load.

## 3D Validation

For 3D scenes, validate:

- asset load failure
- slow asset load
- resize
- device pixel ratio
- mobile
- interaction conflicts
- memory growth
- scene cleanup
- reduced motion fallback

Avoid keeping unnecessary rendering loops alive.

## Commerce Validation

For commerce-related changes, verify:

- server trust boundary
- authentication assumptions
- lifecycle state rules
- duplicate submissions
- stale client data
- time-based state
- error handling

Do not enforce critical commerce rules only in visual state.

## Documentation

Update documentation when changing:

- architecture
- domain contracts
- commerce states
- Supabase assumptions
- motion conventions
- repository workflow

Do not update documentation for trivial implementation details.

## Completion Summary

After a task, provide:

1. What changed.
2. Important files.
3. Validation performed.
4. Known limitations.
5. Unresolved contract decisions.

Do not claim validation passed unless the relevant command was actually run successfully.