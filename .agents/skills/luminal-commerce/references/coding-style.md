# Coding Style

## General Principles

Write production-oriented code.

Prefer clarity over cleverness.

Avoid speculative abstractions.

Do not introduce an abstraction until there is a clear responsibility or repeated pattern.

Preserve existing project conventions unless the task explicitly changes them.

## TypeScript

Use strict TypeScript.

Do not use `any`.

Prefer:

- explicit domain types
- inferred local implementation types
- discriminated unions
- readonly data where mutation is unnecessary

Avoid unsafe type assertions.

Do not use type assertions to silence a real data-shape problem.

Validate uncertain data instead.

## Naming

Use descriptive names.

Prefer names such as:

    activeRaffle
    raffleEntry
    publishedProducts
    paymentDeadline

Avoid generic names such as:

    data
    item
    obj
    temp
    result2

when a meaningful domain name exists.

Boolean names should communicate the condition.

Prefer:

    isRaffleOpen
    hasEnteredRaffle
    canSubmitEntry

## React Components

Use PascalCase component names.

Keep components focused.

A component should primarily own one of:

- presentation
- interaction
- feature composition

Avoid components that simultaneously:

- fetch data
- validate commerce rules
- run large GSAP timelines
- render complex markup

Split responsibilities where this improves clarity.

## Server Components

Use server components by default.

Do not add `"use client"` without a browser-specific or interactive reason.

Before making a large parent component client-side, consider extracting a smaller interactive client component.

## Client Components

Client components may use:

- hooks
- pointer events
- GSAP
- Motion
- Lenis
- React Three Fiber
- browser APIs

Clean up:

- event listeners
- animation contexts
- observers
- timers
- animation frames

Do not leave persistent browser effects after unmount.

## Functions

Prefer small, explicit functions.

A function should reveal its intent from its name.

Prefer:

    getActiveRaffle()
    createRaffleEntry()
    calculatePaymentDeadline()

Avoid generic service methods such as:

    processData()
    handleEverything()

## Data Validation

Use Zod at untrusted boundaries.

Examples:

- form inputs
- URL parameters when structurally meaningful
- API payloads
- external service responses
- unknown database JSON fields

Do not repeatedly validate trusted internal typed objects without reason.

## Error Handling

Do not swallow errors.

Avoid empty catch blocks.

Errors should be:

- handled
- transformed
- logged at an appropriate boundary
- or rethrown with meaningful context

User-facing errors must not expose:

- stack traces
- database internals
- private identifiers
- secrets

## Supabase Queries

Do not scatter raw Supabase queries through visual components.

Prefer explicit services or data functions.

Select only required columns when practical.

Handle expected empty states separately from actual query failures.

## Styling

Use the project's Tailwind CSS conventions.

Do not hardcode the same visual token repeatedly across unrelated components.

Promote repeated brand-level values into project tokens.

Avoid arbitrary values when a stable project token already exists.

Arbitrary values are acceptable for deliberate visual composition.

## Motion Code

Motion constants should communicate intent.

Prefer:

    const HERO_POINTER_LERP = 0.05;
    const CRYSTAL_DRIFT_DISTANCE = 18;

Avoid unexplained numeric literals repeated throughout a scene.

Do not centralize every animation number globally.

Scene-specific choreography may remain scene-specific.

## Three.js and React Three Fiber

Keep 3D scene logic separate from commerce logic.

Do not place Supabase queries inside a Canvas scene.

Optimize assets before production use.

Do not publish production sculpt masters directly as web assets.

Web models should be treated as derived distribution assets.

## Comments

Comments should explain:

- why
- constraints
- non-obvious behavior
- important tradeoffs

Do not narrate obvious syntax.

Avoid comments that merely repeat the next line of code.

Prefer comments that explain actual business or technical reasons.

## Imports

Use stable project aliases when configured.

Keep imports organized consistently.

Do not create deeply coupled cross-feature imports.

Feature A should not reach into Feature B's internal component folder without an intentional shared boundary.

## Files

Use kebab-case for non-component file names unless an existing local convention differs.

Use PascalCase for component files only if the repository already consistently follows that convention.

Do not rename large numbers of files merely for aesthetic consistency during an unrelated feature task.