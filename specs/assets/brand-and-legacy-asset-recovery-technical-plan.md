# Brand and Legacy Asset Recovery Technical Plan

Status: `SOURCE_VALIDATED_BROWSER_REVIEW_REQUIRED`
Date: 2026-08-06
Scope: owner-approved Luminal logo integration and a review-gated LazyFactory historical-media inventory.

> Status: `SOURCE_VALIDATED_BROWSER_REVIEW_REQUIRED`. The exact approved PNG exists in the repository, passes binary/alpha/bounds validation, and is integrated into Header and Footer. Favicon and Open Graph remain unchanged; browser review is still required. Legacy recovery remains a separate partial/blocked scope.

## Source assessment

- The owner-approved current-brand source is Google Drive file `1TUYpcL9S0EbmvsnXQYgpG1rV_MuOUkIk`. It may be downloaded during this development task, but no Drive URL or temporary credential may enter runtime source.
- The legacy source is the public site at `adelina-builder-wzacpt1wtxwbfh5y.hostingersite.com` and only asset hosts it explicitly references. LazyFactory is a historical brand, not the current global identity.
- The current Header and Footer use the approved local logo. Root metadata has no explicit Open Graph image and retains `src/app/favicon.ico`. Home, Archive, and Shop use typed internal placeholders; those media assignments remain unchanged.
- `public/brand/` contains the validated approved logo binary, `next.config.ts` has no remote-image allowlist, and the repository has no Git LFS or explicit large-binary workflow. Recovered, unapproved binaries therefore remain outside `public/` and are committed only when size and ownership risk are acceptable.

## Download and controlled-crawl strategy

Download the exact approved Drive file once into a temporary staging location, validate its response MIME and binary signature, inspect dimensions, color mode, alpha, crop bounds, whitespace, and bytes, then preserve only the minimum source/derived files justified by use. The production app references a local optimized export only.

For the legacy site, request `robots.txt`, `sitemap.xml`, the home page, and same-site pages actually linked by navigation/content. Extract media references from HTML attributes, embedded metadata/JSON, CSS URLs, `srcset`, posters, and video sources. Follow only same-site pages and explicitly referenced asset hosts, with finite page/asset counts, timeouts, limited retries, and low concurrency. Do not brute-force, mirror HTML, bypass access controls, or download third-party platform video.

## Inventory and deduplication

`docs/assets/legacy-asset-inventory.json` is the deterministic machine-readable authority. Every record carries stable identity, source page/URL, HTTP/download evidence, type/MIME/extension, available dimensions/duration/bytes, brand and role classifications, recovery quality, approval state, local-path state, SHA-256, duplicate relationship, preferred-variant state, destination candidate, neutral alt draft, and notes. Inaccessible records retain source and failure evidence without invented file metadata.

Canonicalized URLs detect query variants; SHA-256 detects binary duplicates. Dimension and source-path evidence groups transformed variants without claiming pixel-identical content. Variants are retained as records until review; one may be marked preferred based on accessible resolution and transformation evidence. A thumbnail is never promoted to an original and is never upscaled.

## Naming and directories

- Approved runtime brand: `public/brand/luminal-factory-logo-primary.png` (runtime `/brand/luminal-factory-logo-primary.png`), validated and tracked in this branch.
- Optional owner-source reference: `assets/source/luminal/brand/`, only if materially distinct and repository-safe.
- Unapproved legacy staging: ignored `assets/source/lazyfactory/recovered/` during recovery.
- Durable evidence: `docs/assets/legacy-asset-inventory.json`, `docs/assets/legacy-asset-inventory.md`, `docs/assets/legacy-recovery-report.md`, and `docs/assets/production-asset-shortlist.md`.
- Names are lowercase kebab-case, evidence-led, MIME-correct, and stable-hash based when the subject is unknown. Product or collection names are used only when page context supports them.

## Image optimization policy

