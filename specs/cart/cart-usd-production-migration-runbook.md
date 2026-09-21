# Cart USD Production Migration Runbook

## Metadata

- **Status:** `APPLIED_VERIFIED`
- **Target:** Luminal Factory Commerce project `bkmbhcfokobmhfzgsfzh`
- **Migration:** `20260921001942_use_usd_for_cart.sql`
- **Required gate:** `CART-USD-PROD-MIGRATION-01`
- **Runtime before and after:** every Commerce and raffle flag is `false`

## Scope

Change the persisted Cart currency contract from VND to USD before onboarding
the approved `$70.00` Meowhe Lolipop product. This operation does not publish a
product or enable Cart, Auth, merge, raffle, checkout, order or payment runtime.

## Read-only preflight

1. Record the exact local migration hash and current Production migration
   ledger.
2. Require every Commerce and raffle runtime flag to be exactly `false`.
3. Count carts by status and currency; the expected baseline is zero rows.
4. Confirm `carts_currency_check` still requires VND and the column default is
   VND.
5. Capture definitions, invoker mode, fixed search path and execute grants for:
   - `read_verified_customer_cart(uuid)`;
   - `set_verified_customer_cart_line(uuid,text,uuid,uuid,integer)`;
   - `remove_verified_customer_cart_line(uuid,uuid,uuid)`.
6. Confirm browser roles cannot read/write Cart tables or execute the RPCs.
7. Confirm product, customer, cart, order, payment, raffle and inventory
   aggregate counts.

Stop on enabled runtime, unexpected active carts, source/migration drift,
unexpected grants or an unexplained business-row delta.

## Transactional rollback validation

Before application, execute the exact migration SQL inside a transaction,
verify the USD default/constraint/RPC documents and then roll the transaction
back. Confirm the VND Production baseline remains unchanged after rollback.

## Approved application

Only after `CART-USD-PROD-MIGRATION-01`:

1. apply the exact reviewed migration once;
2. record its Supabase migration ledger version;
3. do not enable any runtime or combine this with catalog insertion;
4. do not edit the functions interactively after application.

## Postflight

1. Require `carts.currency` default and check constraint to be exactly USD.
2. Require all three customer-cart RPCs to remain security invoker with fixed
   search path, timeouts and service-role-only execution.
3. Exercise database behavior only with exact disposable fixture IDs inside a
   transaction that is rolled back; prove empty/read/set/remove documents use
   USD and `$70.00` remains catalog work outside this migration.
4. Confirm all aggregate business counts match preflight.
5. Run Supabase security and performance advisors.
6. Confirm every runtime flag remains false and no Vercel environment or
   deployment changed.

## Production evidence — 2026-09-21

- Owner approved `CART-USD-PROD-MIGRATION-01`.
- Reviewed source SHA-256:
  `ff2302ab962341b179fc55c3d983506cf443b1d8f7315727a2bd7421f63ce707`.
- Preflight found zero products, prices, customers, carts, cart items, orders,
  payments and raffles; the Cart default/check and three RPC documents still
  used VND.
- The exact migration passed a transactional rollback validation. The database
  returned to the VND default/check and zero USD RPC bodies before application.
- Supabase applied the migration once as
  `20260921022741_use_usd_for_cart`.
- Postflight confirmed the validated USD default/check, three USD-only
  security-invoker RPCs with fixed search paths/timeouts, service-role-only
  execution, browser table denial and Cart RLS.
- Read/remove returned empty USD documents. Set against a disposable missing
  product returned `catalog_selection_unavailable`; final business counts
  remained zero.
- Security and performance advisors added no finding relative to the captured
  baseline. No catalog row, runtime flag, Auth state, Vercel setting or
  deployment changed.

## Rollback

Rollback requires a separate incident decision. While runtime and catalog are
still disabled and Cart rows are zero, replace USD cart markers/default/check
and the three RPC literals with their reviewed VND predecessors in one new
forward migration. Never delete carts or rewrite product prices as part of the
schema rollback.

## Success criteria

The migration is successful only when Cart persistence and RPC documents are
consistently USD, browser authority is unchanged, advisors add no actionable
finding, business tables remain at baseline and every runtime flag is false.
