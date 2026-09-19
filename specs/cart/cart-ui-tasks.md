# Cart UI Tasks

Status: `PLANNED_AWAITING_CART_UI_01`

- [x] C001 Inspect the existing guest-cart service and request contracts.
- [x] C002 Confirm that the public cart view contains identities, quantity,
  expiry and unavailable count, but no title, media or price.
- [x] C003 Draft the Cart experience script and formal page specification.
- [x] C004 Define the server-only catalog enrichment and checked-estimate plan.
- [ ] C005 Obtain owner approval `CART-UI-01`.
- [ ] C006 Implement the private dynamic `/cart` route and page service.
- [ ] C007 Implement bounded batch catalog enrichment with validated media,
  variant and VND price presentation.
- [ ] C008 Implement accessible line update/removal interaction using the
  existing POST-only API.
- [ ] C009 Add empty, disabled, stale, incomplete-estimate and service-failure
  states without automatic cart creation.
- [ ] C010 Add behavior, route, security and non-goal tests.
- [ ] C011 Run React quality review, `npm run check`, and local browser review at
  390px, 768px and 1440px.
- [ ] C012 Commit locally; push/deploy only after explicit delivery approval.
- [ ] C013 Prepare a separate Production activation/smoke runbook. Do not enable
  guest-cart, Customer Auth, merge, address or raffle runtime in this slice.
