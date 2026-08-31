# Phase 6 Verified Customer Link and Guest-Cart Merge Technical Plan

## Document metadata

- **Status:** `RPC_MIGRATION_DRAFT_COMPLETE_PRODUCTION_APPROVAL_REQUIRED`
- **Date:** 2026-08-29
- **Depends on:** completed guest-cart smoke, completed Customer Auth Production smoke, `phase6-cart-identity-schema-rls-technical-plan.md`
- **Runtime default:** `COMMERCE_CUSTOMER_CART_MERGE_ENABLED=false`

## Purpose

Define the smallest trusted operation that links a freshly verified Supabase
Auth subject to a Commerce customer and atomically converts an optional guest
cart into the subject's active customer cart. This slice does not add a Cart UI,
profile editor, address, order history, payment, raffle identity or ERP write.

The environment currently has one signed-out test Auth user and zero customers,
active sessions, carts and cart items. That empty baseline is evidence only; the
implementation must remain safe when pre-existing customer and cart rows exist.

## Non-negotiable identity rules

1. The server obtains the current user through a fresh `auth.getUser()` result.
2. Authorization uses only the verified Auth user ID. Email is a contact value,
   never the ownership key.
3. If `customers.auth_user_id` already matches, that row is the customer.
4. If no subject-linked customer exists, the operation may create a new row
   using the verified email only when no normalized-email customer already
   exists.
5. A normalized-email collision with an unlinked or differently linked customer
   returns `identity_conflict`; it is never silently attached by email.
6. `user_metadata`, request-body user IDs and request-body email claims are not
   accepted as authority.

The first merge slice keeps `customers` default-deny to browser roles because no
customer profile consumer exists yet. Authenticated `SELECT` and its ownership
policy belong to the later profile-read slice, where the exact selected columns
can be reviewed.

## Runtime and request boundary

- Introduce `COMMERCE_CUSTOMER_CART_MERGE_ENABLED`; only exact `true` enables
  the merge service.
- Both Customer Auth and guest-cart runtime must also be ready before an
  automatic post-login merge can execute.
- No new public endpoint is required for the first integration. The Auth route
  may call the internal merge service only after successful OTP verification
  and fresh user confirmation.
- Absence of a guest cookie is a successful `no_guest_cart` result and must not
  create an empty customer/cart merely because the user signed in.
- A merge failure must not undo a valid Auth login. Preserve the guest cookie,
  return an explicit internal `merge_pending` state and allow a separately
  reviewed retry path. Never clear the cookie before database success.
- Authenticated and cart responses remain dynamic, private and `no-store`.

## Atomic database boundary

Supabase Data API calls cannot hold one transaction across multiple application
round trips. The merge therefore requires one reviewed Postgres function called
through RPC by the server-only Commerce secret key.

The function must be:

- in `public` only because it must be reachable through the configured Data API;
- `SECURITY INVOKER` with `SET search_path = ''`;
- fully schema-qualified;
- revoked from `PUBLIC`, `anon` and `authenticated`;
- executable only by `service_role`;
- fixed-signature, scalar-input and bounded-output;
- free of external email, HTTP, inventory, order, payment, raffle or ERP calls.

No `SECURITY DEFINER` fallback is permitted. The 2026 Data API grant change is
handled with explicit function/table grants rather than assumptions about
default exposure.

## Proposed persistence support

The CLI-created migration
`supabase/migrations/20260829151610_customer_cart_merge.sql` adds
`private.customer_cart_merge_receipts`:

| Column | Contract |
| --- | --- |
| `guest_token_hash bytea primary key` | Consumed credential hash; never exposed |
| `auth_user_id uuid not null` | Verified subject that completed the merge |
| `customer_id uuid not null` | Resulting customer |
| `cart_id uuid not null` | Resulting active customer cart |
| `unavailable_line_count integer not null` | Explicitly discarded unpublished/invalid lines |
| `capped_line_count integer not null` | Lines whose merged quantity was capped at 99 |
| `created_at timestamptz not null` | Completion evidence |
| `expires_at timestamptz not null` | Receipt retention boundary |

The receipt is private, RLS-enabled, policy-free and accessible only to
`service_role`. Retain it for 37 days, matching the 30-day inactive guest-cart
window plus the approved seven-day deletion allowance, then remove it through a
reviewed extension of the existing hourly cleanup job.

The guest hash is the natural retry key. A retry by the same verified subject
returns the recorded result. A retry by a different subject returns
`cart_unavailable` without revealing the prior owner.

## Transaction algorithm

The function receives verified `auth_user_id`, verified normalized email,
`guest_token_hash` and an authoritative timestamp from the database.

