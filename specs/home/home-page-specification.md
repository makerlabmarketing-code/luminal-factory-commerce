# Home Page Specification — Raffle-First

## 4.1 Document Metadata

| Field | Value |
|---|---|
| Title | Home Page Specification — Raffle-First |
| Status | `DRAFT` |
| Owner | Luminal Factory Commerce storefront |
| Last updated | 2026-08-05 |
| Source experience script | `docs/page-scripts/home-raffle-first-experience-script-draft.md` |
| Related roadmap phase | Phase 3 — Static storefront routes / Home design-definition gate |
| Implementation status | `BLOCKED` until this specification and required content/data decisions are approved |
| Approval status | `REVIEW_REQUIRED`; source script is `DRAFT_FOR_REVIEW`, so this specification cannot be treated as approved |

This document formalizes the raffle-first Home architecture before UI implementation. It does not approve production UI, commerce mutations, database schema, raffle entry, payment, authentication, cart, or operational ERP workflows.

## Authority and Conflict Resolution

Home page authority order:

1. Direct operator instructions and `AGENTS.md` repository rules.
2. `.agents/skills/luminal-commerce/SKILL.md` and its authoritative references.
3. `docs/ECOMMERCE_IMPLEMENTATION_ROADMAP.md` for bounded delivery status and gates.
4. Approved page experience script. Current source is still `DRAFT_FOR_REVIEW`, so it is directional rather than approved.
5. This formal Home specification after approval. Current status is `DRAFT`, so it is not implementation authority yet.
6. Current implementation source, including the static homepage skeleton, as foundation code only; it is not an approved raffle-first production design.
7. Research, external references, abstract CSS object studies, visual experiments, and placeholder content; these are advisory only and are never production assets by default.

Conflict handling:

- Any conflict must be documented rather than silently resolved.
- Higher-authority documents govern lower-authority documents.
- If the experience script and this draft differ, the difference remains an approval question until the script/spec are reconciled.
- No existing placeholder, visual research asset, abstract CSS object, product fixture, or route shell may be treated as final production content.

Known conflicts or unresolved authority gaps:

- The source experience script remains draft, so Home implementation is blocked.
- The current homepage skeleton exists, but it was completed as a safe static foundation and does not lock production Home IA.
- No approved real raffle, browser-safe hero asset, production logo/media set, canonical raffle time zone, or data contract is present in repository evidence.

## 4.2 Page Purpose

Business goal: make Luminal Factory's public storefront immediately communicate the current limited-release/raffle moment, then route visitors toward archive, shop, or commission without reducing the brand to a generic product grid.

Experience goal: feel like entering a controlled dark contemporary gallery where a single crafted object carries material weight, story, and release state before ordinary shopping behavior appears.

Primary user action: open the featured raffle or release detail page. Proposed primary CTA copy is `View raffle details` when a real raffle/release detail route exists. If the first slice has no transactional raffle contract, the CTA must become a non-entry action such as `View release study` or `Explore archive`; final copy requires approval.

Commerce funnel role: Home is the discovery and orientation layer. It prioritizes what is happening now, then what existed before, then what is directly available, then what can be created for a customer.

Why raffle precedes shop: raffle is the primary Luminal commerce model and best matches limited artisan drops. Shop remains secondary because starting with a product grid would imply standard inventory-led ecommerce and weaken collectible scarcity, story, and release timing.

Prohibited implication: Home must not offer raffle entry submission, payment, order creation, winner status, stock reservation, or authenticated account behavior until those contracts are approved and implemented behind trusted boundaries.

## 4.3 Audience and User Intent

| Audience | Priority | Intent | Next path |
|---|---:|---|---|
| Collector seeking current raffle | P0 | Determine whether a raffle is open/upcoming and where to learn details | Raffle detail or release detail |
| New visitor | P1 | Understand Luminal's object language, material tone, and release model | Hero, featured object, craft/process, archive |
| Archive-focused collector | P1 | Browse previous objects and brand memory | Archive preview to archive route |
| Ready-to-buy visitor | P2 | Find available direct-purchase products | Shop secondary entry, only when catalog exists |
| Commission prospect | P2 | Learn whether custom work is possible | Commission secondary entry, only as inquiry/discovery until request flow is approved |

## 4.4 Information Architecture

