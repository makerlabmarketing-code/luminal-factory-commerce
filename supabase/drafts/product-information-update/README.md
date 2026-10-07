# Product information update — production approval pending

Prepared for the owner's 07/10 ERP correction. No automatic migration is added.
Current live RPC definition was read and matches the original draft-only branch.

Only the `update_draft` WHERE predicate and missing/protected-field error change.
Draft editing is retained. Published and archived products allow name/description
updates only when slug, product_type and release_type match the existing row.
Status and published_at are not assigned by this action. No price, inventory,
variant, media, translation, order, raffle or customer data is written.

No tables, columns, indexes, policies, grants expansion or backfill are introduced.
Function signature, invoker execution, timeout and existing receipt behavior stay
unchanged. Public/authenticated execution stays denied. Rollback restores the
original function without deleting later information edits.

## Validation completed

- ERP: 911 tests, lint, TypeScript, build with throwaway public build configuration.
- Commerce: complete `npm run check` passed.
- Disposable embedded PostgreSQL via PGlite 0.5.8: three status updates, lifecycle
  and published_at preservation, protected fields, keycap sale rule, identical
  retry, conflicting retry, public execution denial, rollback and fixture cleanup.

Reproduce outside the application dependency tree:

```sh
npm install --prefix /tmp/luminal-product-sql --no-audit --no-fund @electric-sql/pglite@0.5.8
NODE_PATH=/tmp/luminal-product-sql/node_modules PRODUCT_SQL_TEST=DISPOSABLE_LOCAL_DATABASE node scripts/verify-product-information-sql.mjs
```

## Concrete production gate

1. Owner approves this exact `forward.sql` RPC replacement and ERP activation.
2. Re-read `preflight.sql`; stop if the current function or permissions changed.
3. Deliver the approved SQL through the authorized migration/deployment path.
4. Verify definition and denied public execution without catalog writes.
5. Set ERP `COMMERCE_PRODUCT_INFORMATION_UPDATE_ENABLED=true`, deploy and check
   the per-product editor. This flag is server-only presentation gating; the
   signed Commerce API and SQL remain responsible for authorization.
6. Actual catalog information edits are owner actions, not an automatic smoke.

Until approved, Production ERP exposes view-only information for published and
archived products. Other editors keep their separate existing draft rules.
Rollback: turn the ERP flag off, deploy, then apply the reviewed `rollback.sql`.
