# Cart USD Technical Plan

## Metadata

- **Status:** `IMPLEMENTED_LOCALLY_PRODUCTION_MIGRATION_APPLIED`
- **Approval:** `CART-USD-01`
- **Date:** 2026-09-21
- **Production migration gate:** `CART-USD-PROD-MIGRATION-01`
- **Runtime state:** all Commerce and raffle flags remain `false`

## Decision

USD is the single currency for the first real Luminal Factory catalog and Cart
slice. The approved Meowhe Lolipop price is `$70.00`, represented as `7000`
minor units. The application does not convert from USD to VND and does not
fetch an exchange rate.

This matches the international artisan-keycap presentation pattern reviewed on
Artkey Universe: public prices are displayed in USD while releases are grouped
by collection/colorway and sculpt. SKU remains an internal operational key and
is not required in the public product presentation.

## Invariants

- `public.carts.currency` is exactly `USD` for active and retained carts.
- Catalog prices used by Cart are exactly `USD`; mixed or malformed currency
  payloads fail closed.
- USD uses cents: `$70.00 = 7000 amount_minor`.
- Subtotal is shown only when every visible line has exactly one matching USD
  price and checked integer arithmetic succeeds.
- Guest Cart, customer Cart and all empty/error documents report `USD`.
- Shop's generic formatter remains capable of displaying valid ISO currencies,
  but the first live product and Cart contract are USD.
- Orders and payments remain outside this slice. Their defaults are not changed
  before the Phase 7 provider/currency decision.

## Database boundary

Migration `20260921001942_use_usd_for_cart.sql`:

1. locks `public.carts` for the short constraint transition;
2. replaces any existing VND cart marker with USD;
3. changes the cart default and check constraint to USD;
4. replaces the three verified-customer Cart RPC bodies so empty documents and
   newly created customer carts use USD;
5. reasserts service-role-only execute grants.

It adds no table, policy, public grant, privileged function, inventory
authority or transactional payment behavior.

## Application boundary

- Server adapters reject any persisted cart currency other than USD.
- Public price payload validation accepts only USD for Cart presentation.
- `Intl.NumberFormat("en-US", { currency: "USD" })` formats cents after
  division by 100.
- UI copy states USD explicitly when a price is missing or ambiguous.
- Runtime gates remain unchanged and default-off.

## Validation

- Static migration tests cover the USD constraint, RPC literals, invoker mode,
  fixed search path and browser denial.
- Unit tests cover `$70.00`, quantity-two `$140.00`, duplicate-price failure and
  malformed currency failure.
- Full lint, TypeScript, test, security and Production build must pass.
- Production SQL passed transactional rollback validation and was applied once
  under owner approval as `20260921022741_use_usd_for_cart`.
