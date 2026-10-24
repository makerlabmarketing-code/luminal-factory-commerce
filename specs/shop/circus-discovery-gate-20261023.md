# Circus discovery gate — Shop and Raffle

Status: implemented slice, 2026-10-23.

Visual revision, 2026-10-24: The tent recedes into a near-black, plum stage. Its canopy and curtains stay in shadow; the warm spotlight is concentrated in the opening between the curtains. The Meowhe character introduction sits in the foreground and remains readable before interaction. Hovering the light or focusing the entry area parts the curtains slightly. “Show more” opens a product story panel using the newest published Meowhe catalog description, then animates its product bubble and exposes the existing listing. The known Lolipop description has a reviewed Vietnamese rendering when the catalog returns that exact English text; other catalog descriptions remain unmodified. The bubble links to the real Shop detail for the fuller product story. A missing or unavailable catalog omits the bubble and uses generic character copy; it does not fabricate a product or announce a raffle.

Search, filter, and pagination URLs in Shop open the results directly. Raffle release status and links still come only from the published raffle source. The tent does not create a raffle entry, cart, order, or payment action.

On touch screens the entry button is visible without hover. Keyboard focus can part the curtain; opening moves focus to the revealed region. Reduced-motion preferences skip the flash and bubble movement. Decorative shapes are hidden from assistive technology, and one route-level heading remains on each page.

Verification: full repository check, localized Shop and Raffle render, focus/click interaction, truthful empty and unavailable states, and production deployment smoke. Recheck the revised dark stage at desktop and mobile widths before closing the visual acceptance item.
