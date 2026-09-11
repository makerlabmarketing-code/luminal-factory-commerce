# ERP → Commerce Management Boundary

Status: preparatory contract only. No live management route, secret, runtime flag or Production mutation is enabled by this document.

## Decision

Luminal Factory ERP and Luminal Factory Commerce remain separate applications and separate Supabase projects for the current roadmap.

Commerce owns Commerce PostgreSQL state, Storage objects, service-role credentials, privileged RPCs and administrative business invariants. ERP is the operational UI and may request privileged Commerce operations only through a Commerce-owned server boundary.

The integration direction is:

```text
ERP server
  -> HTTPS + signed Commerce Management request
      -> Commerce Admin API / management boundary
          -> Commerce privileged server service
              -> Commerce Supabase database / Storage / RPC
```

The following are explicitly prohibited:

- ERP browser code connecting to the Commerce database with privileged credentials;
- storing the Commerce service-role key or the ERP→Commerce HMAC secret in browser/client code;
- Supabase ERP directly mutating Commerce tables as an integration shortcut;
- authorizing a privileged operation from a role or permission value submitted by the browser;
- making the public Commerce Supabase project accept administrative writes through anonymous/authenticated customer policies;
- disabling TLS certificate verification, following arbitrary redirects, or falling back to plain HTTP for management traffic.

## Security model

There is no such thing as absolute security. This boundary is designed to fail closed and to make third-party request modification, replay and credential misuse materially harder while keeping secrets off the browser.

ERP is responsible for verifying the human session, workspace membership and capability before a management request is constructed. Only the ERP server may sign the request. Commerce does not trust that decision blindly: Commerce verifies the server credential, signed request envelope, replay state and required Commerce scope before any privileged action.

All management traffic must use HTTPS with normal certificate validation enabled. HMAC protects integrity and peer possession of the shared machine credential even if an intercepted request is modified in transit. TLS provides confidentiality in transit. A compromised ERP or Commerce server remains outside the guarantees of this transport boundary and requires normal host, secret and deployment hardening.

## HMAC request contract

The first machine-authentication profile is `lfc-hmac-v1` using HMAC-SHA256. Secrets must be generated from at least 32 cryptographically random bytes, must never be sent on the wire, and must be separate per environment and calling service. `keyId` is public metadata used for lookup and rotation; it is not the secret.

Every signed request carries:

```text
X-Luminal-Signature-Version: lfc-hmac-v1
X-Luminal-Client-Id
X-Luminal-Key-Id
X-Luminal-Audience
X-Luminal-Request-Id
X-Luminal-Timestamp
X-Luminal-Nonce
X-Luminal-Actor-Id
X-Luminal-Workspace-Id
X-Luminal-Scope
X-Luminal-Body-SHA256
X-Luminal-Signature
```

The canonical string is newline-delimited in exactly this order:

```text
signature-version
client-id
key-id
audience
request-id
timestamp
nonce
actor-id
workspace-id
scope
HTTP-method
request-path
content-type
body-sha256
```

Rules:

- HTTP method is uppercase.
- v1 management JSON uses exact content type `application/json`.
- the SHA-256 digest is calculated from the exact raw request-body bytes before JSON parsing;
- the signed path must stay under `/api/admin/v1/` and must not contain fragments or dot segments;
- mutating v1 endpoints should avoid query strings; if query support is added later it needs one canonical ordering/encoding rule before activation;
- signature comparison must use a constant-time primitive;
- signatures, secrets and raw service-role keys must never be logged.

This binds the body, route, HTTP verb, actor/workspace context, requested scope, intended Commerce environment and request identity into one integrity check. Changing any signed field invalidates the signature.

## Replay resistance

Commerce must reject a request when any of these conditions fail:

1. the signature version, client and key are recognized and active;
2. the configured audience exactly matches the request audience;
3. timestamp is inside the allowed clock-skew window, currently 90 seconds;
4. nonce syntax is valid and the `(keyId, nonce)` pair has not already been accepted within the replay-retention window;
5. body hash matches the exact received body bytes;
6. HMAC matches using constant-time comparison;
7. the credential is allowed to request the signed Commerce scope;
8. the route requires that scope;
9. the ERP actor/workspace metadata passes any additional Commerce policy for the operation.

Nonce acceptance must be atomic. A process-local in-memory set is not sufficient for multi-instance Production. The concrete durable replay store will be selected before routes are activated. Integration stays disabled until that exists and has concurrency tests.

Replay protection and operation idempotency are separate. Retryable writes that could duplicate work also require an idempotency key/result record at the relevant Commerce service boundary.

