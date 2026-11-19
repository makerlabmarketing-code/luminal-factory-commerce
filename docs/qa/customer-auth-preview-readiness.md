# C-049 | Customer Auth Preview readiness

Status: **Preview fail-closed flags configured; live sign-in remains blocked** (checked 2026-11-19). Do not enable Production Auth to work around this gate.

## Verified repo state

- `/en/account` is a dynamic noindex page that stays unavailable unless `getCustomerAuthEnvironment()` is ready.
- `/api/account/auth` is gated by `COMMERCE_CUSTOMER_AUTH_ENABLED`, requires allowed origin and Turnstile for OTP issuance.
- Google OAuth entry `/api/account/google` and callback stay independently gated by `COMMERCE_CUSTOMER_GOOGLE_AUTH_ENABLED=true`.
- The Google entry link navigates directly to the route (no Next.js Link prefetch).
- Saved addresses remain independently gated by `COMMERCE_SAVED_ADDRESSES_ENABLED` and must remain disabled until separately accepted.

## Vercel metadata inspection (names/targets only; no secret values read)

At inspection, `NEXT_PUBLIC_SUPABASE_URL` targeted Preview and Production. The following were present **only for Production**:

- `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY`
- `NEXT_PUBLIC_CLOUDFLARE_TURNSTILE_SITE_KEY`
- `COMMERCE_CUSTOMER_AUTH_ENABLED`
- `COMMERCE_CUSTOMER_AUTH_ALLOWED_ORIGINS`
- `COMMERCE_CUSTOMER_AUTH_RATE_LIMIT_SECRET`

After the inspection, three **Preview-only** Vercel environment entries were created with value `false`: `COMMERCE_CUSTOMER_AUTH_ENABLED`, `COMMERCE_CUSTOMER_GOOGLE_AUTH_ENABLED` and `COMMERCE_SAVED_ADDRESSES_ENABLED`. Existing Production entries were left untouched. These settings apply to subsequent Preview builds; previously built deployments may need a redeploy to receive them.

A second Supabase project named `Luminal Factory` exists, but it is not confirmed to be an isolated Commerce Auth staging backend. **Do not silently reuse it**, or reuse Commerce Production Auth users, for Preview testing. No third project was created, since cost/free-tier availability was not confirmed.

**Therefore a real Preview sign-in is not yet possible.** The three Preview flags deliberately remain off. Vercel deployment READY and GitHub CI PASS do not verify provider configuration or a real sign-in.

## Safe activation plan (requires explicit approval)

1. Confirm a dedicated, isolated non-production Supabase backend and a Preview deployment hostname. Reusing the current Commerce Production Supabase project is **not approved**. Confirm that creating an extra project/branch has no cost before provisioning it.
2. Configure the Preview-scoped Supabase URL and **publishable** key, Turnstile site key, a new random rate-limit secret of at least 32 characters, and an exact HTTPS `COMMERCE_CUSTOMER_AUTH_ALLOWED_ORIGINS` list. Never copy production service-role secrets into the client or into this checklist.
3. Validate Supabase Auth provider settings, email OTP delivery and Google OAuth redirect allowlist for the selected Preview hostname. The Google callback must be `https://<preview-host>/api/account/google/callback`.
4. Only in Preview: enable `COMMERCE_CUSTOMER_AUTH_ENABLED=true`. Enable `COMMERCE_CUSTOMER_GOOGLE_AUTH_ENABLED=true` only after the provider redirects are verified.
5. Test with two disposable non-production user accounts: OTP request and verification, Google callback, signed-out state, cross-account address isolation and failed/expired OTP. Confirm cookies stay on the same host. Leave Saved Addresses/Raffle History flags off until their separate database gates are approved.
6. Record result and disable the Preview flags after testing if the environment cannot remain appropriately access-controlled.

No Production environment variables, data, database migrations or provider settings should be modified by this document.
