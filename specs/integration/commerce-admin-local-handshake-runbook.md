# I-006 local HTTPS handshake preparation

Status: `RUNNER_PREPARED / LIVE_HANDSHAKE_NOT_RUN`.

Use the existing Commerce checkout as a local test process. This topology creates
no Git branch, Supabase branch, project, paid service or public test route. The
Production flags on both Vercel applications remain false. The current ERP Hero
Manager is deployed but cannot replace the public Hero until I-006 and I-007 pass.

## Operator setup

1. On the operator's machine, run Commerce over HTTPS on localhost with a
   certificate whose SAN covers localhost and whose CA is trusted by Node.
   Next's `dev --experimental-https` accepts explicit certificate/key paths.
   Use `NODE_EXTRA_CA_CERTS` for that CA when invoking the verifier. Keep TLS
   certificate and hostname verification enabled.
2. In that local server process only, set
   `COMMERCE_ADMIN_INTEGRATION_ENABLED=true`, the existing Commerce Supabase
   server configuration, and a test-only HMAC client/audience/current key pair.
   These values must not modify Vercel Production configuration.
3. In the verifier process, set `COMMERCE_ADMIN_SMOKE_URL=https://localhost:3000`
   and `COMMERCE_ADMIN_SMOKE_ACTOR_ID` to the approved ERP operator identity.
   Reuse ERP variable names `COMMERCE_ADMIN_API_CLIENT_ID`,
   `COMMERCE_ADMIN_API_KEY_ID`, `COMMERCE_ADMIN_API_AUDIENCE`,
   `COMMERCE_ADMIN_API_WORKSPACE_ID`, and `COMMERCE_ADMIN_API_HMAC_SECRET_BASE64`,
   with matching test values. Keep credentials in operator-only environment
   storage; never paste them into the sheet, Git, chat or logs.
4. If testing overlap rotation, configure Commerce's previous-key pair and the
   corresponding `COMMERCE_ADMIN_SMOKE_PREVIOUS_KEY_ID` and
   `COMMERCE_ADMIN_SMOKE_PREVIOUS_SECRET_BASE64` in the verifier.
   To verify revocation, supply a separate test-only removed key through
   `COMMERCE_ADMIN_SMOKE_REVOKED_KEY_ID` and
   `COMMERCE_ADMIN_SMOKE_REVOKED_SECRET_BASE64`. That key must be absent from
   Commerce's accepted current/previous configuration. Both variables are required
   together; its ID must differ from accepted keys. The runner reports revocation
   independently and fails unless the signed read is rejected with HTTP 401.
5. Run `npm run verify:commerce-admin-handshake`. The runner accepts local HTTPS
   origins only, refuses disabled TLS, follows no redirects and caps each request
   at ten seconds. It stops on the first unexpected result.

## Evidence and effects

The runner sends seven requests (up to nine with previous and revoked keys): authorized
Hero list, repeated nonce, signature/path/scope/body tampering, expired timestamp,
and optional previous-key acceptance and revoked-key rejection. A body-tamper request uses an invalid draft
payload and must fail authentication. No valid create/update/publish/unpublish or
upload request is generated. No Hero or Storage fixture is created.

The existing replay and bounded denial-audit infrastructure can record these
requests in the configured Commerce database. Its existing TTL/Cron owns expiry;
this runner does not delete unrelated audit or replay records. It does not print
Hero list contents, secrets, signatures, actor/workspace IDs or request headers.

`HANDSHAKE_ONLY_PASS` is deliberately narrower than I-006 completion. It does not
prove ERP session permissions, draft operation idempotency, key revocation when
its optional case is not configured, bounded
audit database effects, asset upload, or production activation. After transport
passes, complete those remaining cases using the approved draft-only fixture and
cleanup plan before recording I-006 PASS. Production activation remains I-007.

## Current handoff

The sheet confirms I-005/I-008 merged and I-009 Storage ready. The operator has
added Production variable names, but matching values and a real handshake have
not been verified. The remaining setup is the trusted local HTTPS test process
and its test-only matching environment. Repository/mocked tests are not live
connection evidence. Rollback of this preparation is a code/document revert.
