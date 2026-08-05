# Shop Discovery Foundation Technical Plan

Status: `IMPLEMENTATION_READY`
Date: 2026-08-05
Scope: Home Shop Discovery Preview + `/shop` route foundation only.

## Current source assessment

- `src/app/page.tsx` is a Server Component that renders the raffle-first hero, release information, Home Archive Preview, and minimal About section.
- `src/features/archive/*` provides the closest pattern for this slice: typed curated placeholder data, a Home preview section, route collection component, empty state, and no client/data-commerce behavior.
- `src/components/layout/navigation.ts` already preserves the approved order, but Shop is still unavailable and points at the Home release-information anchor.
- `src/app/archive/page.tsx` demonstrates the desired thin route composition with metadata, one `h1`, intro copy, typed accessor, and shared Header/Footer.
- `src/app/globals.css` owns tokens, editorial dark surfaces, focus styles, sticky-header-safe scroll margins, responsive behavior, and reduced-motion support.
- `tests/foundation.test.mjs` currently guards raffle-first Home, Archive foundation, navigation, non-transactional source, reduced motion, and documentation status.

## Home preview placement

The Home Shop Discovery Preview appears after `ArchivePreviewSection` and before the minimal About section. This preserves the commerce hierarchy: Raffle first, Archive second, Shop third, About lower. The preview is intentionally quieter than both the hero and Archive preview and is limited to three curated entries.

## `/shop` route scope

`/shop` is an indexable route foundation for future directly purchasable collectible presentation. It includes metadata, one `h1`, introductory copy, curated presentation entries, empty-state capability, and a link back to Home raffle discovery. It does not include product detail routes, filters, search, sorting, pagination, cart, checkout, inventory, Supabase, accounts, or payments.

## Information hierarchy

1. Raffle remains the primary Home and commerce entry.
2. Archive remains historical memory and precedes Shop.
3. Shop introduces object-led collectible studies that may later become a direct catalog.
4. The route clarifies that transaction detail is not yet open.
5. Empty state copy keeps the route useful without implying available merchandise.

## Component tree

- `src/app/page.tsx`
  - `Header`
  - `main#main-content`
    - approved `section#raffle`
    - approved `section#release-information`
    - `ArchivePreviewSection`
    - `ShopPreviewSection`
    - `section#about`
  - `Footer`
- `src/app/shop/page.tsx`
  - `Header`
  - `main#main-content.shop-route`
    - route intro section with one `h1`
    - `ShopCollection`
  - `Footer`
- `src/features/shop/shop-content.ts` owns typed presentation-only data and accessors.
- `src/features/shop/shop-preview-section.tsx` renders the Home preview.
- `src/features/shop/shop-collection.tsx` renders the route list and empty state.

## Typed presentation model

`ShopPresentationEntry` includes `id`, `presentationKey`, `title`, `collection`, `type`, `description`, `materialNote`, `media`, `mediaAlt`, `presentationStatus`, `href`, and `isPlaceholder`. The model is explicitly presentation-only and not a production product, variant, price, stock, or commerce schema. The current `href` targets `/shop` section anchors only, avoiding dead product detail links.

## Server/Client Component boundary

All Shop content and components are Server Components or typed data modules. No browser state, cart store, inventory logic, Supabase browser query, checkout state, payment state, or order state is introduced. The existing mobile navigation remains the only client island.

## Responsive behavior

Home preview uses an editorial object-study composition that stacks into a readable list on mobile rather than compressing a marketplace grid. `/shop` uses a broad intro followed by responsive object-led cards with fixed media aspect ratios. Essential labels and detail-availability text are visible without hover.

## Accessibility

- Keep one `h1` on `/shop`.
- Use semantic sections with `aria-labelledby` and semantic lists for entries.
- CTA links target real routes/anchors.
- Cards are not nested interactive elements; route entries are non-interactive presentation cards.
- Placeholder media uses `role="img"` with descriptive placeholder alt text.
- Decorative inner shapes are `aria-hidden`.
- Existing global visible focus and sticky-header-safe scroll margins apply.

## Asset strategy

No external or proprietary media is added. Shop media uses internal CSS placeholders with fixed aspect ratios, tone classes, and clear placeholder labels. The copy does not claim these are real production product photographs.

## Performance

No dependency, image payload, video autoplay, 3D, client hydration, Supabase query, or continuous animation is added. CSS placeholders reserve layout space and avoid CLS.

## Tests

Update tests to assert Home Shop Preview presence and placement after raffle/archive, CTA to `/shop`, `/shop` route existence and one `h1`, typed Shop presentation model, Shop nav availability, Commission still unavailable, empty-state capability, non-transactional language, no fake price/inventory, no Supabase query, no cart/payment/order implementation, reduced-motion support, and documentation status.

## Rollback

Revert `src/features/shop`, `src/app/shop/page.tsx`, Home composition import/call, navigation Shop href/availability change, CSS additions, tests, roadmap, handoff, and this plan. No database rollback is required.

## Explicit non-goals

No cart, checkout, payment, order creation, shipping calculation, inventory system, user account, wishlist, product detail route, CMS, Supabase-backed catalog, search, filter, sorting, pagination, video, 3D, dependency installation, ERP workflow, fake price, fake stock, discount, review, sold-out state, preorder deadline, or production media claim.
