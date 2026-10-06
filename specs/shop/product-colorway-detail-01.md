# C-040 Product / Colorway detail

Owner approval: 2026-10-06, explicit chat approval of PRODUCT-COLORWAY-DETAIL-01.

## Scope and acceptance

Keep published /shop/[slug] and EN/VI links stable. Desktop: 1280px content,
24px gutters, gallery/content 60/40. Mobile 390: 20px gutters; identity,
photo/thumbnails, Colorway choice, story, release, confirmed facts, related.
One h1 and one story. Unknown facts and policies are omitted rather than guessed.
No prices, inventory, purchase capability or existing catalog data are changed.

## Technical plan

Route remains a Server Component. ShopProductDetail composes server-rendered
identity/story/release/facts as React slots into ShopGallery's narrow selection
boundary. Published Products are filtered in the adapter. Independent nested
active Product variants form the public Colorway model, including no-photo variants.
Parent identity is checked in the adapter and gallery selection. Images come only
from public product_media, with active matching variants; private drafts are excluded.
Selecting a Colorway shows that Colorway's images plus common Product images.
Missing images cannot reuse a different Colorway's cover. Native select, keyboard
thumbnail buttons, focus feedback and reduced motion preserve operability.

Product release service uses the public API key and existing detail-enable flag;
it verifies published, non-test, parent-bound releases and lifecycle/time windows.
Links describe current/upcoming/past releases; they do not submit entries.
Unknown shipping/care/factual fields have no approved source in the current catalog
and therefore have no visible section. No database migration or flags are required.
Configured catalog read failure throws to a retry boundary, separate from not-found.

## Verification tasks

- Executable selection tests: parent binding, isolated images and empty images.
- Executable catalog tests: active/no-photo variants, wrong-parent exclusion,
  absent facts, read failure.
- Release validation: publication, test exclusion, parent, slug, timing/state.
- Full repository gate, desktop/mobile visual check and EN/VI route smoke.

## Separate future inputs

Owner photographs and factual details remain needed for richer content. Publishing
E-007 private drafts, translations, variants or consolidating legacy Products is a
separate reviewed data change. This page never accesses those draft tables.
