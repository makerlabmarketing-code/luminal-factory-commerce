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
