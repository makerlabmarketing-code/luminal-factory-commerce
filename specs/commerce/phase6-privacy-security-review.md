# Phase 6 Privacy and Security Review

## Document metadata

- **Status:** `OWNER_APPROVED_FOR_ISOLATED_SLICE_A_IMPLEMENTATION`
- **Date:** 2026-08-13
- **Runtime status:** `GUEST_CART_REQUEST_BOUNDARY_DISABLED_NO_AUTH_OR_PII`
- **Applies to:** guest cart, permanent customer account, cart attachment, and saved addresses

## Review outcome

The architecture in `phase6-identity-architecture-decision.md` is viable with the controls below. Implementation should be split so the non-PII guest cart can be reviewed and delivered before permanent Auth and saved addresses.

The current Commerce project remains safe for planning:

- live schema matches the two committed Phase 4 migrations;
- customer, inventory, order, payment, refund and event tables have RLS enabled and no public/client policies;
- `anon` and `authenticated` have no grants on those sensitive tables;
- only `service_role` has table privileges there;
- database advisors show informational default-deny and zero-traffic unused-index notices, not a newly introduced vulnerability;
- no Phase 6 table, Auth configuration, Storage bucket or customer row was created during this review.

## Recommended decisions

The owner approved these defaults on 2026-08-13. This approval does not authorize changing production.

| Area | Recommended default | Reason |
| --- | --- | --- |
| Guest cart lifetime | Expire after 30 days of inactivity | Long enough for normal return visits without indefinite tracking |
| Expired/abandoned cart cleanup | Hard-delete within 7 days after expiry | Minimizes retained behavioral data |
| Converted guest credential | Clear its token hash in the same merge transaction | Prevents replay after account attachment |
| Guest cart contents | Product/variant IDs and requested quantities only | Avoids PII and stale price/stock truth |
| Account method | Email OTP, no password/social provider in the first slice | Small credential surface and no password storage UX |
| Account creation | Create/link customer only after verified Auth identity | Prevents email-string account takeover |
| Bot protection | Cloudflare Turnstile on OTP request plus application rate limiting | Supabase-supported, free option and lower email abuse risk |
| Saved addresses | Deferred until guest cart and Auth isolation pass staging | Keeps the first two slices free of fulfillment PII |
| Address deletion | Immediate removal from the address book on customer request | Honors data minimization; order snapshots are separate |
| Authenticated caching | Dynamic, private, no-store responses | Prevents session/customer data crossing cache boundaries |
| Logging | IDs/correlation codes only; no raw email, address, OTP or tokens | Reduces incident and observability leakage |

## Minimal data inventory

### Guest cart

Allowed:

- random internal cart ID;
- one-way guest-token hash;
- product and optional variant references;
- requested quantity;
- currency;
- lifecycle and activity timestamps.

Forbidden:

- email, name, phone or address;
- raw cookie token;
- payment details;
- IP/user-agent history in the cart tables;
- authoritative price, stock or reservation claims.

### Permanent customer

Allowed in the first account slice:

- verified Supabase Auth subject;
- verified contact email synchronized through a trusted server flow;
- optional display name;
- created/updated timestamps.

Do not add date of birth, gender, social handle, marketing profile, avatar, phone or saved address merely because account UI could display them.

### Saved address

When separately approved, the minimum fulfillment address may contain:

- recipient name;
- phone number;
- ISO country code;
- administrative area/locality;
- address line 1 and optional line 2;
- optional postal code where the destination requires it;
- optional customer-facing label such as `Nhà` or `Công ty`.

Do not store identity documents, payment data, precise geolocation, delivery instructions containing sensitive access information, or an unbounded notes field.

## Retention and deletion

- Guest cart: 30-day sliding inactivity expiry; hard-delete within 7 additional days.
- Converted guest token: clear immediately; converted cart/item retention should be no longer than needed to diagnose merge failures and must not duplicate an order.
- Saved address: customer may delete it immediately; deleting an address must not rewrite historical order snapshots.
- Customer profile: provide a later account-deletion workflow. Before hard deletion, confirm whether a lawful order/financial retention requirement applies; retain only the required order snapshot, not a live reusable address profile.
- Auth user deletion and session revocation require an operational runbook. Deleting a user alone must not be assumed to invalidate already-issued tokens immediately.

Final legal retention for orders, invoices, payment and shipment records is outside Phase 6 and must be decided with the Phase 7 jurisdiction/accounting review.

## Authentication controls

- First method: email OTP using Supabase Auth and `@supabase/ssr` PKCE/cookie handling.
- No password, OAuth, anonymous sign-in, MFA or passkey in the first account slice.
- Configure only exact production and Preview callback origins; never use a wildcard redirect.
- OTP responses must not reveal whether an email already has an account.
- Use verified claims for normal access checks; use a fresh Auth user lookup for account linking, email synchronization, destructive account actions and other revocation-sensitive operations.
- Never authorize from `getSession()` data alone, email text, `user_metadata`, or a hidden UI control.
- Production Auth email must use an approved SMTP sender. Supabase's default sender is development-limited and is not a production launch dependency to assume silently.

## Rate limiting and abuse controls

Recommended application limits, to be validated during staging:

