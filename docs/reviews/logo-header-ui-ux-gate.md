# Logo/Header UI/UX skill discovery and review gate

Date: 2026-08-06  
Scope: approved Luminal logo integration in the existing global Header and Footer only.

## Discovery method and instruction scope

Discovery started at root `AGENTS.md`, then enumerated case-insensitive `SKILL.md` files while excluding dependencies, checked UI/UX/design-named documentation, read the governing skill and only its UI, storefront, architecture, workflow, and PR-delivery references, and inspected the Header/Footer/navigation/styles and approved Home/asset plans. No nested repository instruction exists below root for the files in this slice. `node_modules/**/AGENTS.md` applies only to dependency source and is irrelevant because dependencies are untouched.

| File changed | Direct instruction | Additional governing material |
|---|---|---|
| `src/components/layout/header.tsx`, `footer.tsx`, `src/app/globals.css`, `tests/foundation.test.mjs` | root `AGENTS.md` | Luminal Commerce `ui-rules`, `storefront-ui`, `architecture`, `workflow`; approved Home specification and brand recovery plan; UI UX Pro Max as review aid |
| Reserved `public/brand/luminal-factory-logo-primary.png` contract and source/plan/handoff/review documents | root `AGENTS.md` | approved brand recovery plan, Luminal workflow and PR delivery references |

## Skill inventory

| Path | Skill | Scope / concern | Commerce? | Header/logo? | Authority | Overlap or conflict |
|---|---|---|---:|---:|---|---|
| `.agents/skills/luminal-commerce/SKILL.md` | Luminal Commerce | Storefront identity, architecture, UI/motion, commerce, data, workflow; routes to focused references | Yes | Yes | Governing repository skill below scoped instructions | Overrides generic UI advice and external references |
| `.codex/skills/ui-ux-pro-max/SKILL.md` | UI UX Pro Max | Responsive UI, accessibility, layout, typography, color, interaction, performance, Next.js guidance and visual review | Advisory | Yes | Specialist review aid | Its generated-design-system step is not used: existing Luminal tokens/spec and bounded slice have higher authority; generic motion/style advice cannot expand the Header |
| `.codex/skills/reference-analysis/SKILL.md` | Reference Analysis | Evidence-led analysis and Luminal adaptation of external sites | Potentially | Only with an external reference | Specialist, below Luminal rules | Replaces literal cloning; no URL/reference analysis is needed here |
| `.github/skills/clone-website/SKILL.md` | Clone Website (deprecated) | Imported pixel-perfect clone workflow | No | No | Explicitly deprecated / must not invoke | Conflicts with brand adaptation, accessibility, and page approval gates; Reference Analysis supersedes it |
| `.agents/skills/speckit-specify/SKILL.md` | Spec Kit Specify | Create/update formal feature specifications | Yes | Only during specification work | Workflow tool when invoked | Complements the approved spec; not needed for this bounded implementation |
| `.agents/skills/speckit-clarify/SKILL.md` | Spec Kit Clarify | Resolve spec ambiguity | Yes | Conditional | Workflow tool when invoked | No active ambiguity requiring a spec rewrite |
| `.agents/skills/speckit-plan/SKILL.md` | Spec Kit Plan | Create technical plan | Yes | Conditional | Workflow tool when invoked | Existing brand recovery technical plan already owns implementation decisions |
| `.agents/skills/speckit-tasks/SKILL.md` | Spec Kit Tasks | Generate dependency-ordered implementation tasks | Yes | Conditional | Workflow tool when invoked | Not invoked; this is an already-planned bounded continuation |
| `.agents/skills/speckit-analyze/SKILL.md` | Spec Kit Analyze | Non-destructive spec/plan/task consistency review | Yes | Conditional | Workflow QA when invoked | No generated task set exists for this continuation |
| `.agents/skills/speckit-implement/SKILL.md` | Spec Kit Implement | Execute an existing `tasks.md` | Yes | Conditional | Workflow execution when invoked | Not applicable without a feature `tasks.md` |
| `.agents/skills/speckit-converge/SKILL.md` | Spec Kit Converge | Append remaining implementation gaps to tasks | Yes | Conditional | Workflow completion when invoked | Not applicable without the corresponding task artifacts |
| `.agents/skills/speckit-checklist/SKILL.md` | Spec Kit Checklist | Generate requirement-specific checklists | Yes | Conditional | Workflow QA when invoked | User supplied the required checklist directly, so it is recorded below instead |
| `.agents/skills/speckit-taskstoissues/SKILL.md` | Spec Kit Tasks to Issues | Convert tasks to GitHub issues | Yes | No direct UI authority | Delivery utility when invoked | No issue conversion requested |
| `.agents/skills/speckit-constitution/SKILL.md` | Spec Kit Constitution | Maintain project constitution/templates | Indirect | No | Project-governance tool when invoked | No constitution change |
| `.agents/skills/writing-great-skills/SKILL.md` | Writing Great Skills | Skill authoring quality and predictability | Indirect | No | Governs skill authoring only | Not applicable because no skill is changed |

