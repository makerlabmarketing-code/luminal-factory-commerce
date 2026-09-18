# Raffle Detail + Guest Entry Tasks

Status: `CODE_COMPLETE_DEFAULT_OFF`

- [x] R001 Inspect the current Commerce Supabase tables, RLS policies, migration
  ledger, and generated boundary read-only.
- [x] R002 Confirm that no raffle or raffle-entry persistence currently exists.
- [x] R003 Map the approved guest-email contract to a bounded schema/RLS and
  server-mutation plan.
- [x] R004 Author the exact migration, rollback validation, and postflight.
- [x] R005 Add static migration/RLS/grant/idempotency/concurrency tests.
- [ ] R006 Refresh generated database types from the reviewed schema boundary.
- [x] R007 Implement the public raffle detail service and `/raffle/[slug]` route.
- [x] R008 Implement the default-off server-only raffle entry adapter and
  request boundary.
- [x] R009 Implement the accessible guest-entry form and truthful result states.
- [x] R010 Run `npm run check` and disabled-runtime route/security verification.
- [ ] R011 Apply Production SQL only after `RAFFLE-PROD-MIGRATION-01`.
- [ ] R012 Push/deploy the disabled batch only after explicit delivery approval.
- [ ] R013 Run a live test entry only after `RAFFLE-LIVE-SMOKE-01`, then clean
  the fixture and restore the runtime flag to false.
