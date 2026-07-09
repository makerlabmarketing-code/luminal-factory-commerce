---
name: luminal-commerce
description: Use when working on the Luminal Factory storefront, page scripts/specs, raffle commerce, Supabase contracts, architecture, UI, motion, 3D, coding conventions, or repository workflow.
---

# Luminal Factory Commerce Skill

Use this skill for non-trivial Luminal Factory storefront work.

This skill is a progressive-disclosure map. Read the smallest reference set that can govern the task, then stop unless another branch becomes relevant.

## Always Check

Before making architectural, commerce, UI, data, or workflow decisions:

1. Identify the task branch below.
2. Read the listed reference files.
3. Confirm whether the task changes a durable project contract.
4. If a durable contract changes, update the authoritative reference file before or with the implementation.

Completion criterion: the task is governed by the relevant authoritative reference files, not by duplicated rules from memory.

## Authority

`AGENTS.md` defines repository-level authority order and gates.

Luminal Factory's approved product direction, commerce contracts, architecture boundaries, workflow, and visual identity override generic UI guidance and external references.

External websites are references only. Use `.codex/skills/reference-analysis/SKILL.md` for structured reference analysis.

## Branches

### Project identity and boundaries

Read `references/project-context.md`.

Use it for repository purpose, product identity, current phase, storefront versus ERP responsibilities, and high-level commerce priority.

### Specification-first workflow

Read `references/workflow.md`.

Use it for planning, page approval gates, implementation sequence, dependency decisions, validation, documentation updates, and completion summaries.

### Commerce behavior

Read `references/commerce-domain.md`.

Use it for raffle, products, variants, sale types, orders, payments, refunds, shipments, preorder, commissions, inventory meaning, archive meaning, lifecycle states, revenue rules, and domain change rules.

### Supabase and data contracts

Read `references/supabase-contract.md`.

Use it for database access, Supabase clients, authentication, RLS assumptions, trusted enforcement, generated database types, storage, schema changes, and data ownership.

### Architecture

Read `references/architecture.md`.

Use it for application structure, route responsibility, server/client boundaries, shared domain strategy, service layer decisions, feature organization, data ownership, performance boundaries, and future monorepo considerations.

### UI, motion, and 3D

Read `references/ui-rules.md`.

Use it for visual direction, motion vocabulary, motion budget, animation technology choices, 3D asset rules, pointer interaction, accessibility, responsive behavior, mobile strategy, and reduced-motion behavior.

### Coding conventions

Read `references/coding-style.md`.

Use it for TypeScript, React, Next.js conventions, naming, validation, error handling, Supabase query placement, styling, motion code, comments, imports, and file conventions.

## Cross-Branch Contract Changes

Some changes require more than one reference:

- Commerce concept or lifecycle change: `commerce-domain.md`; also `supabase-contract.md` when persistence or enforcement changes.
- Supabase schema, RLS, or storage change: `supabase-contract.md`; also `commerce-domain.md` when domain meaning changes.
- Major page or feature implementation: `workflow.md`; plus the branch references for commerce, UI, architecture, or data impact.
- Motion-heavy or 3D implementation: `ui-rules.md`; also `architecture.md` when component boundaries, asset loading, or performance boundaries change.
- New dependency: `workflow.md`; also the domain reference that owns the problem being solved.
