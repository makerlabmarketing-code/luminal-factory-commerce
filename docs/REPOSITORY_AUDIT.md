# Ecommerce repository audit

Audit date: 2026-08-04. Classification: **ECOMMERCE_REPOSITORY_CONFIRMED**.

## Identity evidence and inventory

The directory, package name, Git repository metadata, README, constitution, and domain references all identify `luminal-factory-commerce` as the public storefront. The only route before this slice was the Next.js App Router root placeholder. Next.js 16.2.1, React 19.2.4, strict TypeScript, Tailwind CSS 4, standalone output, Node 24, and Vercel-oriented CI/configuration form the current stack. No ERP repository was inspected or modified.

Tracked areas inventoried: `src/app` routes/layout/styles, `src/components`, empty hooks/types placeholders, public asset placeholders, configuration, docs/research, Spec Kit scripts/templates, GitHub workflows/templates/instructions, and repository-local skills. There were no services, API clients, Supabase clients, schemas, tests, deployment manifest, or application environment file before this slice. `public` contains no approved brand media beyond placeholders.

## Environment audit

| Variable | Current use | Exposure | Finding |
|---|---|---|---|
| `NEXT_PUBLIC_APP_BASE_URL` | Source metadata canonical origin | Public | Optional; production should configure the approved canonical HTTPS origin. |
| `VERCEL_ENV` | Source robots policy | Platform server/build value | Preview/non-production is noindex; production is indexable. |
| `NEXT_PUBLIC_SUPABASE_URL` | None; planned | Public | Documented only; not required in this static slice. |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | None; planned | Public | Canonical planned browser key name; not required yet. |
| `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` | None | Public | Unused alias; do not configure unless the future client contract deliberately adopts it. |
| `SUPABASE_PROJECT_REF`, `SUPABASE_ACCESS_TOKEN`, `SUPABASE_DB_PASSWORD` | None; future tooling/operator use | Server/tooling secret | Not required; never browser-expose. |

No environment values were printed. No duplicate helpers or Supabase clients exist. `.gitignore` excludes local environment files while `.env.example` remains committable.

## Duplicate and obsolete audit

| Path | Suspected duplicate/conflict | Confidence | Import/use | Canonical file | Proposed action | Risk | Safe now? |
|---|---|---:|---|---|---|---|---|
| `.github/copilot-instructions.md` | Stale website-cloner instructions conflict with Luminal governance and cite deleted sync scripts | High | Agent-only, no runtime imports | `AGENTS.md` | Replaced body with canonical pointer | Low | Yes; obsolete body remains in Git history |
| `.github/skills/clone-website/SKILL.md` | Abandoned pixel-cloning skill conflicts with reference-analysis gate | High | GitHub agent skill only | `.codex/skills/reference-analysis/SKILL.md` | Deprecated now; remove after platform-owner approval | Medium: unique workflow content | No |
| `docs/research/INSPECTION_GUIDE.md` | Template reverse-engineering guide overlaps clone skill | Medium | Documentation only | Reference-analysis workflow | Review and archive after confirming research needs | Low | No; unique detail |
| `docs/design-references/comparison.png` | Template/reference artifact with unclear provenance | Medium | No source/runtime reference found | Future approved Luminal reference assets | Confirm provenance, then remove if unrelated | Medium: visual research evidence | No |
| empty `.gitkeep` files | Identical hashes | High | Preserve empty owned directories | Each directory itself | Retain until directory strategy changes | Low | No; they are structurally intentional, not semantic duplicates |
| `src/components/ui/button.tsx` | Client-only Base UI button overlaps new server-safe `ButtonLink` purpose | Low | No callers currently | Both have distinct button/link semantics | Reassess when interactive forms begin | Low | No; unique functionality |

No file met every safe-deletion criterion, so this slice deletes no audited candidate. The old root placeholder page was replaced by its canonical route implementation rather than treated as duplicate cleanup. Hash scanning found only intentional empty `.gitkeep` files; searches found no copied headers, footers, token sources, Supabase clients, route shadows, capitalization collisions, or backup-name files.

## Instruction and dependency findings

The root guide is now Codex Cloud-oriented and defines commands, live approval, PR, roadmap, UI, security, and architecture boundaries. The Luminal skill and Spec Kit skills are retained because they have distinct triggers. `reference-analysis` is retained. `writing-great-skills` is retained as the skill-authoring reference. The stale Copilot body was replaced by a canonical pointer; the unique GitHub clone skill is deprecated pending safe-removal confirmation. The CI workflow targets `master`, the only named remote target inferred by workflow; remote refs and open PRs could not be verified because this checkout has no configured Git remote and GitHub CLI is unauthenticated.

The dependency set contains multiple intentional animation roles but none are used by this static foundation. Base UI powers the existing button primitive; Lucide is the single icon library. No new dependency was added. Future cleanup should measure package usage after approved interactive slices rather than remove planned dependencies speculatively.
