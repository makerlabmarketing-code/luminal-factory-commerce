# Project Context

## Ownership

This file is the authoritative owner of Luminal Factory storefront identity, product direction, repository role, ERP relationship, current development phase, high-level commerce priority, and high-level external reference purpose.

Use `workflow.md` for the specification-first process, `commerce-domain.md` for commerce semantics, and `ui-rules.md` for visual and motion rules.

## Project

Luminal Factory Commerce

## Brand

Luminal Factory is an independent creative studio and artisan object brand.

The current primary product category is artisan keycaps.

Future categories may include:

- collectible objects
- keycap holders
- desk art
- art lamps
- small 3D-produced objects
- limited creative products

The storefront must be capable of growing beyond keycaps without losing its collectible identity.

## Product Experience

Luminal Factory should feel like entering a dark contemporary gallery where small crafted objects are treated as strange collectible personalities.

The storefront is not intended to feel like:

- a generic Shopify store
- a SaaS landing page
- a gaming hardware website
- a cyberpunk interface
- a high-volume marketplace

The desired experience is:

- dark
- editorial
- atmospheric
- physical
- object-focused
- controlled
- experimental
- premium without appearing corporate

## Commerce Direction

The primary sales model is raffle.

Secondary sales models are:

- IN_STOCK
- PREORDER
- COMMISSION

Raffle should receive stronger information architecture and visual priority than standard shop browsing.

The conceptual hierarchy is:

1. What is happening now.
2. What existed before.
3. What is directly available.
4. What can be created for a customer.

This maps broadly to:

- Raffle
- Archive
- Shop
- Commission

## Repository Role

This repository is the public customer-facing storefront.

It owns:

- brand experience
- public product presentation
- raffle discovery
- raffle entry
- direct purchase flows
- commission discovery and submission
- customer account experiences
- public archive and product history
- public support and authenticity experiences

It does not own operational back-office administration.

## ERP Relationship

The existing Luminal Factory ERP is the operational back office.

The ERP should eventually manage:

- products
- product variants
- product media
- collections
- raffles
- raffle lifecycle
- winner operations
- commission operations
- customers
- orders
- payments
- refunds
- shipments
- inventory
- expenses
- revenue reporting
- finance reporting

The storefront consumes public and customer-authorized commerce data.

Both applications should eventually use the same Supabase project and compatible shared domain definitions.

## Current Development State

The storefront is still in foundation and design-definition phase.

Do not assume page designs are finalized.

The development process is intentionally page-by-page.

The current priority is:

1. Establish repository rules.
2. Establish project and commerce contracts.
3. Establish design and motion direction.
4. Define page scripts.
5. Define specifications.
6. Plan implementation.
7. Implement incrementally.

Do not prematurely generate complete storefront pages before their design and interaction scripts are approved.

## Primary References

External references may be studied for specific purposes.

### Artkey Universe

Purpose:

- artisan keycap commerce
- collectible ecosystem
- catalogue and archive thinking
- commission structure
- collector community

Do not copy its visual identity.

### Aixor

Purpose:

- editorial composition
- typography scale
- section rhythm
- confident use of space

Do not clone the layout.

### GetLayers Soda

Purpose:

- 3D object-centered hero thinking
- pointer-responsive spatial interaction
- foreground and background depth
- stateful motion sequencing

Adapt its energetic behavior into slower, heavier, more controlled Luminal motion.

### Textura Next.js 16 Starter

Purpose:

- AI-readable project conventions
- documentation-driven development
- architecture enforcement
- motion convention thinking

Do not copy Claude-specific hooks or adopt a spring-only rule blindly.

## Brand Visual Materials

The visual language may reference:

- obsidian
- dark metal
- aged metal
- crystal
- diamond
- refraction
- iridescent reflection
- liquid surfaces

Preferred accent reflections:

- ice blue
- pale pink
- lavender
- diamond white

These are reflective material cues, not standard bright UI accent colors.