`docs/research/INSPECTION_GUIDE.md` was also discovered by the UI/design documentation search. It is a legacy visual inspection guide, not a skill; the repository audit and root instruction keep it subordinate to the Luminal reference-analysis process.

## Effective authority and conflict decisions

1. Root `AGENTS.md` is the only scoped instruction for every changed file.
2. Luminal Commerce and its authoritative UI/architecture/workflow references govern brand direction and component boundaries.
3. The approved Home specification and brand recovery technical plan provide the most specific product/slice contract: minimal Header/Footer replacement, unchanged navigation, no account/cart, explicit image dimensions, no filter/glow/animation.
4. UI UX Pro Max supplies checks for 44 px targets, focus, contrast, responsive hierarchy, CLS, and image clarity; it does not authorize a new design system or Header redesign.
5. Existing source supplies implementation context, not permission to expand scope.

Resolved conflicts: the deprecated clone workflow is not invoked; generic UI style generation is rejected in favor of existing tokens; generic animation suggestions are rejected because the approved slice prohibits logo animation; and the Server Component Header remains server-rendered while the existing mobile menu stays the narrow client island. No dependency, typography, color token, navigation order, account/cart affordance, or unrelated page UI is added.

## Asset decision

- Owner source: `assets/source/luminal/brand/OK logo-01.png`; PNG, 4000 × 4000, RGBA, 6,036,257 bytes; SHA-256 `758397de87097ed08d8cff0945dd27f9a4e6b36be2b267b138d5759ce68da5ee`.
- Transparent crop bounds: 2572 × 2920 at source offset `(714, 540)`; transparent outer canvas was removed without redrawing, recoloring, filtering, or changing artwork proportions.
- Deferred runtime output: `public/brand/luminal-factory-logo-primary.png` (runtime `/brand/luminal-factory-logo-primary.png`). The derived PNG is intentionally absent from this branch because the Codex PR UI blocks its binary diff; the owner will upload it directly through GitHub Web after merge.
- Header/Footer do not reference the absent path. They retain the accessible `LF` / `Luminal Factory` text fallback, so no broken local image or remote request is produced. A later integration change must verify that the owner-uploaded file exists before replacing this fallback.

## Logo/Header compliance checklist

| Check | Source-level result | Visual gate |
|---|---|---|
| Visual size and breathing room | Existing text fallback geometry is restored; binary artwork is not rendered in this branch | Recheck after later asset integration |
| Balanced header height | Existing `4.75rem` height unchanged | Confirm at 1440/390 px |
| Clear on dark surface; no navigation competition | Existing monochrome `LF` mark and brand text remain on the established dark surface | Confirm visually |
| Same desktop/mobile hierarchy | One shared Header logo; navigation config/order unchanged | Confirm menu closed/open at 390 px |
| Visible focus and touch target | Existing global focus ring and brand/header geometry retained; mobile menu target remains existing 44 px minimum | Keyboard/browser check required |
| Sticky header does not cover content | Existing sticky height and section scroll margins unchanged | Check top and scrolled states on all routes |
| No CLS, crop, blur | No image is requested while the binary is absent, preventing a broken image and image-driven CLS | Re-evaluate explicit dimensions after owner upload |
| Dark/editorial/controlled treatment | No new surface, token, typography, glow, filter, or animation | Confirm against owner expectation |
| Reduced motion | No logo motion introduced; existing reduced-motion behavior untouched | Browser preference check required |
| Account/cart absent; navigation order unchanged | Automated source assertions retained | Confirm rendered desktop/mobile order |

## Required visual review matrix

No browser automation package or browser executable is available in this environment. Therefore this document does **not** declare UI/UX PASS. Before merge, owner/browser review remains required for Home, `/archive`, and `/shop` at approximately 1440 px and 390 px; Header at top and after scroll; mobile menu closed/open; keyboard focus; dark-background contrast; and normal DPR clarity. Screenshots must be captured during that review. Source, test, and build validation can pass independently of this visual gate.

## Future recommendations (not implemented)

- Perform the required browser matrix and store screenshots only when suitable browser tooling is available.
- Evaluate whether a separately supplied horizontal wordmark or simplified small-size mark improves sub-40 px legibility; do not derive or redraw one from this artwork without owner approval.
- Consider metadata artwork only as a separate approved asset/composition slice.