The proposed section order follows the source experience script and remains draft pending approval:

1. Global navigation
2. Raffle discovery hero
3. Featured collectible/object presentation
4. Raffle status and timing
5. Archive glimpse
6. Craft/process moment
7. Shop or commission secondary entry
8. Footer

No order changes are proposed from the draft experience script.

| Section | Purpose | Required content | Primary action | Secondary action | Component boundary | Data source | Loading | Empty | Error | Mobile | Reduced motion |
|---|---|---|---|---|---|---|---|---|---|---|---|
| Global navigation | Orient across raffle-first storefront | Brand mark/name; Raffle, Archive, Shop, Commission, About labels as approved | Navigate to Raffle | Open menu on mobile | `GlobalHeader` | Route config/content config | Render static labels | Hide unapproved links or mark forthcoming by approval | Avoid broken links | Collapse to simple menu | Instant open/close |
| Raffle discovery hero | Establish current/next release as first focus | One raffle/release/object, state, copy, media, CTA | View raffle/release detail | Archive or object study | `HomeHero` | Home service/curated config | Skeleton or static material frame | Non-transactional brand/object study | Safe fallback copy; no false status | Stack media then status/CTA | Static composition |
| Featured object | Explain material/story of one object | Media, material note, edition/story context | View object/release | View archive | `FeaturedObject` | Approved media/content | Reserved aspect-ratio frame | Hide details or use generic studio note | Show fallback image/content | Single column | Static callouts |
| Raffle status/timing | Provide trust and time clarity | State label, open/close timestamps if known, time zone | View details | Add calendar/follow channel only if approved | `RaffleStatus`, `RaffleTiming` | Raffle presentation adapter | Pending state label | `No active raffle` fallback | `Status temporarily unavailable` | Place before secondary content | Static labels/timestamps |
| Archive glimpse | Show brand memory | 1–3 approved previous objects/studies | Explore archive | View featured object | `ArchivePreview` | Archive service/curated content | Card placeholders | Link-only archive intro | Hide unavailable cards | 1–3 stacked cards | No hover dependency |
| Craft/process | Explain material ethos | Public process copy/media | Learn about process/About | None or commission link | `CraftProcess` | Approved editorial copy | Static text first | Hide media | Text-only fallback | Ordered readable list | Static list |
| Shop/commission entry | Offer secondary paths | Short entries for Shop and Commission availability | Shop if available | Commission inquiry | `CommerceEntryLinks` | Route/content config; future availability services | Static links | Hide/mark unavailable per approval | Disabled safe copy | Stacked CTAs | No animation required |
| Footer | Close with identity/utilities | Approved navigation/legal/social/contact | Navigate | None | `GlobalFooter` | Route/content config | Static | Hide unapproved utilities | Avoid broken links | Compact stack | Static |

## 4.5 Navigation Specification

Proposed raffle-first navigation order: `Raffle → Archive → Shop → Commission → About`.

- Desktop: compact editorial header with brand identity first, navigation centered or right-aligned, stable hit targets, and no dashboard-style chrome.
- Mobile: collapsed menu with the same order; no heavy animated overlay in first slice unless approved.
- Active state: route-aware text, underline, or subtle material reflection; must not rely on color alone.
- Keyboard behavior: links and menu controls reachable in DOM order; `Escape` closes mobile menu if an interactive menu exists; focus returns to trigger.
- Focus behavior: visible focus ring/outline with sufficient contrast and no removal of default accessibility without replacement.
- Sticky behavior: recommendation is non-sticky or minimally sticky after approval; avoid persistent obstruction of hero object. Decision remains review-required.
- Account/cart visibility: hide by default in first release until authentication/cart contracts exist. If shown, label as disabled/forthcoming and do not imply a working account, cart, checkout, or session.
- Placeholder handling: unimplemented destinations must either be real route shells with truthful empty states or omitted; no broken links.

## 4.6 Hero Specification

Hero must focus on one raffle, release, or object. It must not be a product grid.

Hero content model proposal:

