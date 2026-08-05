# Home Page Experience Script Draft — Raffle-First

Status: `DRAFT_FOR_REVIEW`  
Date: 2026-08-05  
Gate: Experience script only; not an implementation specification and not approval to build the full Home page.

## Authority and evidence

- Current authority order: `AGENTS.md`, `.agents/skills/luminal-commerce/SKILL.md`, Luminal commerce references, then `docs/ECOMMERCE_IMPLEMENTATION_ROADMAP.md` as the task roadmap.
- Current source state includes a static Home skeleton, but it is Phase 2 code-complete foundation content rather than an approved raffle-first Home production design.
- No formal `specs/` directory or approved Home page specification is present in this checkout.
- Existing Home content uses typed presentation fixtures and explicitly states it is not a product catalog, sale commitment, raffle schedule, or backend-backed commerce surface.

## Experience goal

The Home page should introduce Luminal Factory as a dark, editorial, material-led object studio while making raffle discovery the first commerce path. The user should understand, before seeing any normal shop grid, what raffle or limited release is active/upcoming and why the featured object matters.

The page should feel like entering a controlled dark gallery: physical, atmospheric, object-focused, and restrained. Accent light may appear as reflection or refraction across dark material, not as generic neon or bright ecommerce decoration.

## Target user

- A collector arriving to check whether a raffle is open or upcoming.
- A new visitor trying to understand Luminal Factory's object language.
- A returning customer looking for archive, shop, or commission entry points after checking release status.

## Primary action

Primary CTA: view the active or upcoming raffle detail.

Fallback CTA when no raffle is active or scheduled: view the archive or follow the approved update channel, depending on the future data/content contract.

## Raffle-first hierarchy

1. Active/upcoming raffle discovery.
2. Featured collectible/object presentation tied to that raffle or release story.
3. Timing/status clarity.
4. Archive glimpse as brand memory.
5. Shop and commission as secondary paths.

The Home page must not start with a generic product grid, discount module, or standard shop CTA pair.

## Narrative scroll

### 1. Global navigation

Role: orient visitors without behaving like a SaaS dashboard or generic ecommerce template.

Content responsibilities:

- Luminal Factory mark/name.
- Raffle, Archive, Shop, Commission, About/Process, and account/cart placeholders only when their routes or behavior are approved.
- Raffle should receive first-commerce priority in navigation order.

Interaction model:

- Desktop: compact editorial navigation with clear focus states and stable hit targets.
- Mobile: simple menu; no heavy animated overlay unless approved in the spec.
- Reduced motion: instant menu open/close or minimal opacity change.

Approval needed:

- Final route labels and order.
- Whether account/cart appear before commerce contracts are implemented.

### 2. Active or upcoming raffle discovery hero

Role: make the raffle or next limited release the first thing users understand.

Content responsibilities:

- One primary raffle or collectible focus, not a grid.
- Raffle status: open, upcoming, closed, or no scheduled raffle.
- Opening/closing timing only when source data or approved copy exists.
- Primary CTA to raffle detail; no entry submission in this script gate.
- Secondary CTA to archive only if there is no active action or as a quieter support path.

Interaction model:

- Primary motion: material/object reveal, depth shift, or controlled refraction sweep.
- Secondary motions: title assembly and one object/pointer response at most.
- Motion must communicate material, depth, state, or attention direction.
- No random particles, cursor trails, constant glitch, persistent chromatic aberration, or competing animation fields.

Desktop behavior:

- Object presentation receives visual priority.
- Copy and status panel stay legible without covering the object.
- CTA remains available without depending on scroll choreography.

Mobile fallback:

- Static or simplified object composition.
- Timing/status and CTA appear before secondary story content.
- No mandatory pointer interaction.

Reduced-motion behavior:

- Replace hero choreography with a stable object frame and static material lighting.
- Keep navigation, CTA, and timing readable.

Asset requirements:

- Approved web-safe hero image or optimized GLB if 3D is later justified.
- No STL, sculpt master, production mesh, or unreduced browser asset.
- Loading and failure states must be specified before implementation.

Approval needed:

- Whether the first hero uses a real approved raffle, a content-managed upcoming release, or a non-transactional release placeholder.
- Final CTA copy and status vocabulary.
- Whether 3D is required; if yes, why CSS/Motion/GSAP are insufficient.

### 3. Featured collectible/object presentation

