# Luminal Factory Commerce — Codex Cloud Guide

## Identity and boundaries

This repository is the public, customer-facing **Luminal Factory storefront**. It owns brand presentation and, in later approved slices, customer commerce. The separate ERP owns staff, production, finance, operational inventory, raffle-winner, and internal commission administration. Never add ERP application workflows here.

## Commands

Use Node 24 and inspect `npm run` before validation. Current commands are `npm run dev`, `npm run start`, `npm run lint`, `npm run typecheck`, `npm test`, `npm run build`, and the aggregate `npm run check` (lint, typecheck, test, build).

## Architecture and code

- Next.js App Router with strict TypeScript and Tailwind CSS is authoritative. Use Server Components by default; isolate the smallest browser-interactive unit as a Client Component.
- Keep routes thin, business rules outside presentation components, and future Supabase calls behind typed service/data boundaries. Do not use `any`.
- Reuse centralized tokens in `src/app/globals.css`; use semantic HTML, mobile-first responsive behavior, visible focus, useful alt text, stable media aspect ratios, and reduced-motion fallbacks.
- Do not add overlapping styling, icon, state, form, or animation libraries. Do not invent products, prices, stock, reviews, metrics, deadlines, partners, or contact details.

## Security and live approval boundary

Never print or commit secrets. `NEXT_PUBLIC_*` values must be safe for browsers; privileged credentials remain server-only. Codex must not automatically execute production SQL or migrations, change secrets, operate payments, or mutate live orders, inventory, raffles, commissions, or customer data. A live change requires explicit operator approval plus preflight, forward, validation, and rollback instructions where applicable.

## Roadmap workflow

`docs/ECOMMERCE_IMPLEMENTATION_ROADMAP.md` is the authoritative delivery roadmap. Work in bounded slices; update the roadmap, `docs/current-ecommerce-operator-handoff.md`, and durable architecture/domain references when their contracts change. Major pages still require an approved script/spec unless the user explicitly approves the bounded implementation.

Use `.agents/skills/luminal-commerce/SKILL.md` as the repository skill router and load only relevant references. External sites are research inputs, never cloning authority.

## Validation and delivery

Run `npm run check`, review the diff, and classify findings P0–P2 before PR. Fix directly related findings. PRs must state scope, validation, limitations, data/security impact, and roadmap evidence. Auto-merge only when checks pass, there are no conflicts, and no unresolved P0/P1 remains; deployment or live verification stays operator-controlled when credentials or approval are unavailable.
