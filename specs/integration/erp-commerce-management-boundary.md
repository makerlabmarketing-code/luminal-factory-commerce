# ERP → Commerce Management Boundary

Status: preparatory contract only. No live management route, secret, runtime flag or Production mutation is enabled by this document.

## Decision

Luminal Factory ERP and Luminal Factory Commerce remain separate applications and separate Supabase projects for the current roadmap.

Commerce owns Commerce PostgreSQL state, Storage objects, service-role credentials, privileged RPCs and administrative business invariants. ERP is the operational UI and may request privileged Commerce operations only through a Commerce-owned server boundary.

The integration direction is:

```text
ERP server
  -> authenticated Commerce Admin API / management boundary
      -> Commerce privileged server service
          -> Commerce Supabase database / Storage / RPC
```

The following are explicitly prohibited:

- ERP browser code connecting to the Commerce database with privileged credentials;
- storing the Commerce service-role key in ERP client code;
- Supabase ERP directly mutating Commerce tables as an integration shortcut;
- authorizing a privileged operation from a role or permission value submitted by the browser;
- making the public Commerce Supabase project accept administrative writes through anonymous/authenticated customer policies.

## Authentication and authorization contract

The concrete machine-credential mechanism is intentionally not locked until the ERP-side architecture is reviewed. The Commerce boundary must expose an authorizer abstraction that resolves a verified server identity and explicit scopes.

Required scopes for the first module are:

- `commerce.hero.read`
- `commerce.hero.write`
- `commerce.hero.publish`

A permanent static API key must not be the sole long-term authorization model. The selected implementation should support rotation and a bounded credential lifetime or equivalent replay protection. Commerce remains the final authorization authority for Commerce mutations.

## Versioning

The first management contract is `v1`. Future modules should extend the same boundary instead of creating module-specific privileged backdoors.

Proposed route family after authentication is agreed:

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

The current bucket limit is 10 MB. The upload boundary must validate size, extension/content type and destination path before using the Commerce service role.

## Request rules

All management writes should require:

- verified server-to-server identity;
- explicit scope authorization;
- Zod-validated payloads;
- `Cache-Control: no-store`;
- bounded request sizes;
- a request/correlation identifier;
- idempotency protection where retrying can duplicate work;
- audit logging that records actor, action, target and result without recording secrets.

Do not log authorization credentials or raw service-role keys.

## Current code contract

`src/features/management/commerce-admin-contract.ts` owns the first Commerce-side validation and scope contract. It deliberately contains no Supabase client and no authentication implementation, so the ERP-side identity mechanism can be agreed without coupling privileged credentials into application code.

## Activation gates

Before any route becomes live:

1. review the ERP-side identity/permission implementation;
2. select and test the server-to-server credential mechanism;
3. implement the Commerce authorizer and fail-closed runtime gate;
4. add service-layer operations using the Commerce privileged client only on the server;
5. test unauthorized, insufficient-scope, replay/retry and invalid-payload cases;
6. test Hero draft/upload/publish/unpublish against non-destructive fixtures;
7. verify no privileged credential reaches browser bundles;
8. receive explicit approval before enabling the Production runtime flag.

Until those gates pass, existing Homepage Hero behavior remains unchanged.
