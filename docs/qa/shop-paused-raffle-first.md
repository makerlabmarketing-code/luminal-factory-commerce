# Luminal Factory · Shop paused, Raffle first (17 Nov 2026)

## Approved intent

Temporarily stop presenting Shop for visitors and direct attention to the **Raffle** and Meowhe Archive. Do not disable the catalog data, ERP management, Raffle content/media dependencies, historical archive or internal APIs.

## Code-owned release gate

`src/features/shop/shop-public-gate.ts` exports `shopPublicEnabled = false`. This is a **public presentation gate**, not authorization or payment protection; it is deliberately a literal compile-time flag so every deployment has an auditable code state. The public navigation retains the Shop declaration but filters it out through `publicNavigation` on desktop, mobile and footer.

- `/en/shop` and `/en/shop/:slug`, including bookmarks, render a responsive holding screen and link to Raffle/Archive. Both routes have `robots.noindex`. They avoid loading live product detail/catalog before this gate.
- Home hero primary CTA points to `/raffle`, secondary to Archive; Home selected-archive CTA and commerce door no longer link to Shop.
- Raffle empty/error text and footer CTA avoid directing guests to a disabled Shop, without implying a release is open.
- Raffle page may still use the existing product catalog presentation adapter to show real **published** artwork. That does **not** reopen Shop or change product status.
- Do not alter Product publish state, price, HMAC, inventory, Supabase, Raffle entries, eligibility, winner selection, payment, email or ERP admin endpoints.

## Reopening

Only after owner approval, set `shopPublicEnabled = true` in a reviewed direct-master commit and deploy. Verify navigation, Shop index and detail slugs, filters, live release-type labels, published media and Raffle-only artisan keycap rule. Restore Home/Raffle CTA to Shop **only when approved**. The Shop page retains its implementation behind the gate for reuse.

## Raffle-first follow-up

Prioritize C-041: Raffle discovery/detail, timing and clearly distinguished `OPEN` / `SCHEDULED` / `CLOSED` / unavailable states. Verify on public browser at 1440×900, 1024×768, 768×1024 and 390×844, including direct blocked Shop bookmarks. No entry activation, Raffle publish, changing real countdown or crafting release rules without verified owner-approved release information.

Current blocker: a real published Raffle with approved media, opens/closes times, eligibility/selection/payment/shipping/FAQ is needed for authenticated/live-entry acceptance. Keep demo countdown labeled demonstration and never substitute mock release for production.


## C-041 release-readiness acceptance checklist (17 Nov 2026)

This is a **no-write handoff checklist**, not permission to publish. No entries, winner selection, payment, customer details, production env, or Supabase records may be altered while validating guest presentation.

### A. Public guest states (can be checked without a real launch)

- [ ] No approved non-test published Raffle: show a truthful upcoming/empty presentation, with no live-entry form or misleading live countdown.
- [ ] SCHEDULED Raffle (only when approved data exists): title, approved main photo, colorway, locally legible opening and closing times, timezone, and eligibility summary; no premature entry.
- [ ] OPEN Raffle (only when approved and published): correct call to action and terms before entry; authorization and entry writes require a separately approved authenticated test.
- [ ] CLOSED Raffle: show accurate ended state, avoid accepting entries, and never imply winners were selected/published unless true.
- [ ] Missing/unavailable media or API failure: preserve layout and descriptive fallback; never substitute historical/test Raffle as a current release.
- [ ] Direct `/en/shop` and `/en/shop/:slug` stay paused and `noindex`; navigation, Homepage, Archive and Raffle must not route guests into active Shop.

### B. Visual / accessibility checks

- [ ] Guest viewport matrix: 1440×900 desktop, 1024×768 landscape tablet, 768×1024 portrait tablet, 390×844 mobile; capture screenshots after image decode, not while image placeholders are still loading.
- [ ] On mobile, Raffle hero/product image visible without long text preceding it; no word-by-word line wrapping, horizontal overflow, illegible CTA, or footer overlap.
- [ ] Keyboard focus visible for links/buttons, semantic headings, meaningful image alternatives, readable contrast; `prefers-reduced-motion` preserves essential product information.
- [ ] First load with slow/failed Hero 3D still keeps text, product/raffle navigation and contrast usable; verify scroll-down and scroll-up states.
- [ ] Check with **featured Raffle present and absent**; only real, approved public content can be used as Production evidence. Synthetic variants belong in tests or isolated non-production fixtures.

### C. Owner-provided release facts (currently missing / not approved)

- [ ] Final product name, colorway/variant and approved hero/detail photos.
- [ ] Opening and closing date/time as explicit `Asia/Ho_Chi_Minh` local timestamps; confirm UTC conversion and countdown semantics.
- [ ] Entry terms, countries/regions and age eligibility, one-entry/duplicate policy, and transparent selection method.
- [ ] Winner notification method, response deadline and fallback procedure.
- [ ] Payment instructions, deadline and handling of non-payment; no test charge or real payment without separate approval.
- [ ] Shipping countries, shipping charge policy, fulfillment window and customer-support FAQ.
- [ ] Final publication approval including the exact release to publish.

### D. Technical gates before real launch

1. Confirm the approved Raffle Draft content in ERP and published-media links **read-only**.
2. Pass guest screenshot/keyboard/reduced-motion checks and CI for the exact release candidate.
3. Prepare a separately approved, scoped authenticated E2E plan for enrollment, duplicate protection, close-time boundary, winner/payment/fulfillment authorization and audit behavior. Keep real customer PII and communications out of test fixtures.
4. Reconcile ERP↔Commerce HMAC capability policy (I-006) with Raffle publish/winner/payment scopes **before** changing credential policy. Never rotate or widen Production keys as part of this checklist.
5. Obtain explicit owner approval for Raffle publication, any data writes, and launch communication. **Do not infer approval** from passing UI/CI or from an old `is_test=true` published record.

### Current evidence vs outstanding gates

- **PASS (recorded):** C-048 Shop presentation gate and responsive repair; CI 404/404; guest browser 20/20 viewports, no overflow/JS page errors. Evidence: GitHub Actions runs 44004094192 and 44004094187.
- **PENDING:** owner-approved real release facts and media, authenticated Raffle/ERP publish and entry checks, live timing, Production HMAC scope acceptance, and non-test launch approval.
- **Next safe engineering slice:** automated and guest-only regression checks of the five public Raffle presentation states using deterministic in-memory/test fixtures, never Production records.