- `mode`: `realRaffle` | `releasePlaceholder` | `brandStudy` at presentation level only.
- Eyebrow/status: concise state such as `Upcoming raffle`, `Raffle open`, `Release study`, or `No active raffle`.
- Title: approved raffle/release/object title; no invented production product name.
- Supporting copy: one short editorial paragraph explaining material/release context.
- CTA: primary detail/discovery action; no entry submission until approved.
- Secondary metadata: open/close timestamps, time zone, edition/context, archive link, or material note only when approved.
- Raffle state presentation: state label plus non-countdown explanatory text.
- Media responsibility: approved optimized image/video/GLB only; CSS material study may be used as placeholder if labeled non-production.
- Overlay requirements: overlays must preserve object visibility and text contrast; status/CTA must not depend on transparent low-contrast glass.
- Contrast: text and controls must target WCAG AA; accent reflections are decorative and cannot carry essential meaning alone.
- Viewport behavior: hero may use first viewport prominence but CTA/status must be accessible without fragile scroll choreography.
- Mobile composition: stack status, title, media, and CTA so the primary action appears before archive/shop/commission.
- Loading state: reserved media frame, pending status label, no false raffle claim.
- Asset failure state: text-first release panel with approved fallback visual.
- Missing raffle fallback: non-transactional object/brand study or archive-forward state, pending approval.

Three hero possibilities:

A. Real upcoming/active raffle — strongest product fit, but requires approved raffle data, title, timestamps, time zone, media, detail route, and non-entry CTA contract.
B. Non-transactional release placeholder — safer first implementation if raffle backend is not ready; must not pretend entries are available.
C. Brand/object study — safest when no release data or asset is approved; useful for visual foundation but weaker as raffle-first commerce discovery.

Recommendation: use option B for first UI slice if no real raffle contract is approved by implementation time, with option A becoming the target once public raffle data exists. Decision remains `REVIEW_REQUIRED`.

## 4.7 Raffle State Model

This is a presentation-level proposal, not a production enum or shared commerce contract.

| State | Label | CTA behavior | Timing visibility | Fallback | Accessibility announcement |
|---|---|---|---|---|---|
| upcoming | `Upcoming raffle` | View details; no entry | Show opening and closing if known | `Schedule pending` | Announce upcoming state and timestamp text |
| open | `Raffle open` | View details; entry CTA only after future approved entry flow | Show closing time | If entry unavailable, explain details only | Announce open state and closing text |
| closing soon | `Closing soon` | View details; no urgency claim unless sourced | Show closing time prominently | Revert to `Raffle open` if threshold unknown | Announce closing text without rapid live spam |
| closed | `Raffle closed` | View results/details if approved or archive | Show closed time if useful | Link archive | Announce closed state |
| drawing | `Drawing in progress` | View details/status explanation | Hide countdown; show explanatory copy | `Status pending` | Announce drawing state |
| completed | `Raffle completed` | View archive/results if approved | Show completion or historical date if approved | Archive link | Announce completed state |
| unavailable | `Raffle unavailable` | Archive or follow updates | Hide unreliable timing | Brand/object study | Announce temporarily unavailable |
| unknown | `Status pending` | Details only if route exists; otherwise archive | Hide timing | Non-transactional fallback | Announce status is not confirmed |

Countdowns may enhance timing but cannot be the only state indicator or source of truth.

## 4.8 Data Contract Boundary

Home needs data but this document does not create schema, migrations, Supabase tables, or production enums. Future data access must sit behind typed service/repository boundaries, not raw Supabase calls in visual components.

| Data | Field proposal | Nullable behavior | Source owner | Server/client responsibility | Caching expectation | Stale behavior | Missing behavior |
|---|---|---|---|---|---|---|---|
| Featured raffle | id/slug/title/state/publicSummary | Nullable | Future commerce/ERP-backed public raffle service | Server fetch; client only displays | Short revalidation when live; static if curated | Mark status pending and avoid entry claims | Use placeholder/study |
| Raffle status | presentationState/statusLabel | Nullable/unknown allowed | Service maps domain lifecycle to presentation | Server authoritative mapping | Avoid long cache during live windows | Show stale warning if detectable | `Status pending` |
| Opening timestamp | ISO timestamp + time zone | Nullable | Raffle service | Server formats baseline; client may enhance | Time-aware revalidation | Do not let browser open entry | Hide timing |
| Closing timestamp | ISO timestamp + time zone | Nullable | Raffle service | Same as opening | Time-aware revalidation | Do not let browser close commerce alone | Hide timing |
| Hero media | image/video/GLB URL, dimensions, alt, decorative flag | Nullable | Approved asset/content owner | Server selects; client loads media | Long cache with immutable asset filenames | Keep text truth; fallback media | Material placeholder |
| Featured object | title/material/story/media | Nullable | Product/archive/content owner | Server | Static/ISR acceptable | No availability claims | Brand process copy |
| Archive preview | 1–3 records with title/media/year/slug | Nullable | Archive service/curation | Server | Static/ISR acceptable | Hide live claims | Link-only archive intro |
| Shop preview | availability flag + 0–3 products if approved | Nullable | Catalog service | Server | Static/short depending stock | Hide stock numbers unless authoritative | Omit or `Shop opening soon` |
| Commission availability | status/copy/link | Nullable | Commission content/service | Server | Static/short | Avoid accepting submissions if unavailable | Discovery-only copy |

