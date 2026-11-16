# I-006 · HTTPS loopback handshake QA (no production writes)

**Scope:** CI-only security verification using the real Commerce verifier and signed HMAC envelope, isolated to a local HTTPS loopback listener. All keys, certificates, draft receipts and nonces are disposable test-only values.

## How to run

- Normal repository CI: `npm test` (via `npm run check`) automatically executes `tests/commerce-admin-https-handshake.test.mjs`.
- The test generates a 1-day certificate with OpenSSL, launches a separate Node process with `NODE_EXTRA_CA_CERTS` and TLS verification **enabled**, and connects only to `https://127.0.0.1:<ephemeral-port>`.
- The child `scripts/qa/run-commerce-admin-https-e2e.mjs` loads the **actual** TypeScript `verifyCommerceAdminRequest` verifier and uses the existing `verify-commerce-admin-handshake.mjs` signer/runner. The harness has no Supabase client and no external HTTP origin.
- The child receives only explicitly enumerated environment variables. No Vercel/Production HMAC credential, key ID, secret, service-role token, session cookie or public URL is forwarded.
- The test cleans up all in-memory nonce and draft records, and the parent deletes the temporary certificate and private key even on failure.
- No additional npm dependency, Vercel project, Supabase branch, stored artifact or paid service is required.

## Acceptance checks

1. Valid signed GET works; exact same nonce replay fails.
2. Invalid signature, tampered path/scope/body and expired timestamp fail.
3. Overlapping previous key works; revoked key fails.
4. A valid, signed publish request is **rejected** by the narrowed **test-only** credential before nonce consumption.
5. A synthetic draft POST is created once. Retrying the same `operationId` with a fresh signed nonce reuses the draft receipt; replay is rejected; changed payload with the same operation ID conflicts.
6. Every synthetic draft receipt is deleted, the HTTPS listener closes and no Production call was made.

## What this does NOT prove

This harness intentionally replaces the **production Supabase nonce store and `manage_homepage_hero` RPC** with isolated in-memory stores. It therefore **does not** verify the database's durable replay atomicity, the live Hero idempotency RPC, live actor/ERP session permissions, live server-to-server credentials, or read/write/rotate/audit behavior across deployed ERP and Commerce instances.

**I-006 remains OPEN** until those boundaries have a separately approved scoped E2E topology, read-only preflight, explicit cleanup and live authenticated evidence. Do not rotate Production HMAC secrets, change `COMMERCE_ADMIN_INTEGRATION_ENABLED`, publish Heroes, mutate Commerce Product/Raffle/Payment, or call signed Production endpoints from this test.

The original repository spec may describe the runtime as default-disabled. Historical statements must not be treated as current Production state; observe actual hosting configuration under controlled access before any future test.
