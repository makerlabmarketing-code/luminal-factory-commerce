# Storefront UI implementation branch

- **Purpose:** Produce reusable, responsive, accessible storefront presentation without moving business logic into generic components.
- **Trigger:** A task changes pages, layout, design tokens, navigation, media, or UI states.
- **Required inputs:** Approved scope/page script, existing primitives/tokens/assets, `ui-rules.md`, `architecture.md`, and package scripts.
- **Execution:** Inventory existing UI; define semantics and responsive/loading/error/empty behavior; reuse centralized tokens; keep Server Components unless interaction requires a narrow Client Component; reserve media aspect ratios; implement keyboard/focus/reduced-motion behavior; validate.
- **Forbidden:** Fake commerce claims, a second styling system, generic-component business rules, unapproved heavy animation/WebGL, inaccessible hover-only actions.
- **Expected output:** Focused components, centralized editable content, responsive states, and a completion report with visual/accessibility limitations.
- **Validation:** Run `npm run check`; keyboard-test navigation and controls; inspect mobile/desktop, heading order, landmarks, contrast, alt text, layout shift, and reduced motion.
