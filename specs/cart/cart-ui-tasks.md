# Cart UI Tasks

Status: `CODE_COMPLETE_LOCAL_RUNTIME_OFF_PREVIEW_REVIEW_PENDING`

- [x] C001 Inspect the existing guest-cart service and request contracts.
- [x] C002 Confirm that the public cart view contains identities, quantity,
  expiry and unavailable count, but no title, media or price.
- [x] C003 Draft the Cart experience script and formal page specification.
- [x] C004 Define the server-only catalog enrichment and checked-estimate plan.
- [x] C005 Obtain owner approval `CART-UI-01`.
- [x] C006 Implement the private dynamic `/cart` route and page service.
- [x] C007 Implement bounded batch catalog enrichment with validated media,
  variant and VND price presentation.
- [x] C008 Implement accessible line update/removal interaction using the
  existing POST-only API.
- [x] C009 Add empty, disabled, stale, incomplete-estimate and service-failure
  states without automatic cart creation.
- [x] C010 Add behavior, route, security and non-goal tests.
- [x] C011 Run React quality review and `npm run check`; verify the production
  build returns the default-off Cart state with private/no-store and noindex.
- [ ] C011A Review the rendered Cart at 390px, 768px and 1440px plus browser
  console on a reachable Preview. The cloud browser cannot reach workspace
  localhost, and no local Chromium binary is installed.
- [x] C012 Commit locally; push/deploy only after explicit delivery approval.
- [ ] C013 Prepare a separate Production activation/smoke runbook. Do not enable
  guest-cart, Customer Auth, merge, address or raffle runtime in this slice.
- [ ] C014 Design the verified customer-attached cart read/mutation boundary
  before Cart, Customer Auth and merge can be enabled together.
