# Phase 6 Customer Cart Merge Production Runbook

## Status and authority

- **Status:** `APPLIED_POSTFLIGHT_PASS_RUNTIME_DISABLED`
- **Forward draft:** `supabase/migrations/20260829151610_customer_cart_merge.sql`
- **Runtime after every database step:** `COMMERCE_CUSTOMER_CART_MERGE_ENABLED=false`
- **Project:** Luminal Factory Commerce only (`bkmbhcfokobmhfzgsfzh`)

This runbook prepares the database validation and rollout boundary. It does not
authorize Production SQL, test-row creation, Vercel environment changes, Auth
activation, email delivery, customer browser access or deployment.

The owner granted the bounded Production SQL and fixture authority on
2026-08-30. That gate is now complete; any runtime activation, adapter delivery
or rollback remains separately gated.

## Scope

The forward SQL adds only:

1. private 37-day idempotency receipts;
2. a parent-cart lock trigger for line insert/update concurrency;
3. one `SECURITY INVOKER` service-role-only merge RPC;
4. one hourly receipt cleanup Cron job.

It does not add customer browser policies, Cart UI, inventory reservation,
orders, payments, raffle linking, address persistence or ERP authority.

## Preflight

Stop unless every condition is true:

1. The selected project reference is exactly `bkmbhcfokobmhfzgsfzh` and project
   health is `ACTIVE_HEALTHY`.
2. The migration ledger contains the five known Commerce migrations through
   `20260826105102_add_customer_auth_rate_limits` and no customer-merge entry.
3. `private.customer_cart_merge_receipts`,
   `private.lock_active_cart_for_line_write()`,
   `public.merge_verified_customer_guest_cart(uuid,text,text)`, trigger
   `cart_items_lock_active_cart_before_write`, and Cron job
   `commerce-customer-cart-merge-receipt-cleanup` do not exist.
4. Existing `customers`, `carts`, `cart_items`, product/variant constraints,
   grants, RLS state and partial unique indexes match the reviewed schema.
5. Record aggregate row counts only. Do not select email, guest hashes or Auth
   user details into logs.
6. Confirm Customer Auth, guest cart and customer-cart merge flags are all
   false before validation.
7. Confirm the forward file SHA-256 is
   `d60ebbf6b9a21c04e2613bc6edaeacc2db888be48ff1d4e4c2d98d110c326ea9`.

Any mismatch is `LIVE_APPROVAL_REQUIRED`; do not repair or continue implicitly.

## Transactional rollback validation

Run the exact forward SQL inside one explicit transaction with a short lock and
statement timeout. Before the mandatory `ROLLBACK`, assert:

- receipt table shape, constraints, RLS, zero policies and exact grants;
- RPC signature, `SECURITY INVOKER`, empty search path and exact execute grants;
- trigger ownership/event definition and active-parent-cart rejection;
- Cron job name/schedule/command uniqueness;
- invalid UUID/email/hash inputs fail;
- `anon` and `authenticated` fail direct receipt access and RPC execution;
- `service_role` can call the RPC;
- an unknown hash returns only `cart_unavailable` and creates no customer/cart;
- normalized-email collision returns only `identity_conflict` and changes no
  ownership;
- valid published lines merge, duplicate quantities cap at 99, invalid lines
  are counted, the guest hash is cleared and the receipt is idempotent;
- a replay under another Auth subject returns `cart_unavailable`;
- inventory, order, payment, refund, raffle and ERP-owned aggregates do not
  change.

Use synthetic UUIDs and an exact unique test-email suffix. Keep all fixtures in
the same transaction and issue `ROLLBACK` unconditionally, including after an
assertion failure. A single transaction cannot honestly prove two-session lock
behavior; concurrency is tested after schema application with bounded fixtures.

After rollback, run a fresh read-only connection and verify all five new
objects are absent, the ledger is unchanged and all preflight aggregates match.

## Forward operation

Only after a separate owner approval:

1. Apply exactly the reviewed migration once using the Supabase migration
   operation so the ledger records one entry.
2. Do not edit or replay the SQL after a successful ledger write.
3. Keep all three runtime flags false.
4. Do not deploy an application adapter in this database step.

## Post-apply behavior and concurrency validation

Use one uniquely tagged fixture set and record every created ID before the test.
The test may commit only the minimum rows required for two genuinely concurrent
RPC calls, because concurrency cannot be proven inside the pre-apply rollback
transaction. Validate:

- two calls for the same Auth subject and guest token converge on one customer,
  one active customer cart, one logical line and one receipt;
