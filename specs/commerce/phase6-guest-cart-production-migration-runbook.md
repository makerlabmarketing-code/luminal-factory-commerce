# Phase 6 Slice A Guest Cart Production Migration Runbook

## Status

- **Status:** `APPLIED_POSTFLIGHT_PASS`
- **Date:** 2026-08-14
- **Migration:** `20260813103758_create_guest_cart_foundation.sql`
- **Runtime:** No cart service or public UI is enabled by this migration.

## Production execution evidence

On 2026-08-14 the owner explicitly approved the production operation. Preflight confirmed the target was healthy Commerce project `bkmbhcfokobmhfzgsfzh`, the ledger contained only the two Phase 4 migrations, `carts` and `cart_items` were absent, the core tables were zero-row, and the reviewed migration file SHA-256 was `2a31efa62f161e2fedd8cc63af4cdf4f64a1392ed64d35a18618ef944993637a`.

The exact committed SQL was applied once through the Supabase migration operation. Supabase recorded `20260814035441_create_guest_cart_foundation`.

Postflight passed:

- `carts` and `cart_items` exist, have RLS enabled and remain zero-row;
- neither table has an RLS policy or an `anon`/`authenticated` table grant;
- `service_role` can perform the required CRUD operations;
- the seven reviewed secondary indexes, primary-key indexes, constraints and two update triggers exist;
- products, customers and orders remain zero-row;
- the security advisor reports only expected informational default-deny findings;
- the performance advisor reports only expected unused-index information on the zero-traffic database;
- generated TypeScript database types were refreshed from the resulting live schema.

Cart service, Cart UI, Supabase Auth, email OTP, Turnstile and address runtime remain disabled.

## Scope

Create the default-deny `carts` and `cart_items` persistence foundation only. The migration adds no PII, Auth configuration, customer policy, inventory reservation, order creation, payment behavior, scheduled cleanup job or ERP mutation.

## Validation evidence

On 2026-08-13 the exact migration SQL was executed against Commerce production project `bkmbhcfokobmhfzgsfzh` inside one explicit transaction with a 5-second lock timeout and 30-second statement timeout.

The transaction verified:

- both tables and all seven required indexes can be created;
- RLS is enabled on both tables;
- no client RLS policy exists;
- `anon` and `authenticated` have no table access;
- `service_role` has only the required CRUD table privileges;
- a valid SHA-256-sized guest token hash and valid cart item can be inserted;
- missing ownership, duplicate token hash, inactive token retention and quantity over 99 are rejected;
- the 30-day expiry default and update triggers work.

The transaction ended with `ROLLBACK`. A separate postflight confirmed:

- `to_regclass('public.carts') IS NULL`;
- `to_regclass('public.cart_items') IS NULL`;
- the validation product count is zero;
- products, customers and orders remain zero-row;
- the migration ledger still contains only the two Phase 4 migrations;
- security/performance advisors contain no new finding.

## Preflight

Before live application:

1. Confirm the target project is exactly `bkmbhcfokobmhfzgsfzh` (`Luminal Factory Commerce`), never the ERP project.
2. Confirm migration ledger contains `20260810045019` and `20260810045219`, and does not contain `20260813103758`.
3. Confirm `public.carts` and `public.cart_items` do not exist.
4. Confirm the checked-out migration hash/diff matches the reviewed repository file.
5. Confirm no cart runtime or UI is enabled; schema deployment must be inert.

Abort if any preflight condition differs.

## Forward operation

Apply the committed migration once through the Supabase migration operation using the name `create_guest_cart_foundation` and the exact reviewed SQL. Do not use ad-hoc edited SQL and do not retry blindly if the operation reports an error.

## Required postflight

Verify immediately after application:

1. Migration ledger contains exactly one `create_guest_cart_foundation` entry.
2. `carts` and `cart_items` exist with RLS enabled and zero rows.
3. No policies exist on either table.
4. `anon` and `authenticated` have no `SELECT`, `INSERT`, `UPDATE` or `DELETE` privilege.
5. `service_role` has the four required table privileges.
6. The seven reviewed indexes exist.
7. All FK/check/unique constraints and both update triggers exist.
8. Security advisor has no new warning/error. Informational `rls_enabled_no_policy` for these tables is expected because default-deny is deliberate.
9. Performance advisor may report new unused indexes while the tables are zero-row; this is expected before runtime traffic.
10. Products, customers, orders, carts and cart items remain zero-row.

## Failure handling

### Migration operation fails

Do not run rollback SQL automatically. Inspect whether Supabase recorded the migration and whether either table exists. Supabase DDL migration execution should be transactional, but state must be verified rather than assumed.

### Postflight fails with zero Phase 6 rows and no runtime

Disable further delivery. After explicit destructive approval, remove only the new Slice A objects in dependency order:

```sql
drop table if exists public.cart_items;
drop table if exists public.carts;
```

Then reconcile the migration ledger using the supported Supabase workflow; never edit migration history blindly.

### Postflight fails after any Phase 6 runtime/data exists

Do not drop tables or data. Keep runtime disabled, revoke access if required, preserve evidence and prepare a forward repair migration.

## Success boundary

A successful migration only establishes inert persistence. It does not authorize:

- deploying guest-cart runtime or UI;
- adding a server secret to Vercel;
- enabling email OTP or Turnstile;
- creating customers or addresses;
- changing inventory, orders or payments.

The server-side guest-cart service is now code-complete behind a disabled runtime gate and documented in `phase6-guest-cart-service-technical-plan.md`. The next slice is the separately reviewed request/cookie, origin/CSRF, rate-limit and staging boundary. Enabling runtime still requires explicit approval.
