---
name: luminal-commerce
description: Repository-specific guidance for developing the Luminal Factory storefront, including architecture, raffle-first commerce rules, Supabase contracts, UI and motion constraints, coding conventions, and development workflow.
---

# Luminal Factory Commerce Skill

Use this skill when working on the Luminal Factory storefront.

This repository is not a generic ecommerce template and must not be treated as one.

Luminal Factory is a raffle-first artisan commerce experience focused on collectible artisan keycaps and crafted objects.

Before making architectural, commerce, UI, data, or workflow decisions, consult the relevant reference documents in this skill.

## Reference Map

Read the smallest relevant set of references required for the task.

### Project identity and boundaries

Read `references/project-context.md`.

Use it for:

- repository purpose
- product identity
- storefront versus ERP responsibilities
- overall project direction

### Architecture

Read `references/architecture.md`.

Use it for:

- application structure
- client and server boundaries
- shared domain strategy
- service layer decisions
- feature organization

### Commerce behavior

Read `references/commerce-domain.md`.

Use it for:

- raffle
- products
- orders
- payments
- preorder
- commissions
- inventory relationships
- revenue rules

### Supabase and data

Read `references/supabase-contract.md`.

Use it for:

- database access
- Supabase clients
- authentication
- RLS assumptions
- generated database types
- data ownership

### UI and motion

Read `references/ui-rules.md`.

Use it for:

- visual direction
- motion
- animation technology choices
- 3D
- accessibility
- responsive behavior
- design constraints

### Coding conventions

Read `references/coding-style.md`.

Use it for:

- TypeScript
- React
- Next.js
- naming
- file organization
- error handling
- validation

### Development workflow

Read `references/workflow.md`.

Use it for:

- planning
- repository analysis
- implementation sequence
- tests
- validation
- documentation updates

## Non-Negotiable Project Rules

1. Do not turn the storefront into a generic high-volume ecommerce website.

2. Raffle is the primary commerce experience.

3. A product and a raffle are different domain concepts.

4. Revenue is derived from successful financial transactions and refunds.

5. The storefront is customer-facing.

6. The Luminal Factory ERP is the operational back office.

7. Storefront and ERP must eventually use the same Supabase project and compatible shared commerce contracts.

8. Do not duplicate operational administration features inside the storefront.

9. Do not add visual effects without a clear narrative or interaction purpose.

10. Prefer the simplest motion technology capable of producing the required result.

11. Do not introduce new frameworks, state libraries, animation systems, or infrastructure without reviewing existing project conventions.

12. Do not clone visual references literally.

13. Luminal Factory's visual identity is the final design authority.

## Required Working Behavior

Before editing:

1. Inspect relevant files.
2. Trace existing callers and dependencies.
3. Read the relevant skill references.
4. Identify important assumptions.
5. Avoid speculative rewrites.

During implementation:

1. Keep scope focused.
2. Preserve unrelated behavior.
3. Use existing project patterns.
4. Maintain strict TypeScript.
5. Validate external data.
6. Consider mobile and reduced motion.
7. Avoid unnecessary abstractions.

After implementation:

1. Run the relevant checks.
2. Inspect changed files.
3. Verify no unintended commerce rule changes.
4. Update documentation when the project contract changed.
5. Summarize notable assumptions or remaining risks.