# Logo/Header UI/UX review gate

Date: 2026-08-06
Scope: approved local Luminal logo integration in the existing global Header and Footer only.
Status: `SOURCE_VALIDATED_BROWSER_REVIEW_REQUIRED` — source and automated checks pass; UI/UX PASS is not claimed without browser review.

## Instructions and skills read

Root `AGENTS.md` is the only repository instruction that scopes the changed files; dependency-local `node_modules/**/AGENTS.md` files do not apply. Read `.agents/skills/luminal-commerce/SKILL.md` and its focused `ui-rules.md`, `storefront-ui.md`, `workflow.md`, `coding-style.md`, and `pr-delivery.md` references; `.codex/skills/ui-ux-pro-max/SKILL.md`; the approved Home specification; the asset technical plan; roadmap; and operator handoff.

UI UX Pro Max was applied as a review layer for optical scale, whitespace, header balance, navigation hierarchy, mobile fit, explicit image dimensions/CLS, visible focus, 44 px touch target, sticky behavior, contrast, and reduced motion. It does not authorize a generated design system, logo animation, Header redesign, or new navigation. Where generic advice could expand scope, root instructions, Luminal Commerce, the approved specification, and this bounded task prevail.

## Validated asset

- Repository/runtime path: `public/brand/luminal-factory-logo-primary.png` / `/brand/luminal-factory-logo-primary.png`.
- PNG MIME/signature; 4000 × 4000 px; sRGB RGBA, 8-bit, four channels with alpha; 6,036,257 bytes.
- SHA-256: `758397de87097ed08d8cff0945dd27f9a4e6b36be2b267b138d5759ce68da5ee`.
- Read/decode and PNG integrity pass. Alpha contains transparent, partially transparent, and opaque pixels.
- Nontransparent bounds: x 703–3296, y 528–3471 (2594 × 2944 px). Transparent whitespace: 703 px left/right and 528 px top/bottom. No artwork touches an outer edge.
- No opaque near-black pixels were found, so no accidental black matte is present. A small number of near-white opaque artwork pixels are internal highlights, not an edge-connected white matte. The alpha was preserved without conversion, cropping, filtering, recoloring, or redesign.

## Integration decisions

- **Header:** existing 4.75rem sticky height is unchanged. The image uses explicit 4000 × 4000 intrinsic dimensions and a fixed 3.75rem layout box; its transparent source margins yield a restrained optical mark inside a 60 px Home-link target. The shared desktop/mobile Header keeps its navigation order and existing sticky surface. `aria-label="Luminal Factory"` names the link while empty image alt prevents duplicate speech. Existing 2 px focus outline remains visible. No filter, glow, or logo animation was added.
- **Footer:** the text placeholder is replaced with the same asset in a smaller-hierarchy 4.5rem box. The existing grid, copy, navigation, and footer hierarchy remain intact.
- **Favicon:** retained. The detailed full mark was not substituted at 16, 32, or 48 px; a separately approved simplified mark is recommended.
- **Open Graph:** unchanged. No OG artwork was created or inferred.
- **Reduced motion:** no logo motion exists, so reduced-motion behavior is unaffected.
- **Product media:** Home, Archive, and Shop media remain unchanged. Legacy recovery remains a separate partial/blocked scope.

## Visual review gate

No browser executable or browser automation is available in this environment. Visual review is therefore **blocked**, and this document does **not** declare UI/UX PASS. Review Home, `/archive`, and `/shop` at 1440 px and 390 px; top/scrolled Header; mobile menu; keyboard focus; logo clarity on the dark surface; layout stability; and Footer balance before merge. Capture screenshots during that review.

## Remaining recommendations

- Approve a simplified small-size mark before changing the favicon.
- Consider a dedicated horizontal wordmark only in a separate approved brand slice if browser review finds the primary mark too quiet.
- Create dedicated OG artwork only in a separately scoped metadata task.