1. Reject null/invalid inputs and set a short local statement timeout.
2. Check the private receipt first; return it only when the subject matches.
3. Resolve an active, unexpired guest cart by hash. Unknown, expired, converted
   and cross-subject replay all return the same `cart_unavailable` result.
4. Resolve the customer by `auth_user_id`. When missing, reject any normalized
   email collision, otherwise create the minimal customer row.
5. Resolve the subject's active customer cart. If none exists, create one with
   no guest hash and the same currency as the guest cart.
6. Lock the guest and customer cart rows in ascending UUID order before line
   mutation. A new invoker trigger makes every cart-line insert/update lock its
   active parent cart first, closing the capture-versus-conversion race.
7. Process guest lines in stable ID order. Re-check that the product is
   published and any variant belongs to it and is active.
8. For each valid logical line, add guest and customer quantities and cap the
   result at 99. Count capped and unavailable lines explicitly.
9. Delete the converted guest cart's line rows after their results are applied,
   mark the guest cart `converted`, clear its token hash and update timestamps.
10. Insert the private receipt and return only the merge state plus the two
    aggregate counts. Do not return customer/cart IDs, email, guest hash or raw
    line data.

All locks are held only inside this database function. Catalog validation and
line mutation are database-local and bounded; no network work occurs while
locked.

## Concurrency and invariant handling

- The existing partial unique index permits one active customer cart.
- Candidate carts are locked in ascending ID order before changes.
- Every cart-line insert/update locks and revalidates its parent cart in the
  same database transaction. A write that loses the conversion race fails
  instead of leaving a line on a converted cart.
- Concurrent customer creation is resolved by the existing unique
  `auth_user_id` and normalized-email indexes; a unique conflict is re-read once
  and accepted only when the Auth subject matches.
- Concurrent receipt insertion is re-read once. Only the same Auth subject may
  receive the recorded result.
- Logical cart-line uniqueness continues to use the two existing partial unique
  indexes for variant and non-variant lines.
- The merge transaction never reads or changes inventory quantities or price.

## Application contract

The default-off domain service exposes:

- `no_guest_cart` — login succeeded and no merge was needed;
- `merged` — atomic merge completed, including aggregate unavailable/capped
  counts;
- `cart_unavailable` — unknown/expired/converted/cross-subject token;
- `identity_conflict` — an existing normalized-email row cannot be silently
  claimed;
- `runtime_disabled` / `runtime_unavailable` — fail-closed configuration or
  persistence failure.

Public responses must not distinguish unknown tokens from cross-subject replay
and must not expose customer/cart IDs until a consumer contract explicitly
requires them.

## Migration and delivery gate

The Supabase CLI created
`supabase/migrations/20260829151610_customer_cart_merge.sql`; its forward SQL,
static contract tests and
`phase6-customer-cart-merge-production-runbook.md` are review-complete locally.
The next gate is:

1. obtain explicit approval for Production transactional rollback validation,
   exact migration application and bounded post-apply concurrency fixtures;
2. run security/performance advisors;
3. regenerate database types only after the reviewed schema is applied;
4. add the Supabase adapter only from that generated RPC signature;
5. keep merge, guest cart and Customer Auth runtime false after postflight.

The pre-apply rollback transaction validates structure, grants and single-call
behavior. True two-session concurrency cannot be honestly proven through one
uncommitted DDL transaction; the runbook therefore performs that assertion only
after schema application with exact-ID fixtures and mandatory cleanup.

The repository now contains the default-off domain service, CLI-created
migration, focused contract tests and Production runbook. There is intentionally
no Supabase adapter, RPC call, Auth-route consumer or cookie mutation until the
migration is applied and its generated type is verified.

## Required tests before any Production approval

- default-off short-circuit before Auth/cart/database work;
- fresh-user requirement and no request-body subject authority;
- no guest cookie creates no customer or cart;
- new subject creates one minimal customer and one customer cart;
- existing subject reuses its customer/cart;
- normalized-email collision fails without linking;
- duplicate lines merge once, cap at 99 and report capped count;
- unpublished/deleted/mismatched selections are discarded and counted;
- retry returns the same receipt; cross-subject replay is non-enumerating;
- two concurrent merges produce one active customer cart and no duplicate line;
- guest hash and lines are removed only after complete success;
- `anon`/`authenticated` cannot call the RPC or read the receipt table;
- service role can call the invoker RPC; advisors add no warning/error;
- no inventory/order/payment/refund/raffle/ERP mutation occurs.

## Explicitly deferred

- browser `customers` grants/RLS and profile editing;
- global Account navigation;
- Cart UI and customer cart reads;
- saved addresses;
- order history;
- cross-device guest-cart recovery;
- raffle identity linking;
- payment, inventory reservation and ERP handoff.
