# Cart UI Technical Plan

## Document metadata

- **Status:** `CODE_COMPLETE_LOCAL_RUNTIME_OFF`
- **Date:** 2026-09-19
- **Page:** `/cart`
- **Runtime:** `DEFAULT_OFF_FAIL_CLOSED`
- **Depends on:** approved Cart experience script and page specification,
  existing guest-cart service/request boundary, and published catalog adapter

## Scope

After `CART-UI-01`, implement a default-off Cart review surface with:
- a thin private dynamic `/cart` route;
- server-only cart presentation enrichment;
- available line list and current catalog estimate;
- client interaction island for quantity update/removal only;
- truthful empty, disabled, stale and service-unavailable states;
- no global navigation exposure.

## Proposed architecture

- `src/app/cart/page.tsx`: thin dynamic route, metadata and cache boundary.
- `src/features/cart/cart-page-service.ts`: reads the opaque cookie through the
  trusted guest-cart service and maps public states.
- `src/features/cart/cart-catalog-presentation.ts`: batch catalog lookup,
  validation, media normalization and checked USD estimate.
- `src/features/cart/cart-page.tsx`: server-rendered semantic layout.
- `src/features/cart/cart-lines-client.tsx`: smallest possible client island for
  existing POST actions, pending state and confirmed updates.
- Existing `src/app/api/cart/route.ts` remains the only mutation route.

Exact filenames may change during implementation if repository structure makes
a smaller boundary clearer, but responsibilities must remain separate.

## Server read path

1. Check `COMMERCE_GUEST_CART_ENABLED` before persistence configuration.
2. Read the `HttpOnly` guest token on the server; never pass it to the client.
3. Resolve the current cart through the existing service.
4. Batch-read catalog presentation for all returned product/variant identities.
5. Validate and normalize only published product, active selected variant,
   current USD price and approved primary media fields.
6. Produce the page view and a checked estimate, or an explicit incomplete
   estimate state.

Viewing `/cart` must not create a cart. Cart creation stays an explicit future
Shop action through the existing POST contract.

## Catalog adapter change

Do not call `getShopCatalogEntryBySlug` because cart identity begins with UUIDs,
and do not issue one request per line. Add a bounded batch lookup keyed by
product UUID and selected variant UUID.

The adapter must:
- use explicit field selection;
- accept only UUIDs already returned by the trusted cart service;
- deduplicate identities before query construction;
- validate response rows with Zod;
- retain input order in the normalized output;
- reject a variant that is inactive or does not belong to its product;
- accept only USD after the approved `CART-USD-01` amendment;
- reuse the existing public-media allowlist/fallback rules;
- return no inventory quantity.

If the current schema cannot express an unambiguous variant price, the affected
line remains visible with `estimateStatus: incomplete`; implementation must not
guess between product and variant prices.

## Mutation path

The client island posts only these existing actions:
- `set_line` with product ID, nullable variant ID and integer quantity 1–99;
- `remove_line` with product ID and nullable variant ID.

It includes the existing JSON content type and `X-Luminal-Cart-Request: 1`.
After success it renders only server-confirmed identifiers/quantities and
re-enriches or refreshes presentation before treating an estimate as current.

No new write endpoint, schema, RPC, secret or rate limiter is introduced.

## Caching and metadata

- Route is dynamic and private/no-store.
- API remains `private, no-store` with `Vary: Cookie, Origin`.
- Cart metadata is `noindex, nofollow` and contains no line facts.
- No shared React/Next cache wraps per-user cart state.
- Published catalog lookup used for Cart is no-store for the first slice so the
  estimate does not silently outlive cart reconciliation.

## Error and recovery design

- Missing/expired/altered token → empty/no-current-cart state and cookie cleanup
  through the existing boundary when applicable.
- Runtime disabled → fail-closed unavailable state with no controls.
- Catalog row disappears → omit unsafe presentation, increment a local stale
  notice, and never use fixture data as a substitute.
- Mutation conflict → retain last confirmed UI, show line feedback and refresh.
- Rate limit/service failure → generic retry-later state.
- Media failure → existing truthful catalog fallback; price/name remain usable.

## Test plan

1. Presentation adapter batch/deduplication/order tests.
2. Product/variant mismatch, unpublished/inactive and malformed payload tests.
3. Missing/mixed/non-USD/overflow price tests.
4. Route disabled, missing-cookie, empty, ready and unavailable tests.
5. Assert route view performs no cart creation.
6. Mutation pending/success/conflict/failure tests.
7. Assert raw token, hash, cart ID, secret and internal errors never enter public
   props/responses/log strings.
8. Static assertions that no checkout/order/payment/inventory/ERP mutation is
   introduced and global navigation remains unchanged.
9. `npm run check` plus desktop/mobile browser review.

## Delivery and live gates

`CART-UI-01` permits local implementation and validation only, with all Commerce
runtime flags false. Push/deploy requires its normal explicit delivery approval.

Enabling `COMMERCE_GUEST_CART_ENABLED`, exposing Cart in global navigation, or
performing a real Production cart smoke requires a separate runbook and explicit
live approval. Customer Auth, merge and address flags remain independently off.

The first implementation reads and mutates the opaque guest cart only. A later
authenticated-cart boundary must resolve the verified Auth subject to the
customer-owned cart and extend the request path without weakening the existing
guest-token isolation. It must be complete before enabling Cart and customer
merge together.
