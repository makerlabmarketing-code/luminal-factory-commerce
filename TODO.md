# Luminal Factory Commerce TODO

## Current checkpoint — 2026-09-28

The checklist below is an early foundation backlog. For current execution status,
use the [implementation roadmap](docs/ECOMMERCE_IMPLEMENTATION_ROADMAP.md)
and the [ERP & Commerce coordination sheet](https://docs.google.com/spreadsheets/d/1R9HKuFyYe4xrYbvVD-6abV1Br-_c6Jia6G9O0geKCxY/edit).

- Commerce standalone audit C-002–C-005 is complete. All ten source runtime
  flags are declared default-off in `.env.example`; customer-address schema,
  generated types and ownership RLS match Production. Guest cart, customer
  Auth/cart and merge remain disabled, with their integrated smoke still gated.
- Next: C-006 documentation reconciliation, then C-007 standalone readiness.
  The latest read-only advisors show no ERROR: twenty intentional default-deny
  no-policy notices, one leaked-password-protection warning, five unindexed
  foreign keys and nine unused-index notices. Do not alter SQL from this audit.
- The separate Homepage Hero ERP consumer and UI are in
  [ERP PR #207](https://github.com/makerlabmarketing-code/luminal-factory-erp/pull/207),
  not merged. Commerce Admin runtime is still disabled; denied-request audit,
  credentials, controlled E2E and live activation retain separate gates. No
  additional Supabase project or paid branch is planned.

## Current Phase

Foundation and design definition.

Do not begin full page implementation before the relevant page experience script is approved.

## Repository Foundation

- [x] Create storefront repository
- [x] Validate base Next.js project
- [x] Configure Codex workflow
- [x] Remove unused multi-agent configuration
- [x] Add Luminal commerce skill references
- [x] Add contributing guidance
- [ ] Review and rewrite `AGENTS.md`
- [ ] Review existing clone website skill role
- [ ] Verify `.env` is ignored
- [x] Review `scripts/` and remove obsolete agent synchronization scripts
- [x] Review package dependencies
- [x] Add or verify lint, typecheck, and build validation scripts

## Spec-Driven Development

- [ ] Initialize GitHub Spec Kit
- [ ] Create project constitution
- [ ] Define Spec Kit and repository documentation responsibilities
- [ ] Establish page specification workflow

## Product Direction

- [x] Establish raffle-first commerce direction
- [x] Separate Product and Raffle concepts
- [x] Define conceptual sale types
- [x] Define storefront and ERP responsibility boundary
- [ ] Audit ERP repository architecture
- [ ] Audit ERP Supabase usage
- [ ] Decide shared domain strategy
- [ ] Decide monorepo versus separate repositories with shared package
- [ ] Define final shared commerce schema

## Design System

- [ ] Finalize design direction document
- [ ] Finalize visual reference document
- [ ] Finalize motion vocabulary
- [ ] Finalize motion budget
- [ ] Define typography system
- [ ] Define color and material tokens
- [ ] Define responsive principles
- [ ] Define reduced-motion strategy

## Page Scripts

- [ ] Home
- [ ] Raffle
- [ ] Raffle Detail
- [ ] Archive
- [ ] Shop
- [ ] Product Detail
- [ ] Commission
- [ ] Customer Account
- [ ] Support
- [ ] Authenticity
- [ ] Factory
- [ ] About

## Home Direction

Current discussion:

- Crystal Slice entry
- central hero object
- real 3D or optimized hero asset
- foreground and background crystal depth
- pointer-driven object tilt
- magnetic crystal drift
- scroll-driven depth transition
- brand statement
- Latest Drop
- Current Raffle
- Factory story
- selected objects or collector presentation
- commission call to action
- footer

Home script is not finalized.

## Technical Foundation

- [ ] Add Supabase client foundation
- [ ] Define browser and server client boundaries
- [ ] Add Zod validation foundation
- [ ] Add form foundation
- [ ] Add Lenis
- [ ] Add GSAP
- [ ] Add Motion
- [ ] Add React Three Fiber only before first approved custom 3D scene
- [ ] Evaluate Model Viewer before Product Detail implementation

## 3D Pipeline

- [ ] Define web GLB export workflow
- [ ] Define polygon and asset budget
- [ ] Define texture compression strategy
- [ ] Define web asset naming convention
- [ ] Create first Luminal crystal fragment web model
- [ ] Create or select first hero object
- [ ] Test mobile 3D fallback

## Reference Research

- [x] Artkey Universe
- [x] Aixor
- [x] AnimMasterLib page transition
- [x] GetLayers Soda
- [x] Textura Next.js 16 starter
- [ ] Consolidate useful patterns into project design documentation

## Do Not Start Yet

- Full ecommerce implementation
- Payment provider integration
- Production raffle winner selection
- Production checkout
- Full database schema migration
- Monorepo migration
- Final 3D asset optimization

These require additional domain or architecture decisions first.
