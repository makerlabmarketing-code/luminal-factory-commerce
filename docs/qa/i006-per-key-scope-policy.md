# I-006 · HMAC scopes per credential (staged, non-breaking)

## Why this exists

Commerce currently maps both HMAC keys to the entire `COMMERCE_ADMIN_SCOPES` list. The API verifier correctly checks signed route scope, but a valid machine key can still request broad Product/Raffle/Payment/Publish operations, subject to the ERP actor's separately checked permissions.

Read-only Commerce audit aggregate checked on 16 Nov 2026 showed successful traffic in 7 scope groups within 90 days: `commerce.hero.read`, `commerce.hero.write`, `commerce.hero.publish`, `commerce.product.read`, `commerce.product.write`, `commerce.raffle.read` and `commerce.raffle.entry.read`. **Absence of recent events is not evidence that another scope is unnecessary.** No identifiable audit records or credentials were read.

## Opt-in server-side configuration

- `COMMERCE_ADMIN_HMAC_CURRENT_ALLOWED_SCOPES`: comma-delimited exact scope names for current key.
- `COMMERCE_ADMIN_HMAC_PREVIOUS_ALLOWED_SCOPES`: optional comma-delimited exact scope names for previous key during rotation.
- Values are server-only, validated against `COMMERCE_ADMIN_SCOPES`. Unknown, empty or duplicate names reject the entire enabled integration configuration with a generic 503 error. No fallback to broad permissions on invalid input.
- Without either variable, behavior remains **unchanged** for existing Production: legacy full scope set. Do not mistake a code deployment for effective least privilege.
- When current scopes are set but previous scopes are omitted, the previous key **inherits current scopes**, not unrestricted access.
- A previous key cannot be configured with any scope missing from the current key's allowlist. Explicit previous scopes with no previous key are invalid.
- The signed request's scope, verifier route requirement and ERP authorization remain in place. Invalid or excluded scope requests fail verification **before** consuming replay nonce.

## Production rollout gate

1. Read-only inventory ERP callsites, current `COMMERCE_ADMIN_SCOPES` and Commerce aggregate audit. Confirm upcoming Raffle/Result/Payment features which may be operationally required despite zero recent audit events.
2. Prepare a concrete allowlist matrix for Owner review: required scope, ERP route, Commerce route, expected actor permission and fallback behavior. Separately review any previous-key overlap.
3. Explicitly approve the resulting **Production environment changes**, including rollback. These controls narrow a machine credential and can intentionally disable functional paths.
4. Configure allowlist variables only through Vercel Production secure server environment, redeploy, and test authorized + unauthorized calls with a trusted authenticated ERP session. Do not copy secrets into chat or public logs.
5. Examine denied audit without personal identifiers, verify no unauthorized nonce consumption, ensure Raffle and Product flows still function, then close the live scope gate.

## Evidence / boundaries

- CI runs `tests/commerce-admin-per-key-scope-policy.test.mjs` against real TypeScript environment parser and HMAC verifier with synthetic keys, plus existing HTTPS loopback and PostgreSQL 16 isolated contract tests.
- No additional paid service or key rotation; **do not change current/previous HMAC key IDs or secrets** while introducing permission lists.
- Full I-006 Production E2E (Supabase durable replay, idempotency/audit and end-user ERP session) is still separately gated.