Forbidden in this slice and future Home visuals: migrations, Supabase table creation, service-role keys, browser-authoritative commerce state, or production schema invention.

## 4.9 Component Architecture

Proposed tree, subject to codebase convention during implementation:

- `HomePage` — server composition/data-bound page view; receives normalized Home data; no heavy business logic.
- `GlobalHeader` — server by default unless mobile menu interaction requires a small client island; route labels and safe placeholders.
- `HomeHero` — server/presentational shell; composes `RaffleStatus`, CTA, media, and fallback.
- `HomeHeroMotion` — optional client wrapper only for approved local motion; no data fetching.
- `RaffleStatus` — server/presentational; maps provided presentation state to label/copy.
- `RaffleTiming` — server baseline with optional client enhancement for countdown; countdown never authoritative.
- `FeaturedObject` — server/presentational; approved media/story only.
- `ArchivePreview` — server/data-bound via service; render empty/error states.
- `CraftProcess` — server/presentational editorial section.
- `CommerceEntryLinks` — server/presentational; route and availability flags.
- `GlobalFooter` — server/presentational utility navigation.
- Optional `HomeObject3DBoundary` — client-only and lazy-loaded only if 3D is approved.

Route file requirement: `src/app/page.tsx` should remain thin when implementation begins, composing a Home feature/page component and delegating service calls and presentation to feature boundaries.

## 4.10 Motion Specification

Motion must support material, depth, state, hierarchy, or visual guidance. Budget per viewport: one primary motion and at most two secondary motions.

- Primary motion candidate: controlled material/object reveal in hero, such as a crystal-slice reveal, depth settle, or refraction sweep.
- Secondary candidates: restrained title assembly and one object/pointer response. Do not add additional particle fields, cursor trails, glitch, permanent chromatic aberration, excessive glassmorphism, or competing loops.
- Trigger: initial viewport entry or deliberate interaction; critical CTA must not require animation completion.
- Duration philosophy: slower, heavier, controlled, with a clear settle; avoid playful bounce or constant motion.
- Scroll behavior: optional depth transition between hero and status/object sections; no mandatory pinned sequence for first slice.
- Reduced motion: static hero frame, no parallax, no pointer camera motion, no slice choreography.
- Mobile fallback: static or simplified media with minimal opacity/transform transitions.
- Performance guard: CSS first; Motion/GSAP only if needed; no WebGL if CSS, Motion, or GSAP communicates the material idea adequately.

## 4.11 Optional 3D Decision Record

Decision status: `REVIEW_REQUIRED`.

- Is 3D needed for the first slice? Recommendation: no, unless an approved browser-safe asset and measurable experience need exist.
- Value beyond 2D/CSS: true 3D may communicate object volume, refraction, and inspectability better than flat media; however, first slice can likely communicate raffle discovery with 2D/CSS material study.
- Performance cost: extra JS, rendering work, asset weight, GPU variability, loading/failure complexity, mobile fallbacks, and reduced-motion accommodations.
- Browser asset format: optimized GLB/GLTF-derived web asset only; never STL, sculpt master, manufacturing mesh, or unreduced production source.
- Loading state: reserved poster/material frame and text-first content.
- Failure fallback: approved still image or CSS material placeholder.
- Mobile fallback: static image/poster or reduced object count/interaction.
- Reduced-motion fallback: no orbit/parallax; static object presentation.
- Accessibility fallback: textual object description, decorative media hidden when appropriate, controls keyboard-accessible if inspection is interactive.