Do not upscale, redraw, recolor, filter, or reshape the approved logo. Preserve alpha and aspect ratio. Use installed, trustworthy tooling to strip unnecessary metadata and create a browser-sized PNG or lossless/near-lossless WebP only after visual/edge inspection. Record source and output dimensions, bytes, modes, alpha, crop bounds, and hashes. The approved multi-megabyte PNG is retained as supplied; a later optimization may only occur with visual equivalence review.

Recovered historical images are not automatically optimized for production in this slice. Inventory prefers the largest safely evidenced accessible variant; no watermark is removed or hidden.

## Video recovery policy

Only directly referenced media files may be downloaded for inspection. Record container, codec, duration, dimensions, poster, bytes, and hash when `ffprobe` is available. Do not transcode, autoplay, publish, or commit a large recovered video. YouTube/Vimeo/other embeds remain URL-only inventory records.

## Classification and production approval

Current approved logo records are `luminal-current` / `owner-approved-drive` / `owner-approved`. Legacy media is `lazyfactory-historical` and defaults to `production-review-required` or `historical-only`; `productionApproved` is always false in this slice. Unknown provenance remains `unknown`. Recovery quality and destination candidacy are separate from approval.

The shortlist recommends at most 3 Home, 6 Archive, 3 Shop, 3 Process/Craft, and 2 Open Graph candidates. It does not publish them. Owner review must confirm subject, historical wording, ownership/license, crop, watermark/branding risk, destination, and alt text before a later replacement slice copies any candidate into a production media path.

## Logo integration scope

Replace only the Header current-brand placeholder and the Footer mark, when the supplied composition remains legible at those sizes, with `next/image` using explicit intrinsic dimensions and the accessible name `Luminal Factory`; both brand presentations link to Home where appropriate. Preserve navigation order and mobile behavior. Configure metadata icons or default Open Graph media only if a distinct asset is compositionally suitable; otherwise retain the current favicon and omit a misleading OG composition.

## Performance and accessibility

Use one optimized local logo asset, explicit dimensions, responsive CSS bounds, and no remote runtime request, animation, glow, 3D, or CSS color filter. Avoid layout shift. Keep the Home link's accessible label, decorative empty logo alt to prevent duplicate speech, visible focus, and dark-background contrast. Historical alt drafts remain neutral and review-gated when identity is uncertain.

## Copyright and ownership assumptions

Owner approval establishes the supplied file as the current Luminal logo for storefront use. Public accessibility of legacy assets does not establish production reuse rights. Recovery is preservation and review evidence only; watermarks and embedded historical branding remain intact. Owner must confirm ownership/license and historical context before publication.

## Rollback

Revert the local logo binary, Header/Footer references and minimal CSS, tests, inventory/report/shortlist, roadmap/handoff entries, and this plan. Retain the prior favicon if no safe symbol asset is available. No database, remote source, production content, or commerce rollback is required.

## Tests and validation

- Assert the Header local logo links Home, exposes the accessible Luminal name, preserves navigation order, and does not restore account/cart.
- Assert production source contains no Drive, Hostinger, legacy-CDN, or LazyFactory global-brand hotlink and that referenced local assets exist.
- Parse and validate inventory classification/approval fields; require historical product media to remain unapproved.
- Validate MIME/extension, dimensions, hashes, duplicates, JSON determinism, broken references, asset sizes, and source allowlisting.
- Run `git diff --check`, lint, typecheck, tests, build, and aggregate `npm run check`; inspect desktop/mobile rendering if a browser is available.

## Explicit non-goals

No Home/Archive/Shop product-placeholder replacement, page redesign, hero recomposition, navigation reordering, production legacy-media publication, full site clone, broad CDN enumeration, image upscaling, watermark removal, video transcoding, autoplay, new production fetch, Supabase, authentication, cart, payment, order, raffle entry, ERP workflow, migration, secret, or live-data mutation.
