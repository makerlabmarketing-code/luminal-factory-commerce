# Implementation Plan: [FEATURE]

**Branch**: `[###-feature-name]` | **Date**: [DATE] | **Spec**: [link]

**Input**: Feature specification from `/specs/[###-feature-name]/spec.md`

**Note**: This template is filled in by the `/speckit-plan` command. See `.specify/templates/plan-template.md` for the execution workflow.

## Summary

[Extract from feature spec: primary requirement + technical approach from research]

## Technical Context

<!--
  ACTION REQUIRED: Replace the content in this section with the technical details
  for the project. The structure here is presented in advisory capacity to guide
  the iteration process.
-->

**Language/Version**: TypeScript strict, Next.js App Router, React [version or NEEDS CLARIFICATION]

**Primary Dependencies**: [Next.js, React, Tailwind CSS, Supabase, GSAP/Motion/R3F/Model Viewer as applicable or NEEDS CLARIFICATION]

**Storage**: [Supabase/PostgreSQL, Supabase Storage, explicit mock adapter, or N/A]

**Testing**: [actual repository scripts from npm run; do not assume check exists]

**Target Platform**: Public customer-facing Luminal Factory storefront

**Project Type**: Next.js storefront

**Performance Goals**: [commerce usability, responsive interaction, motion/3D budget, or NEEDS CLARIFICATION]

**Constraints**: [server-first boundary, trusted commerce enforcement, reduced motion, mobile fallback, or NEEDS CLARIFICATION]

**Scale/Scope**: [page/feature scope, user journeys, commerce surface, or NEEDS CLARIFICATION]

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

- **Raffle-first commerce**: Does this plan preserve Product, Raffle, Raffle Entry,
  Order, Payment, Shipment, and Commission Request boundaries? If not
  applicable, state why.
- **Specification-first status**: For major page work, are the experience script
  and specification approved before implementation tasks are created?
- **Visual authority**: Are external references translated into Luminal-specific
  visual direction without copying identity, assets, copy, product names, or
  complete layouts?
- **Intentional motion**: Is every motion assigned a role: material, weight,
  assembly, depth, or state? Does each viewport stay within one primary motion
  and no more than two secondary motions?
- **Architecture boundaries**: Are Server Components used by default, Client
  Components limited to browser interaction, Supabase access behind explicit
  data/service boundaries, and motion/3D isolated from commerce/data logic?
- **Domain and data integrity**: Are raffle, inventory, payment, and customer-data
  rules enforced at trusted server or database boundaries?
- **Code quality**: Does the approach preserve strict TypeScript, avoid `any`,
  validate untrusted inputs, use focused components, and avoid speculative
  abstractions?
- **Validation plan**: Which actual repository scripts and manual checks will be
  run before completion? Include motion, 3D, and commerce-specific checks when
  applicable.

## Project Structure

### Documentation (this feature)

```text
specs/[###-feature]/
├── plan.md              # This file (/speckit-plan command output)
├── research.md          # Phase 0 output (/speckit-plan command)
├── data-model.md        # Phase 1 output (/speckit-plan command)
├── quickstart.md        # Phase 1 output (/speckit-plan command)
├── contracts/           # Phase 1 output (/speckit-plan command)
└── tasks.md             # Phase 2 output (/speckit-tasks command - NOT created by /speckit-plan)
```

### Source Code (repository root)
<!--
  ACTION REQUIRED: Replace the placeholder tree below with the concrete layout
  for this feature. Delete unused options and expand the chosen structure with
  real paths (e.g., apps/admin, packages/something). The delivered plan must
  not include Option labels.
-->

```text
src/
├── app/
├── components/
├── features/
├── lib/
├── services/
└── types/

public/
└── [public web assets; no production sculpt masters or manufacturing files]

specs/[###-feature]/
└── [feature specification artifacts]
```

**Structure Decision**: [Document the selected structure and reference the real
directories captured above]

## Complexity Tracking

> **Fill ONLY if Constitution Check has violations that must be justified**

| Violation | Why Needed | Simpler Alternative Rejected Because |
|-----------|------------|-------------------------------------|
| [e.g., 4th project] | [current need] | [why 3 projects insufficient] |
| [e.g., Repository pattern] | [specific problem] | [why direct DB access insufficient] |