Do not install React Three Fiber, Model Viewer, or any 3D dependency in this documentation slice.

## 4.12 Responsive Specification

| Breakpoint class | Behavior |
|---|---|
| Large desktop | Wide editorial composition; generous negative space; hero object can sit off-center; content width constrained for legibility; status panel visible without covering media. |
| Desktop | Two-column or layered hero allowed; navigation full order; CTA near status/title; archive/craft use controlled grids. |
| Tablet | Reduce asymmetry; hero may stack or use balanced split; navigation may collapse based on available width; media crops intentionally with stable aspect ratios. |
| Mobile | Mobile-first stack; status and CTA before secondary story; menu collapsed; touch targets at least 44px; no hover-only reveals; no forced desktop parallax. |

Typography should scale by hierarchy, not mechanical shrinking. Media must preserve key object silhouette and avoid cropping essential information. No-hover fallback must expose all essential actions and labels.

## 4.13 Accessibility Specification

- Use semantic landmarks: header, main, sections with accessible names, footer.
- Maintain one `h1` for Home hero; subsequent sections use ordered headings.
- Keyboard navigation must reach all links/buttons in logical order.
- Focus visibility must be clear against dark surfaces.
- Text and controls target WCAG AA contrast; decorative reflective accents are not information.
- Respect `prefers-reduced-motion`.
- Raffle status changes should be available as text; use restrained `aria-live` only for meaningful state refreshes, not rapid countdown ticks.
- Countdown cannot be the only status source.
- Images need useful alt text when informative; purely decorative material layers use empty alt/hidden semantics.
- Touch targets should be at least 44px.
- Loading/error states must be announced or text-visible, not only color/animation.

## 4.14 Performance Budget

Targets for first implementation slice:

- Initial JS expectation: mostly server-rendered Home with minimal client JS; no page-wide client component.
- Client component limit: only mobile menu, local motion, countdown enhancement, or optional future 3D boundary if approved.
- Image strategy: optimized responsive images with explicit dimensions/aspect ratios; no unapproved large originals.
- Font strategy: use existing font strategy unless brand typography is approved; avoid blocking custom font experiments.
- Animation strategy: CSS first; Motion/GSAP only where the approved motion cannot be expressed simply.
- Optional 3D budget: deferred; if approved, lazy-load below/inside hero boundary with poster fallback and measured asset budget.
- Lazy-loading boundary: archive/process/shop media can load after hero; 3D must not block text/CTA.
- Core Web Vitals: protect LCP hero media sizing, avoid layout shift, keep INP safe by limiting continuous pointer/render loops.

Measurement method: `npm run build`, bundle output inspection, Lighthouse/Web Vitals after implementation, and manual reduced-motion/mobile review. Baseline remains unresolved because this is a specification-only slice.

## 4.15 Content and Asset Inventory

| Item | Current classification | Notes |
|---|---|---|
| Logo/brand mark | Missing / approval required | Existing text identity only; production logo not evidenced. |
| Hero collectible media | Missing / approval required | Research or CSS studies are not production assets. |
| Raffle title | Missing / approval required | Do not invent product/release names. |
| Raffle status copy | Placeholder / approval required | Presentation vocabulary proposed only. |
| CTA copy | Placeholder / approval required | Proposed `View raffle details`; final route/action needed. |
| Timestamps | Missing / approval required | Requires canonical source and time zone. |
| Archive media | Missing or placeholder / approval required | Must be real approved history or curated placeholder labeled as such. |
| Process media/copy | Placeholder / approval required | Must avoid ERP/internal workflow. |
| Shop imagery | Missing / approval required | Only after catalog/content contract. |
| Commission imagery/copy | Placeholder / approval required | Inquiry only until request flow is approved. |
| Alt text | Missing / approval required | Must be written per approved assets. |
| Fallback imagery | Missing / approval required | CSS material fallback acceptable if non-production. |
| Browser-safe 3D asset | Missing / approval required | GLB/GLTF-derived only if approved; no STL/sculpt master. |

## 4.16 Loading, Empty and Error States