Role: slow the user down and show why the release matters as a crafted object.

Content responsibilities:

- One object story: material, silhouette, craft note, edition context, and approved media.
- Avoid invented product names, prices, inventory, reviews, partner claims, or deadlines.

Interaction model:

- Image/object may respond with restrained depth or light movement.
- Detail callouts must not become operational inventory or payment claims.

Desktop behavior:

- Editorial asymmetry and negative space are acceptable.
- Object remains dominant over commerce chrome.

Mobile fallback:

- Single-column story with stable media aspect ratio.

Reduced-motion behavior:

- Use static callouts and no parallax dependency.

Approval needed:

- First object/release content and asset set.

### 4. Raffle timing/status information

Role: provide trust and clarity around the raffle without implementing entry logic prematurely.

Content responsibilities:

- Public status and timing.
- Brief rules summary only after the raffle rules contract is approved.
- Explicitly avoid implying that an entry is an order or that payment occurs before winner selection.

Interaction model:

- Simple status panel, timeline, or schedule band.
- No browser-authoritative countdown that changes commerce eligibility by itself.

Desktop behavior:

- Status is visible near hero or immediately after it.

Mobile fallback:

- Status appears before archive/shop/commission secondary links.

Reduced-motion behavior:

- Static timestamps and labels.

Approval needed:

- Canonical lifecycle labels and public timing copy.
- Data source and time-zone handling.

### 5. Small archive glimpse

Role: position archive as Luminal Factory's memory, not just sold-out ecommerce.

Content responsibilities:

- A small, curated glimpse of previous objects or studies.
- Archive copy must not claim live availability.

Interaction model:

- Minimal hover/focus reveal or still editorial cards.

Desktop behavior:

- Compact rhythm after raffle sections; should not overtake hero.

Mobile fallback:

- 2–3 items maximum or a single featured archive link.

Reduced-motion behavior:

- Static card reveal.

Approval needed:

- Archive source and whether early archive items are real, approved public history, or placeholders.

### 6. Brand craft/process moment

Role: explain material and production ethos after release discovery.

Content responsibilities:

- Short process sequence: concept, sculpt, prototype, finish, pack.
- No ERP production workflow, internal inventory, finance, or staff tooling.

Interaction model:

- Motion may be a simple settle or section reveal if budget allows.

Desktop behavior:

- Editorial rhythm, not process dashboard.

Mobile fallback:

- Readable ordered list.

Reduced-motion behavior:

- Static list.

Approval needed:

- Final public process language.

### 7. Shop or commission secondary entry

Role: offer alternative paths without lowering raffle priority.

Content responsibilities:

- Shop: direct purchase path only when catalog contract exists.
- Commission: inquiry path only; a commission request is not automatically an order.

Interaction model:

- Quiet, stable CTA cards or text links.

Desktop behavior:

- Secondary placement below raffle/archive/craft content.

Mobile fallback:

- Clear stacked CTAs.

Reduced-motion behavior:

- No animation required.

Approval needed:

- Which secondary path appears first: Shop or Commission.
- Whether unavailable paths should be hidden, disabled, or described as forthcoming.

### 8. Footer

Role: close with brand identity and approved utility links.

Content responsibilities:

- Navigation links only to implemented/approved destinations.
- Legal/social/contact only after approved copy/routes exist.

Interaction model:

- Static.

Approval needed:

- Final utility link set and contact/social channels.

## Non-goals for this script

- Implementing the Home page UI.
- Connecting raffle entry submission.
- Creating orders, payments, shipments, inventory rules, or winner workflows.
- Running migrations or mutating production data.
- Adding dependencies.
- Shipping real product prices, stock counts, deadlines, or sales claims without approved source data.

## Questions for approval

1. Approve or revise the proposed Home section order.
2. Confirm whether the first hero should represent a real upcoming raffle, a non-transactional release placeholder, or a brand/object study until raffle data is ready.
3. Confirm navigation order and labels, especially whether `Raffle` precedes `Archive` and `Shop`.
4. Confirm whether account/cart links should remain hidden or clearly placeholder-only until commerce contracts exist.
5. Confirm whether the first implementation slice may proceed after a formal spec, limited to global visual foundation plus Home raffle discovery hero shell.
6. Confirm whether 3D is required for the first hero; if yes, provide approved browser-safe assets or approve an asset-production plan.
