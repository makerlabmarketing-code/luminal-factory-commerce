# Circus discovery gate — Shop and Raffle

Status: implemented slice, 2026-10-23.

The default Shop and Raffle discovery views present a circus tent exterior with a lit stage. Hovering the light or focusing the entry area parts the curtains slightly and reveals the “Show more” invitation. Clicking the light or button plays a short flash, then opens the existing listing and animates a bubble for the newest published Meowhe artisan keycap in the Commerce catalog. The bubble links to its real Shop detail. A missing or unavailable catalog simply omits the bubble. It does not fabricate a product or announce a raffle.

Search, filter, and pagination URLs in Shop open the results directly. Raffle release status and links still come only from the published raffle source. The tent does not create a raffle entry, cart, order, or payment action.

On touch screens the entry button is visible without hover. Keyboard focus can part the curtain; opening moves focus to the revealed region. Reduced-motion preferences skip the flash and bubble movement. Decorative shapes are hidden from assistive technology, and one route-level heading remains on each page.

Verification: full repository check, localized Shop and Raffle render, focus/click interaction, truthful empty and unavailable states, and production deployment smoke.
