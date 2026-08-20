# Phase 6 Guest Cart Isolated Staging Runbook

## Document metadata

- **Status:** `DISABLED_PROBE_BLOCKED_AUTOMATION_BYPASS_REQUIRED`
- **Date:** 2026-08-20
- **Application target:** one non-production Vercel Preview deployment
- **Database target:** Supabase project `bkmbhcfokobmhfzgsfzh` (`Luminal Factory Commerce`)
- **Runtime:** production remains disabled throughout

## Purpose and boundary

Verify the applied guest-cart persistence, server service, request boundary, cookie contract and durable limiter through one isolated Preview deployment before any Cart UI or Auth work begins.

This runbook adds no package, paid database branch, Auth provider, OTP, Turnstile, PII, address, inventory reservation, order, payment or ERP behavior. Google Drive and product media are unrelated to this gate.

The Free-plan direction reuses the existing Commerce database. Therefore the enabled smoke is a bounded live-data operation: it creates exactly one guest cart, performs idempotency/concurrency/credential checks and deletes that exact cart in `finally`. Rate-limit counters contain only keyed source hashes and expire through the installed hourly cleanup job.

## Approval boundary

Preparation, local tests and the disabled probe are non-mutating. Do not perform any of the following without a fresh explicit owner approval:

- add or change Preview environment variables;
- set `COMMERCE_GUEST_CART_ENABLED=true` in Preview;
- deploy or redeploy the staging branch;
- run the enabled smoke, which briefly creates and deletes one production-database guest cart.

Production environment variables, production deployment and all Auth configuration remain out of scope.

## Configuration contract

Scope every value to the exact staging branch in Vercel Preview, never Production or all Preview branches:

- `NEXT_PUBLIC_SUPABASE_URL=https://bkmbhcfokobmhfzgsfzh.supabase.co`;
- `SUPABASE_SECRET_KEY=<Commerce server-only secret key>`;
- `COMMERCE_GUEST_CART_ALLOWED_ORIGINS=<exact HTTPS Preview origin>`;
- `COMMERCE_GUEST_CART_RATE_LIMIT_SECRET=<independent random value of at least 32 characters>`;
- `COMMERCE_GUEST_CART_ENABLED=false` for the first deployment.

The secret key and rate-limit secret must never use `NEXT_PUBLIC_`, enter Git, appear in screenshots/logs or be pasted into chat. The rate-limit secret must be independent from every Supabase, GitHub, Vercel, Turnstile and OTP credential.

The Preview is protected by Vercel Authentication. Generate a project-scoped Protection Bypass for Automation secret and expose it only to the operator process as `VERCEL_AUTOMATION_BYPASS_SECRET`. The verifier sends it as `x-vercel-protection-bypass` on every probe request. Do not add this secret to the application runtime environment, Git, screenshots or logs.

## Preflight

1. Confirm the branch/worktree and require the full repository quality gate to pass.
2. Confirm production is still on an earlier `master` deployment and no Cart UI consumes `/api/cart`.
3. Confirm the Preview URL is not `luminalfactory.com`, the production Vercel alias or the `master` branch alias.
4. Confirm the production limiter ledger is still exactly `20260815022728_add_guest_cart_rate_limits`, carts/cart items are zero-row, and advisors have no new warning/error.
5. Add branch-scoped Preview values with the runtime flag false and create one batched Preview deployment.
6. Set `COMMERCE_GUEST_CART_STAGING_URL` and, because this Preview is protected, `VERCEL_AUTOMATION_BYPASS_SECRET` only in the operator environment and run:

   ```text
   npm run verify:guest-cart-staging -- --mode=disabled
   ```

The disabled probe deliberately sends an invalid origin. A disabled runtime returns the generic JSON `404 cart_unavailable` before parsing or database access. An enabled runtime would return `403`, so the probe cannot create a cart.

On 2026-08-20 the public probe reached Vercel Deployment Protection and returned its `401` protection envelope before the application. The verifier now reports that boundary explicitly and accepts Vercel's safe normalization of `private, no-store, max-age=0` to `no-store, max-age=0`; it still rejects missing `no-store`, `public` and `s-maxage` responses. No cart request reached the application and no database write occurred.

## Enabled smoke

After the disabled probe passes, obtain separate approval for the Preview flag change, redeployment and one bounded create/delete smoke. Require the operator-only confirmation value documented by the verifier, then run:

```text
npm run verify:guest-cart-staging -- --mode=enabled
```

The verifier must prove:

1. cross-origin and missing request-header attempts return generic `403` without a cart write;
2. one valid create returns `201`, an empty VND cart and a secure `HttpOnly`/`SameSite=Lax` 30-day cookie;
3. the raw token is absent from JSON and logs;
4. a second create with the cookie is idempotent and returns `200` without replacing the cookie;
5. five concurrent reads return only the same cart view;
6. a tampered credential returns generic `404` and clears the cookie;
7. the exact smoke cart is deleted in `finally`, including cascade-owned lines, and a second lookup proves zero matching rows.

If the verifier exits after cart creation but cleanup cannot prove exactly one deletion, keep all runtime disabled, preserve the failure output without secrets and request a separately approved targeted cleanup. Do not delete carts by a broad time range or truncate tables.

## Postflight

1. Confirm carts and cart items returned to their pre-smoke counts.
2. Confirm no Auth user, customer, address, order, payment or product row was created.
3. Confirm the limiter table contains no raw IP/token and its cleanup job remains active.
4. Run security/performance advisors and inspect Vercel runtime errors for the Preview deployment.
5. Restore the staging branch runtime to false or remove its active Preview exposure under a separately reviewed deployment step.
6. Keep Production runtime false/absent and do not connect Cart UI.

Successful staging proves only the guest-cart backend boundary. It does not approve production cart runtime, permanent accounts, email OTP, Turnstile, saved addresses, checkout or payment.
