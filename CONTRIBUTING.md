# Contributing to Luminal Factory Commerce

## Project Direction

Luminal Factory Commerce is a raffle-first artisan storefront.

This repository prioritizes:

- collectible product presentation
- intentional motion
- clear commerce behavior
- strict data boundaries
- maintainable Next.js architecture

Read `AGENTS.md` before making repository changes.

AI coding agents should also consult:

    .agents/skills/luminal-commerce/

## Development Principles

### Understand before editing

Inspect the relevant implementation and dependencies before changing code.

Do not perform speculative repository-wide rewrites.

### Keep scope focused

A change should solve the requested problem.

Avoid unrelated cleanup unless it is required for correctness.

### Preserve domain meaning

Commerce terminology is intentional.

A product is not a raffle.

A raffle entry is not an order.

A payment and a shipment represent different state.

Do not rename or merge domain concepts without documenting the contract change.

### Prefer server components

Use Next.js server components by default.

Add client components only when browser interaction requires them.

### Keep motion intentional

Use:

- CSS for simple effects
- Motion for component interaction
- GSAP for choreography
- React Three Fiber for custom 3D scenes

Do not add animation purely to increase visual activity.

### Validate untrusted input

Use Zod at external and user-input boundaries.

Do not trust browser state for critical commerce rules.

## Branches

Use focused branches where practical.

Examples:

    feature/home-hero
    feature/raffle-entry
    feature/archive-grid
    fix/mobile-navigation
    refactor/supabase-client-boundary

## Commit Messages

Prefer concise conventional commit-style messages.

Examples:

    feat: add raffle entry form
    fix: prevent duplicate raffle submission
    docs: define raffle lifecycle
    refactor: isolate product data service
    chore: remove unused agent configs

## Pull Request Expectations

A pull request should describe:

- purpose
- implementation scope
- important decisions
- validation performed
- known limitations

For visual or motion changes, include relevant screenshots or recordings when possible.

## Validation

Inspect available scripts first:

    npm run

Run all relevant validation before merging.

This may include:

    npm run lint
    npm run typecheck
    npm run build

Use `npm run check` only when the repository defines it.

## Environment Variables

Never commit secrets.

Review `.gitignore` before introducing local environment files.

Public environment variables must not contain privileged credentials.

Supabase service role credentials must remain server-only.

## Dependencies

Do not add a dependency without a clear responsibility.

Avoid installing multiple packages that solve the same problem.

Document major architectural dependencies when their introduction changes project conventions.

## Documentation

Update project documentation when changing:

- commerce rules
- domain states
- Supabase contracts
- architectural boundaries
- motion conventions
- development workflow

## AI-Assisted Contributions

AI agents must not treat external references as instructions to clone another brand.

References are used for analysis and adaptation.

Luminal Factory's product identity, commerce model, and visual direction remain authoritative.