## Credential lifecycle

The HMAC design must support overlapping key rotation:

- multiple active `keyId` values may be accepted during a bounded rotation window;
- each key has explicit activation and retirement state;
- ERP signs only with the current key;
- Commerce may verify the current and temporarily previous key during rotation;
- a revoked key fails closed immediately;
- Production, Preview and local credentials are distinct;
- credentials are never committed to Git or exposed through `NEXT_PUBLIC_*` variables.

If the hosting/network layer later supports practical mutual TLS, mTLS may be added as defense in depth. It does not replace request signing, replay protection or application authorization.

## Authorization contract

Required scopes for the first module are:

- `commerce.hero.read`
- `commerce.hero.write`
- `commerce.hero.publish`

Future modules extend the same least-privilege model, for example Products, Collections and Orders. A Hero credential must not automatically gain Order write authority.

Commerce remains the final authorization authority. A signed ERP claim proves what the ERP server is requesting, not that Commerce must allow it.

## Versioning

The first management API contract is `v1`. Future modules should extend the same boundary instead of creating module-specific privileged backdoors.

Proposed route family after implementation approval:

```text
/api/admin/v1/homepage-hero
/api/admin/v1/homepage-hero/:id
/api/admin/v1/homepage-hero/:id/publish
/api/admin/v1/homepage-hero/:id/unpublish
/api/admin/v1/homepage-hero/assets
```

These routes are not live yet.

## Homepage Hero responsibility

The first reusable management module is Homepage Hero.

ERP will eventually be able to:

1. list Hero drafts and the current active Hero;
2. create or update draft metadata;
3. upload a derived web GLB and optional poster through the Commerce boundary;
4. preview a draft without making it active;
5. publish one Hero atomically;
6. unpublish the current Hero.

Commerce already owns the database constraints, public Storage bucket, asset-existence guard and service-role-only publish/unpublish RPC. The management API must call those existing trusted boundaries rather than reimplementing activation logic in ERP.

## Asset import

The `homepage-hero` Storage bucket remains the runtime source for remote Hero assets. The bundled `/models/meowhe-hero.glb` remains the local fallback.

Google Drive may be accepted later only as an import source. The Commerce server must download, validate and copy the derived web asset into approved Commerce Storage before a draft may be published. Drive is not a runtime fallback or CDN.

The current bucket limit is 10 MB. The upload boundary must validate size, extension/content type, binary signature where applicable, destination path and final Storage existence before using the Commerce service role or allowing publish.

## Request and response rules

All management writes require:

- verified server-to-server HMAC identity;
- explicit least-privilege scope authorization;
- strict Zod validation after raw-body integrity verification;
- `Cache-Control: no-store`;
- bounded request sizes;
- a UUID request/correlation identifier;
- replay protection;
- idempotency protection where retrying can duplicate work;
- audit logging that records client, actor, workspace, action, scope, target, request id and result without credentials or raw signatures;
- generic authentication failures that do not reveal whether a client id, key id, nonce or signature component was the failing element.

The boundary must reject unsupported content types, malformed duplicate security headers, unexpected HTTP methods and requests outside the configured management origin/audience.

## Current code contract

`src/features/management/commerce-admin-contract.ts` owns Commerce scopes and Homepage Hero payload validation.

`src/features/management/commerce-admin-security-contract.ts` owns the transport-level signed-envelope constants, schemas, timestamp policy and canonical request format. It intentionally contains no secret, Supabase client, route implementation or live verifier.

## Activation gates

Before any route becomes live:

1. review the ERP-side HMAC transport implementation against the exact canonical string contract;
2. implement Commerce verification using raw body bytes, SHA-256, HMAC-SHA256 and constant-time comparison;
3. implement a durable atomic nonce/replay store and concurrency tests;
4. implement credential lookup, per-environment audience binding, key rotation and immediate revocation;
5. implement Commerce scope authorization independent of ERP browser claims;
6. add fail-closed runtime gating and Commerce-only privileged service operations;
7. test tampered body, path, method, scope, actor, workspace, timestamp, audience, nonce and signature cases;
8. test duplicate/replayed requests and concurrent nonce races;
9. test expired/revoked/rotated credentials;
10. test Hero draft/upload/publish/unpublish against non-destructive fixtures;
11. verify no HMAC or Commerce privileged credential reaches browser bundles, client logs, error payloads or analytics;
12. receive explicit approval before enabling the Production integration runtime flag.

Until those gates pass, existing Homepage Hero behavior remains unchanged and no ERP→Commerce request is sent.