- replay returns the same aggregate counts;
- cross-subject replay remains `cart_unavailable`;
- a concurrent line write either completes before the merge and is included,
  or fails after conversion; it is never silently stranded on a converted cart;
- receipt, cart, cart-item and customer fixtures are then deleted by exact ID in
  reverse dependency order;
- final aggregate counts return to their preflight values.

Never delete the owner's signed-out OTP smoke Auth user. If creating temporary
Auth users is necessary for foreign keys, that requires explicit Auth-user
mutation approval and exact cleanup evidence in the same gate.

## Postflight

Verify independently:

1. exactly one new migration ledger entry;
2. exact table/function/trigger/Cron definitions and grants;
3. RLS enabled with zero receipt policies;
4. browser roles cannot access receipt or RPC;
5. service role receives only the documented three-column result;
6. no test receipts, customers, carts or cart items remain;
7. no inventory/order/payment/refund/raffle aggregate changed;
8. Security and Performance Advisors add no warning/error;
9. generated database types are refreshed only from the applied Production
   schema;
10. all runtime flags remain false and no deployment occurred.

## Emergency rollback

Rollback is a separately approved Production mutation. First keep the runtime
flag false and stop all merge callers. Then, in one reviewed transaction:

1. unschedule `commerce-customer-cart-merge-receipt-cleanup` by its resolved
   job ID;
2. drop trigger `cart_items_lock_active_cart_before_write` from
   `public.cart_items`;
3. drop `public.merge_verified_customer_guest_cart(uuid,text,text)`;
4. drop `private.lock_active_cart_for_line_write()`;
5. drop `private.customer_cart_merge_receipts`;
6. remove or repair the migration ledger only through the approved Supabase
   migration workflow;
7. rerun grants/RLS/advisors and aggregate postflight.

Do not rollback merely because an unused-index INFO appears on a zero-traffic
table. Warning/error findings, grant drift, retained fixtures or runtime
activation are stop conditions.

## Read-only preflight record — 2026-08-29

- Project `bkmbhcfokobmhfzgsfzh` is `ACTIVE_HEALTHY` in `ap-northeast-1` on
  Postgres 17.
- Ledger contains exactly the five expected migrations through
  `20260826105102_add_customer_auth_rate_limits`.
- Receipt table, merge RPC, line-lock function/trigger and cleanup job are all
  absent.
- Products, customers, orders, carts and cart items are zero-row. Auth has one
  intentionally retained signed-out OTP-smoke user and zero sessions.
- Existing customer/cart/cart-item RLS remains enabled.
- Performance Advisor contains only existing unused-index INFO findings.
- Security Advisor contains existing default-deny/no-policy INFO findings and
  one pre-existing `auth_leaked_password_protection` WARN. This slice neither
  enables password login nor changes Auth settings; the warning must remain a
  recorded baseline and cannot be attributed to the merge migration.
- No SQL mutation, migration, fixture, Auth change, env change or deployment
  occurred during this preflight.

## Production rollout record — 2026-08-30

- The exact reviewed file hash matched, then the forward SQL passed transactional
  rollback validation with mandatory rollback and independent absence proof.
- Supabase applied it once as ledger entry
  `20260830070209_customer_cart_merge`.
- Actual `anon` and `authenticated` roles cannot read the receipt table or call
  the RPC; `service_role` receives only the documented bounded result. The RPC
  remains `SECURITY INVOKER` with empty `search_path`, 5-second statement timeout
  and 2-second lock timeout.
- Two truly concurrent calls converged on one customer, one active customer
  cart, one logical line and one receipt. Same-subject replay was idempotent and
  cross-subject replay returned the generic unavailable result.
- A concurrent late cart-line write that lost the conversion race failed with
  SQLSTATE `23514`; it was not stranded on the converted cart.
- All exact-ID fixture receipts, lines, carts, customer and products were deleted
  in dependency order. Final business and receipt aggregates returned to zero.
  The retained signed-out OTP-smoke Auth user remains untouched and Auth sessions
  remain zero.
- RLS, policy count, grants, trigger and the single hourly `29 * * * *` cleanup
  job passed postflight. Generated public-schema types now include only the new
  RPC signature; the private receipt table is not exposed in application types.
- Advisors added no warning or error. Expected INFO includes default-deny RLS,
  unused indexes and three unindexed receipt foreign keys; index follow-up needs
  a separate review and is not an emergency rollback condition. The pre-existing
  leaked-password-protection WARN remains unchanged.
- No Vercel environment value was edited and no deployment occurred. Source
  defaults for Customer Auth, guest cart and customer-cart merge remain false.
