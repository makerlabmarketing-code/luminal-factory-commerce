# Luminal Factory Commerce Agent Guide

## Repository Identity

This repository is the public customer-facing storefront for Luminal Factory.

Luminal Factory is a raffle-first artisan commerce and collectible-object brand focused primarily on artisan keycaps and crafted objects.

The storefront owns public brand experience and customer-facing commerce workflows.
The Luminal Factory ERP owns operational back-office workflows.

ERP-only workflows stay out of this repository unless an approved architecture change explicitly requires them. ERP-only concerns include staff operations, payroll, internal production administration, operational inventory administration, internal finance administration, raffle winner administration, and internal commission operations.

## Authority Order

Use this order when guidance overlaps:

1. The user's explicit request, when it stays within repository and safety boundaries.
2. This `AGENTS.md` file.
3. `.agents/skills/luminal-commerce/SKILL.md`.
4. Approved Luminal Factory page scripts, specifications, and technical plans.
5. Luminal Commerce reference files under `.agents/skills/luminal-commerce/references/`.
6. Repository-owned workflow or research artifacts.
7. Third-party skills and general UI recommendations, including UI UX Pro Max.
8. External websites, repositories, screenshots, and inspiration references.

Luminal Factory product direction, commerce contracts, architecture boundaries, workflow, and visual identity override generic UI guidance and external references.

## Governing Project Skill

Repository-specific project guidance lives in:

    .agents/skills/luminal-commerce/

Use the Luminal Commerce skill for non-trivial work involving:

- product direction
- commerce terminology
- architecture boundaries
- Supabase assumptions
- UI and motion direction
- repository workflow
- page scripts, specifications, or implementation planning

Read the smallest relevant reference set for the task. Do not load every reference document when the task only concerns one area.

The durable reference owners are:

- `references/project-context.md`: repository purpose, product identity, current phase, storefront versus ERP responsibilities
- `references/workflow.md`: specification-first workflow, page approval gates, implementation sequence, validation, completion summaries
- `references/commerce-domain.md`: commerce concepts, lifecycle meaning, sale types, payment/order/refund/shipment semantics
- `references/supabase-contract.md`: Supabase access, RLS, trusted enforcement, schema assumptions, storage, generated database types
- `references/architecture.md`: Next.js structure, server/client boundaries, feature/service boundaries, shared-code strategy
- `references/ui-rules.md`: visual direction, motion language, animation technology, 3D rules, mobile and reduced-motion behavior
- `references/coding-style.md`: TypeScript, React, naming, validation, cleanup, imports, comments, file conventions

## Page Approval Gate

The storefront is currently in foundation and design-definition phase.

Major page designs are implemented only after the experience script and specification are approved. Until then, analysis, documentation, prototypes, or isolated technical experiments may be appropriate.

Do not silently turn an experiment or reference study into production page architecture.

The full page workflow is owned by `references/workflow.md`.

## Commerce Gate

Preserve domain meaning:

- A Product is not a Raffle.
- A Raffle Entry is not an Order.
- A Payment is not a Shipment.
- A Commission Request is not automatically an Order.

Revenue derives from authoritative financial transactions and refunds.

Domain contract changes require documentation review in `references/commerce-domain.md` and, when persistence or trust boundaries change, `references/supabase-contract.md`.

## Architecture Gate

Use Server Components by default and Client Components only when browser interaction is required.

Keep route files thin, business rules outside visual components, and Supabase access behind explicit data or service boundaries.

Architecture details are owned by `references/architecture.md`.

## Reference Analysis Gate

External websites and repositories are references, not final design authorities.

For structured reference analysis, use:

    .codex/skills/reference-analysis/SKILL.md

A reference analysis must distinguish observed behavior, source-confirmed behavior, and inferred technical implementation.

Reference analysis does not grant permission to implement a major page. The page workflow in `references/workflow.md` still applies.

## Validation Gate

Before assuming a package script exists, inspect the repository scripts with:

    npm run

Use the actual scripts defined by the repository. Do not claim validation passed unless the command or check was actually performed.

Validation expectations are owned by `references/workflow.md`.

## Skill Authoring Gate

When creating or materially changing a repository skill, consult the installed `writing-great-skills` skill.

Repository skills should optimize for predictable process, single ownership, progressive disclosure, and checkable completion criteria.

Do not create a new repository skill when an existing skill or reference file already owns the responsibility.

## Completion Behavior

After non-trivial implementation work, report:

1. what changed
2. important files changed
3. validation performed
4. known limitations
5. unresolved domain or architecture decisions

Do not claim a page, feature, test, or validation step is complete when it was not actually completed.
