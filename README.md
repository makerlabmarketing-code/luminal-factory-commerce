# Luminal Factory Commerce

Public customer-facing storefront for Luminal Factory.

Luminal Factory is a raffle-first artisan commerce and collectible-object brand
focused primarily on artisan keycaps and crafted objects. This repository owns
the public brand experience and customer-facing commerce workflows. Operational
back-office workflows belong to the Luminal Factory ERP.

## Governance

Durable project governance lives in:

- `.specify/memory/constitution.md`
- `AGENTS.md`
- `.agents/skills/luminal-commerce/SKILL.md`
- `.agents/skills/luminal-commerce/references/`

The constitution establishes the non-negotiable project principles:

1. Raffle-first commerce.
2. Design-led, specification-first development.
3. Luminal Factory visual authority.
4. Intentional motion.
5. Server-first architecture boundaries.
6. Domain and data integrity.
7. Strict production code quality.
8. Validation before completion.

## Development Workflow

Major pages are not implemented from loose ideas or visual references. The
required sequence is:

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

Use the Luminal Commerce skill and the smallest relevant reference set before
non-trivial architecture, commerce, Supabase, UI, motion, 3D, coding, or
workflow changes.

## Commerce Direction

The storefront is raffle-first. Product, Raffle, Raffle Entry, Order, Payment,
Shipment, and Commission Request are separate domain concepts. Critical raffle,
inventory, and payment rules must be enforced at a trusted server or database
boundary.

The storefront and ERP shared-code strategy remains open until the ERP
repository is audited.

## Visual Direction

Luminal Factory's identity is the final visual authority. External references
may inform motion architecture, interaction principles, commerce structure,
engineering patterns, and composition ideas, but they must be translated into
Luminal-specific execution.

The visual direction is dark, editorial, atmospheric, physical, object-focused,
controlled, and experimental.

## Validation

Inspect available scripts before choosing validation commands:

```bash
npm run
```

Use only scripts that exist in this repository. Do not claim validation passed
unless the command or manual check was actually performed.
