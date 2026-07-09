<!--
Sync Impact Report
Version change: template -> 1.0.0
Modified principles:
- Template principle 1 -> I. Raffle-First Commerce
- Template principle 2 -> II. Design-Led, Specification-First Development
- Template principle 3 -> III. Luminal Factory Visual Authority
- Template principle 4 -> IV. Intentional Motion
- Template principle 5 -> V. Server-First Architecture Boundaries
- Added VI. Domain and Data Integrity
- Added VII. Strict Production Code Quality
- Added VIII. Validation Before Completion
Added sections:
- Architecture and Data Boundaries
- Development Workflow and Quality Gates
Removed sections:
- Template placeholder guidance and example comments
Templates requiring updates:
- Updated: .specify/templates/plan-template.md
- Updated: .specify/templates/spec-template.md
- Updated: .specify/templates/tasks-template.md
- Updated: .specify/templates/checklist-template.md
- Updated: README.md
- Updated: docs/research/INSPECTION_GUIDE.md
- Not present: .specify/templates/commands/*.md; no update required
Follow-up TODOs:
- None
-->

# Luminal Factory Commerce Constitution

## Core Principles

### I. Raffle-First Commerce

Luminal Factory is an artisan collectible storefront. Raffle is the primary
commerce experience and MUST receive stronger product and information
architecture priority than standard shop browsing.

The domain MUST preserve these boundaries:

- Product and Raffle are separate concepts.
- A Raffle Entry is not an Order.
- An unsuccessful raffle entry MUST NOT create an order.
- A Commission Request is not automatically an Order.
- Payment and Shipment states are separate concerns.
- Revenue MUST derive from authoritative successful payment transactions and
  refunds.

Rationale: Luminal sells collectible objects through event-driven commerce.
Collapsing raffles, products, entries, orders, payments, and shipments into a
generic ecommerce model would corrupt customer workflows and operational data.

### II. Design-Led, Specification-First Development

Major pages MUST NOT be implemented from loose ideas, screenshots, or visual
references. The required sequence is:

1. Discuss the experience.
2. Approve the page script.
3. Create the specification.
4. Clarify ambiguity.
5. Create the technical plan.
6. Create tasks.
7. Analyze consistency.
8. Implement.
9. Validate.
10. Converge when required.

An external visual reference does not authorize implementation. Major page
implementation MAY begin only after the page script and specification are
approved and the implementation scope is clear.

Rationale: Luminal is in a design-definition phase. Specification-first work
keeps page intent, commerce behavior, motion, and implementation aligned before
production code changes.

### III. Luminal Factory Visual Authority

Luminal Factory's own identity is the final visual authority. External
references MAY contribute motion architecture, interaction principles, commerce
structure, engineering patterns, and composition ideas, but they MUST be
translated into Luminal-specific execution.

The storefront visual direction is dark, editorial, atmospheric, physical,
object-focused, controlled, and experimental. The experience MUST avoid generic
SaaS composition, gaming RGB, cyberpunk UI, excessive neon, generic AI
gradients, and template ecommerce composition.

The project MUST NOT copy another brand's identity, assets, copy, product
names, or complete layouts.

Rationale: References are research inputs. The finished storefront must feel
like Luminal Factory, not a clone or a generic commerce template.

### IV. Intentional Motion

Motion MUST communicate material, weight, assembly, depth, or application state.
Each viewport SHOULD normally contain one primary motion and no more than two
secondary motions.

Use the simplest appropriate technology:

- CSS owns simple visual transitions.
- Motion owns local component and layout interaction.
- GSAP owns choreographed timelines, scrolling, and coordinated state
  transitions.
- React Three Fiber owns custom real-time 3D scenes.
- Model Viewer MAY own simple product GLB inspection.

Motion work MUST support reduced-motion behavior and appropriate mobile
fallbacks.

Rationale: Motion is a product experience tool for materiality and state. It
must not become decoration that competes with commerce usability or device
performance.

### V. Server-First Architecture Boundaries

Use Next.js Server Components by default. Client Components MUST be used only
when browser interaction requires them.

Business rules MUST stay outside visual components. Supabase access MUST stay
behind explicit data or service boundaries. Motion and 3D logic MUST stay
separate from commerce and data logic.

The storefront is customer-facing. The Luminal Factory ERP is the operational
back office. The final shared-code architecture between storefront and ERP
remains open until the ERP repository is audited; the project MUST NOT force a
monorepo or permanent two-repository decision prematurely.

Rationale: Clear boundaries keep customer UI, commerce rules, data access,
motion systems, and future ERP integration independently understandable and
reviewable.

### VI. Domain and Data Integrity

The database is the source of persisted commerce state. Critical raffle,
inventory, and payment rules MUST be enforced at a trusted server or database
boundary.

Browser state MUST NOT be trusted for authoritative commerce decisions.
Privileged Supabase credentials MUST NOT be exposed to browser code.
Customer-owned data MUST use appropriate authorization and RLS or trusted server
boundaries.

The project MUST NOT lock an unapproved final database schema into the
constitution. Schema and shared-contract decisions remain governed by approved
domain and Supabase documentation.

Rationale: Commerce correctness depends on authoritative persistence,
authorization, and reconciliation, not disabled buttons or optimistic browser
state.

### VII. Strict Production Code Quality

Code MUST use strict TypeScript and MUST NOT use `any`. Untrusted inputs MUST be
validated at appropriate boundaries.

Components SHOULD be focused and domain names SHOULD be explicit. Speculative
abstractions and unrelated repository-wide rewrites MUST be avoided.

Browser effects, animation contexts, observers, timers, and animation frames
MUST be cleaned up when no longer needed.

Rationale: The storefront carries commerce behavior, customer data, animation,
and eventually shared contracts. Strict, focused code reduces ambiguity and
prevents accidental domain drift.

### VIII. Validation Before Completion

Validation MUST use the repository's actual scripts. Agents and contributors
MUST NOT assume a `check` script exists.

Relevant code changes MUST run applicable lint, typecheck, build, and test
commands. Motion work MUST also be checked for repeated interaction, resizing,
reduced motion, mobile fallback, and cleanup. 3D work MUST consider loading
failure, slow loading, mobile performance, and scene cleanup. Commerce work
MUST consider trust boundaries, duplicate submissions, stale data, lifecycle
rules, and time-based state.

Validation MUST NOT be reported as passed unless it was actually performed.

Rationale: Completion claims are part of project governance. Unperformed checks
hide risk in commerce flows, motion-heavy views, and shared data contracts.

## Architecture and Data Boundaries

The storefront owns public brand experience, public product presentation,
raffle discovery, raffle entry, direct purchase flows, commission discovery and
submission, customer account experiences, public archive and product history,
and customer-facing support and authenticity experiences.

Operational back-office workflows belong to the Luminal Factory ERP. ERP-only
concerns include staff management, attendance, payroll, internal production
administration, operational inventory administration, internal finance
administration, raffle winner administration, and internal commission
operations.

Storefront and ERP data contracts SHOULD converge through an approved shared
backend or shared contract strategy after the ERP repository is audited. Until
then, domain changes MUST be documented, shared-state names MUST NOT be
reinterpreted only in the storefront, and evolving shared commerce enums MUST
not be permanently duplicated without documenting the risk.

## Development Workflow and Quality Gates

Every non-trivial task MUST identify the relevant authoritative guidance before
editing. Current durable guidance lives in:

- `AGENTS.md` for repository authority order and gates.
- `.agents/skills/luminal-commerce/SKILL.md` for progressive-disclosure routing.
- `.agents/skills/luminal-commerce/references/project-context.md` for project
  identity and phase.
- `.agents/skills/luminal-commerce/references/workflow.md` for the
  specification-first workflow and validation expectations.
- `.agents/skills/luminal-commerce/references/commerce-domain.md` for commerce
  meaning and lifecycle semantics.
- `.agents/skills/luminal-commerce/references/supabase-contract.md` for
  Supabase persistence and trusted enforcement.
- `.agents/skills/luminal-commerce/references/architecture.md` for application
  boundaries.
- `.agents/skills/luminal-commerce/references/ui-rules.md` for visual, motion,
  and 3D direction.
- `.agents/skills/luminal-commerce/references/coding-style.md` for code
  conventions.

Plans, specifications, tasks, and checklists MUST include constitution checks
for applicable commerce, design, visual, motion, architecture, data, code
quality, and validation concerns.

## Governance

This constitution supersedes conflicting project practice, generated template
sediment, generic UI guidance, and external visual references. More specific
approved page scripts, specifications, and technical plans govern execution only
when they comply with this constitution.

Amendments MUST:

1. Identify the principle or governance section being changed.
2. Explain the reason for the change.
3. Update dependent templates and durable guidance in the same change when
   applicable.
4. Preserve approved Luminal product, commerce, architecture, workflow, and
   visual decisions unless the amendment explicitly changes them.

Versioning follows semantic versioning:

- MAJOR for incompatible governance or principle removals/redefinitions.
- MINOR for new principles, new governance sections, or materially expanded
  requirements.
- PATCH for clarifications, wording changes, and non-semantic refinements.

Compliance review is required during planning, before major page
implementation, before domain or Supabase contract changes, and before claiming
validation complete.

**Version**: 1.0.0 | **Ratified**: 2026-07-09 | **Last Amended**: 2026-07-09
