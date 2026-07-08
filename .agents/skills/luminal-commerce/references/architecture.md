# Architecture

## Application Role

This repository is a Next.js storefront application.

It is the public commerce and brand experience for Luminal Factory.

Operational administration belongs to the Luminal Factory ERP.

## Architecture Principles

1. Keep customer-facing and operational responsibilities separate.
2. Share data contracts rather than duplicating business truth.
3. Prefer server rendering and server data access where practical.
4. Use client components only when browser interaction is required.
5. Isolate motion-heavy and 3D code from domain and data logic.
6. Keep commerce rules outside visual components.
7. Keep Supabase access behind explicit data or service boundaries.
8. Avoid global state until cross-route client state genuinely requires it.

## Suggested Source Structure

The current repository structure may evolve toward:

    src/
    ├── app/
    │   ├── (site)/
    │   ├── account/
    │   ├── api/
    │   └── layout.tsx
    │
    ├── components/
    │   ├── commerce/
    │   ├── layout/
    │   ├── motion/
    │   ├── three/
    │   └── ui/
    │
    ├── features/
    │   ├── raffle/
    │   ├── products/
    │   ├── archive/
    │   ├── commissions/
    │   ├── cart/
    │   ├── checkout/
    │   └── account/
    │
    ├── lib/
    │   ├── supabase/
    │   ├── validation/
    │   ├── motion/
    │   └── utils/
    │
    ├── services/
    │   ├── raffle/
    │   ├── products/
    │   ├── commissions/
    │   └── orders/
    │
    └── types/

Do not reorganize the repository solely to match this example.

Use it as architectural direction.

Refactor structure only when the current implementation requires it.

## Route Responsibility

Route files should remain thin.

A route should primarily:

- resolve route parameters
- perform page-level server data fetching
- enforce public or customer access rules
- compose the relevant view or feature components

Do not place large commerce workflows directly inside `page.tsx`.

## Server and Client Boundaries

Use server components by default.

Use client components for:

- pointer interactions
- GSAP timelines
- Lenis integration
- React Three Fiber scenes
- model viewers
- form interaction
- browser-only APIs
- local visual state

A client component must not become a convenient dumping ground for server-accessible logic.

## Feature Boundaries

A feature owns its feature-specific:

- components
- schemas
- helpers
- state
- domain presentation logic

Examples:

    features/raffle/
    features/products/
    features/commissions/

Generic visual primitives belong outside features.

## Service Layer

Service functions represent application-level data operations.

Examples:

    getActiveRaffle
    getRaffleBySlug
    createRaffleEntry
    getPublishedProducts
    getArchiveObjects
    submitCommissionRequest

Service functions should:

- use explicit inputs
- return typed results
- validate data boundaries
- avoid leaking raw Supabase query builders into UI components

## Shared Domain Strategy

The storefront and ERP are currently separate repositories.

Do not manually copy evolving commerce enums indefinitely.

The target architecture should use one of:

1. A shared domain package.
2. A monorepo shared package.
3. Generated database contracts plus shared validation contracts.

The final shared-code strategy must be decided after auditing the ERP repository.

Until then:

- document domain changes
- avoid storefront-only reinterpretations of shared states
- keep domain enums centralized within this repository

## Data Ownership

The database is the source of persisted commerce state.

The ERP owns operational mutations.

The storefront owns customer-initiated mutations such as:

- raffle entry
- customer profile updates
- checkout initiation
- commission request submission

Public UI must not directly perform privileged administrative mutations.

## Motion Architecture

Motion code should be separated by responsibility.

### CSS

Use CSS for:

- simple hover
- opacity
- basic transforms
- simple state transitions

### Motion

Use Motion for:

- component transitions
- layout transitions
- local interaction state

### GSAP

Use GSAP for:

- cinematic sequencing
- scroll timelines
- pinned sections
- page transition choreography
- complex state transitions

### React Three Fiber

Use React Three Fiber for:

- custom real-time 3D scenes
- custom lighting
- complex pointer interaction
- shader-driven scenes

### Model Viewer

Model Viewer may be used for:

- product inspection
- rotate and zoom viewers
- simple GLB presentation

Do not use React Three Fiber solely because an element rotates.

## Performance Boundaries

3D and motion are part of the product experience, but commerce usability is higher priority.

Critical actions must not depend on heavy scenes.

Examples:

- raffle entry
- forms
- account access
- checkout
- order information

Provide sensible fallbacks for:

- mobile
- reduced motion
- low-performance environments

## Future Monorepo Consideration

A future architecture may become:

    apps/
    ├── erp/
    └── storefront/

    packages/
    ├── domain/
    ├── database/
    ├── validation/
    └── config/

Do not migrate to this structure without:

1. Auditing the ERP repository.
2. Documenting current Supabase usage.
3. Identifying shared domain contracts.
4. Creating a migration plan.
5. Validating both applications independently.