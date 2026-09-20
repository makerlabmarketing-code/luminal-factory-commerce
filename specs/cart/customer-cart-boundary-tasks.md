# Verified Customer Cart Boundary Tasks

Status: `DELIVERED_RUNTIME_OFF_SMOKE_RUNBOOK_PREPARED`

- [x] CC001 Trace guest Cart UI, POST boundary, Customer Auth and merge paths.
- [x] CC002 Confirm the post-merge gap: customer cart exists but Cart can only
  resolve the guest cookie.
- [x] CC003 Verify current Supabase SSR identity guidance and relevant 2026
  changelog entries.
- [x] CC004 Define `anonymous`, `verified_customer` and fail-closed
  `identity_unavailable` routing.
- [x] CC005 Define customer cart read/set/remove ownership, expiry and
  concurrency behavior.
- [x] CC006 Define explicit POST-only merge retry when a verified session still
  carries the guest credential.
- [x] CC007 Define the default-off runtime and Production gate sequence.
- [x] CC008 Obtain owner approval `CART-CUSTOMER-BOUNDARY-01`.
- [x] CC009 Implement the identity resolver and customer cart domain service.
- [x] CC010 Create the CLI-named RPC migration and static security tests.
- [x] CC011 Obtain `CART-CUSTOMER-PROD-MIGRATION-01`, then run transactional
  rollback validation before applying the exact reviewed SQL.
- [x] CC012 Apply the approved migration, run database behavior/concurrency/
  grants/advisor postflight and refresh generated types.
- [x] CC013 Connect the provisional fixed RPC adapter to page and POST routing;
  refresh its generated signature only after approved Production application.
- [x] CC014 Add `sync_required` UI and explicit merge retry interaction.
- [x] CC015 Run unit/integration/security tests and full `npm run check`.
- [ ] CC016 Review 390px, 768px and 1440px layout, keyboard behavior and browser
  console on a reachable deployment.
- [x] CC017 Obtain separate push/deploy approval; keep all Commerce and raffle
  runtime flags false during read-only Production verification.
- [x] CC018 Prepare a distinct integrated runtime smoke runbook.
- [ ] CC019 Obtain `CART-INTEGRATED-SMOKE-01`, then execute the bounded enabled
  window, immediate flag rollback, exact cleanup and postflight.
