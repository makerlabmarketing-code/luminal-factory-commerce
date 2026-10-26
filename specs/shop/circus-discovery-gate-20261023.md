# Circus discovery gate — Shop and Raffle

Status: implemented slice, 2026-10-23.

Continuation, 2026-10-26: the owner approved one connected Home → Shop stage → Raffle program journey. Shop now keeps the open curtain behind the story and product bubble. Raffle no longer repeats this entrance; it presents the published release program in the same material language. See `meowhe-stage-journey-20261026.md`. Earlier Shop/Raffle shared-gate descriptions below record the previous implementation, not the current Raffle composition.

Visual revision, 2026-10-24: The tent recedes into a near-black, plum stage. Its canopy and curtains stay in shadow; the warm spotlight is concentrated in the opening between the curtains. The Meowhe character introduction sits in the foreground and remains readable before interaction. Hovering the light or focusing the entry area parts the curtains slightly. “Show more” opens a product story panel using the newest published Meowhe catalog description, then animates its product bubble and exposes the existing listing. The known Lolipop description has a reviewed Vietnamese rendering when the catalog returns that exact English text; other catalog descriptions remain unmodified. The bubble links to the real Shop detail for the fuller product story. A missing or unavailable catalog omits the bubble and uses generic character copy; it does not fabricate a product or announce a raffle.

Curtain correction, 2026-10-24: The two curtain edges slope away from a shared apex to create a triangular entrance. A warm triangular stage glow fills that entrance behind the fabric. No bulb or glowing sphere appears outside the tent; the spotlight itself is the interactive target.

Art direction refinement, 2026-10-24: The CSS tent illustration is replaced by two original Luminal scene assets, generated for this page after studying the *mood* of a broad Adobe Stock “creepy circus” search. The assets are not copied or licensed stock. Aged burgundy and bone fabric, cool fog, warm light inside the entrance and deep plum negative space give the scene material depth. The closed scene shows a narrow triangular slit; hovering or focusing the entrance crossfades to the wider opening. The click/flash/story/product behavior and catalog source remain the same. The separate closed/open WebP assets are stored under `public/images/discovery/` and total about 213 KB.

Search, filter, and pagination URLs in Shop open the results directly. Raffle release status and links still come only from the published raffle source. The tent does not create a raffle entry, cart, order, or payment action.

On touch screens the entry button is visible without hover. Keyboard focus can part the curtain; opening moves focus to the revealed region. Reduced-motion preferences skip the flash and bubble movement. Decorative shapes are hidden from assistive technology, and one route-level heading remains on each page.

Verification: full repository check, localized Shop and Raffle render, focus/click interaction, truthful empty and unavailable states, and production deployment smoke. Recheck the revised dark stage at desktop and mobile widths before closing the visual acceptance item.