- OTP request: 3 attempts per normalized-email key per 15 minutes and 10 per source-IP key per hour;
- OTP verification: rely on Supabase's verification limits plus a short application cooldown after repeated failure;
- guest cart creation: 20 per source-IP key per hour, while ordinary mutations on an existing valid cart use a higher bounded limit;
- cart merge: one in-flight merge per guest cart/account pair, protected by idempotency.

Rate-limit keys should use keyed hashes where email is involved. Do not log or persist raw email solely for rate limiting. Return generic `rate_limited` responses and fail closed when the anti-abuse dependency is unavailable.

Cloudflare Turnstile is the recommended free CAPTCHA provider, but enabling it changes production Auth configuration and requires the operator to create/approve the widget keys.

## Session, cookie and CSRF controls

### Guest cart cookie

- at least 256 bits of random entropy;
- `HttpOnly`, `SameSite=Lax`, `Path=/` and `Secure` outside localhost;
- no `Domain` attribute unless a future cross-subdomain requirement is approved;
- 30-day maximum age matching server expiry;
- rotate after merge and any suspected ownership-boundary issue;
- never include in URL, HTML, analytics or client-readable state.

### Auth session

- follow current `@supabase/ssr` cookie handling rather than inventing a parallel session format;
- authenticated routes and responses are dynamic/private/no-store;
- apply Supabase token-refresh cache headers correctly;
- validate same-origin mutation requests and reject unsupported content types;
- use POST for sign-out and mutations;
- set a restrictive Content Security Policy in launch hardening before customer Auth goes live.

## Authorization matrix

| Capability | Public/guest browser | Authenticated customer | Storefront trusted server | ERP |
| --- | --- | --- | --- | --- |
| Read published catalog | Approved public fields | Same | Same | Operational boundary |
| Create/update guest cart | No direct table access | No direct guest-token access | Validated token-hash lookup | None |
| Read own attached cart | None | Own cart only | Verified subject + ownership | None |
| Manage own profile/address | None | Own rows only | Verified subject + ownership | No public identity reuse |
| Read own order summary | None in Phase 6 | Planning only; read-only policy later | Verified subject + ownership | Operational fulfillment |
| Inventory/order/payment mutation | None | None | Deferred trusted checkout | Approved operational workflows only |

## Threat review

| Threat | Required mitigation |
| --- | --- |
| Stolen/tampered guest cookie | High-entropy token, stored hash, expiry, rotation, constant-time comparison where applicable |
| Cart enumeration | No row ID/token in URL; generic not-found; no guest table grants |
| Cross-user data leak | Verified Auth subject, ownership predicates, negative authorization tests, no shared caching |
| Email/account enumeration | Generic OTP and account-link responses; rate limit and Turnstile |
| Email-string record takeover | Link only by verified Auth subject; no automatic raffle/customer merge by email |
| CSRF | SameSite cookie, same-origin checks, POST-only mutations, origin validation |
| XSS session theft | CSP plan, output escaping, no raw HTML, dependency/security gates; Auth cookies follow official SSR handling |
| Token/PII log leakage | Structured allowlist logging and redaction tests |
| Merge replay/race | Idempotency key, consistent row lock ordering, one transaction, consumed-token clearing |
| Stale price/stock | Re-read authoritative catalog/availability; cart is never a reservation or price snapshot |

## Staging security test gate

Before any production enablement, tests must prove:

1. a missing, expired or altered guest cookie cannot read or mutate a cart;
2. one guest cannot enumerate another guest's cart;
3. one Auth user cannot read/update another customer's profile, address, cart or order;
4. anonymous/public API roles retain no sensitive direct table access;
5. guest-to-account merge is idempotent under retry and concurrent requests;
6. sign-out, token expiry and revoked/current-user checks behave as documented;
7. authenticated responses are not cached or served across users;
8. OTP and cart abuse limits fail closed and do not reveal account existence;
9. logs contain no raw token, OTP, email or address;
10. deletion/expiry removes the intended data without damaging order history.

## Owner approval record

The owner approved these four items on 2026-08-13:

1. **30-day guest-cart inactivity retention plus deletion within 7 days.**
2. **Email OTP as the only first account method.**
3. **Cloudflare Turnstile as the production bot-protection provider.**
4. **Saved addresses deferred until after guest-cart and Auth isolation pass staging.**

At the time of this record, the four-default approval permitted isolated Slice A migration and test authoring but did not itself authorize production application or live Auth/Turnstile.

On 2026-08-26 the separately guarded guest-cart workflow passed its isolated Preview create/delete smoke and returned cart/Auth data to zero rows; the Preview flag was restored to false. Slice B has a default-off OTP request/verification boundary with exact-origin, strict-input, no-store, identity-generic and fresh-user checks. Its private keyed-hash Auth limiter passed rollback validation, was applied once as `20260826105102_add_customer_auth_rate_limits`, and passed zero-row postflight. No Account UI, production Auth/Turnstile configuration, customer RLS access, PII, address, cart attachment or production runtime is enabled. Isolated Auth configuration and staging approval remain mandatory before activation.

## References

- Supabase CAPTCHA protection: <https://supabase.com/docs/guides/auth/auth-captcha>
- Supabase production checklist and Auth email limits: <https://supabase.com/docs/guides/deployment/going-into-prod>
- Supabase SSR Auth guidance: <https://supabase.com/docs/guides/getting-started/tutorials/with-nextjs>
- Supabase RLS guidance: <https://supabase.com/docs/guides/database/postgres/row-level-security>