- Loading featured raffle: show reserved hero frame, `Checking release status`, and no entry/payment language.
- No active raffle: show approved object study, archive-forward CTA, or update-channel CTA based on approval.
- Raffle API failure: show `Raffle status temporarily unavailable`; retain brand/object content; do not show entry CTA.
- Missing hero media: show text-first hero with fallback material surface.
- Malformed timing: hide countdown/timestamp, show status without time claim, log/monitor in future implementation.
- Stale raffle status: show conservative state and details link; browser must not alter commerce eligibility.
- Archive unavailable: hide preview cards and keep an archive link only if route exists.
- Shop unavailable: omit shop preview or mark forthcoming per approval; no false stock claim.
- Commission unavailable: show discovery copy only or omit; no submission promise.

## 4.17 Security and Trust Boundaries

- Browser never decides payment success.
- Browser never decides raffle winner.
- Countdown is not source of truth for raffle eligibility or state.
- Privileged keys must never appear in client code or committed docs.
- Server/trusted boundaries validate commerce state before any future entry, order, or payment action.
- Presentation state is not domain authority.
- This Home specification does not implement payment, raffle entry, order flow, authentication, cart, production SQL, migrations, or live mutations.

## 4.18 SEO and Metadata

- Page title proposal: `Luminal Factory — Raffle-first artisan objects` or approved brand alternative.
- Meta description proposal: describe Luminal as an artisan object/keycap storefront with raffle releases, archive, shop, and commissions; avoid claiming a raffle is open unless data confirms it.
- Canonical behavior: use approved production origin when configured; avoid hard-coded unverified domain.
- Open Graph asset: requires approved production image, likely hero object or brand still; fallback should be generic brand image, not research asset.
- Structured data: consider Organization/WebSite; raffle/product structured data only after real public data and schema are approved.
- Raffle-specific metadata limitation: no hard-coded `open`, price, availability, deadline, or inventory claims without authoritative data.
- Missing-content fallback: brand-level metadata only.

## 4.19 Acceptance Criteria

Specification acceptance:

- Document contains metadata, authority order, IA, navigation, hero, raffle state, data, architecture, motion, 3D, responsive, accessibility, performance, content, state, security, SEO, acceptance, non-goal, and approval sections.
- Status remains `DRAFT`/`REVIEW_REQUIRED` until source script and spec are approved.
- It does not treat current homepage skeleton or research assets as final production design.

Implementation acceptance for future slice:

- Home renders raffle-first hero before archive/shop/commission.
- No raffle entry/payment/order/auth/cart behavior appears without approved contracts.
- Route file remains thin and uses server components by default.
- Loading/empty/error states do not make false commerce claims.
- Reduced-motion and mobile behavior are implemented.

Content approval:

- Hero copy, CTA, timestamps, time zone, archive/process/shop/commission copy, and all alt text are approved.

Asset approval:

- Production media/logo/fallbacks are approved and browser-safe; no research asset or sculpt/STL is shipped.

Data contract approval:

- Featured raffle, archive, shop, and commission sources are approved behind service/repository boundaries before live data use.

## 4.20 Explicit Non-goals

- Do not implement raffle entry flow.
- Do not implement payment.
- Do not implement order creation.
- Do not implement authentication.
- Do not implement cart.
- Do not create Supabase schema.
- Do not create migrations.
- Do not add Supabase queries to visual components.
- Do not install 3D dependencies.
- Do not build the complete production Home UI in this slice.
- Do not refactor the whole repository.
- Do not add ERP production workflows to the storefront.

## 4.21 Approval Questions

1. Should the hero use a real raffle, a release placeholder, or a brand/object study?
2. Should navigation use `Raffle → Archive → Shop → Commission → About`?
3. What is the exact primary CTA copy and destination?
4. Should account/cart be visible in the first release, hidden, or shown as disabled placeholders?
5. Does the first hero need 3D?
6. Which assets are approved for production use?
7. What is the canonical raffle time zone?
8. When no raffle is active, should Home show archive-forward content, an update-channel CTA, a release placeholder, or a brand study?
9. Should archive preview use real data, manually curated approved content, or placeholders?
10. How much should Shop and Commission appear on Home while raffle remains first priority?
11. Should the header be sticky, non-sticky, or minimally sticky after scroll?
12. Should unavailable secondary paths be hidden, disabled, or labeled forthcoming?
