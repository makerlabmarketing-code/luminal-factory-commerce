# PRODUCT-COLORWAY-DETAIL-01 — C-040

Status: `DRAFT_FOR_OWNER_REVIEW`, 2026-10-06.
Canonical roadmap: shared coordination Sheet, C-040 (row 58).
This is an experience/contract review package, not approval to publish media,
activate variants, migrate existing Products or enable transactions.

## Collector journey and layout

One Product represents the sculpt; its Colorways retain their parent Product ID.
The page first answers which object and Colorway the collector is viewing, then
shows approved photos and the current release action. English copy is entered
manually in ERP. Existing language switching remains available.

Desktop reference 1440 px: centered content up to 1280 px, 24 px gutter;
gallery approximately 60%, identity/story/release approximately 40%.
Mobile reference 390 px: 20 px gutter; identity, main image, thumbnails,
Colorway selection, concise story, release action, confirmed facts, care and
shipping, related Colorways. No essential control depends on hover.

| Order | Section | Content and behavior |
| --- | --- | --- |
| 1 | Identity | Product/sculpt name, selected Colorway, collection when confirmed; one h1. |
| 2 | Gallery | Approved Product images plus the selected active Colorway's approved images; cover, keyboard thumbnails, reserved aspect ratio. No other Colorway's photos. |
| 3 | Colorways | Explicit named selection; preserve parent identity. Show only eligible public Colorways; selected name remains visible when images are missing. |
| 4 | Story | One concise editorial story; remove repeated description and internal implementation notes from the customer flow. |
| 5 | Release | Verified raffle link when there is an eligible published raffle; historical release links when available. Otherwise a neutral unavailable state, with no invented sale, price, urgency or stock. |
| 6 | Object facts | Approved material, dimensions, stem/compatibility, making process, box contents and release year. Omit unknown facts and empty headings. |
| 7 | Care and shipping | Only approved instructions/policies. No guessed delivery dates or shipping costs. |
| 8 | Related | Other eligible Colorways of the same Product, then return to collection/archive. |

## Media and content review

Request 4–6 original photographs per Colorway: front/45-degree view, top/side,
underside/stem, mounted on a keyboard and packaging if applicable. Long edge
at least 2000 px, no text baked into image, room for square and 4:5 crops.
E-007 optimizes upload copies; private drafts are never storefront inputs.
Cover/order/alt are reviewed in ERP before a separately approved publication.
Do not fabricate absent photography or use the QA fixture as product imagery.

Duy confirms material, dimensions, stem compatibility, making process, box
contents and release year. Unconfirmed facts can remain omitted; they do not
block layout review. Do not assume Cherry MX compatibility or edition quantity.

## Data contract and compatibility

Current `/shop/[slug]` URLs stay stable. Colorway selection initially uses the
existing gallery selection contract; any new deep link must resolve both IDs,
check the parent relationship and expose only published/active public data.
E-005 inactive Colorway drafts must never appear through this public reader.
The currently separate draft Meowhe Product and published Meowhe Lolipop Product
are not automatically consolidated. Parent reassignment, redirect/SEO treatment
and legacy data mapping need a separate reviewed migration if later requested.

Public media remains `product_media`. E-007 `catalog_media_drafts` and its
private bucket are excluded, including removed assets and signed preview URLs.
This package does not add public grants, a media-publish endpoint, prices,
inventory, cart, checkout or customer-facing purchase capability.

## Interaction and fallback

Gallery image changes and Colorway selection are the primary interactions;
secondary motion is a brief image fade and focus feedback. No new 3D/WebGL or
scroll choreography. Reduced motion removes transitions without losing content.
Loading reserves gallery space. Missing photos use the existing honest fallback;
invalid/unpublished Products return not-found. Read failure shows controlled
retry/error state; never silently substitutes another Product or fabricated facts.

## Technical plan and tasks after approval

1. Reuse `ShopProductDetail`, `ShopGallery`, catalog adapter and current tokens;
   keep routes thin Server Components and interactions in the gallery client.
2. Add a typed public Product/Colorway read model without draft-table access.
   Resolve lifecycle and raffle eligibility on the server, not from image count.
3. Compose the approved section order; remove duplicate story and internal
   data-authority/phase notes from catalog customer pages, retaining truthful
   placeholder treatment for internal studies.
4. Add focused tests for parent binding, inactive/unpublished exclusion,
   selected-gallery isolation, missing facts and verified release links.
5. Run the complete repository gate; inspect 1440/390 layout, keyboard focus,
   heading order, image error and reduced-motion behavior. Existing published
   Product URLs must keep working. Record limits rather than infer visual PASS.

## Owner review checkpoint

Approve the section order and the proposed desktop/mobile hierarchy before a
full-page implementation. Supply factual details and approved photos separately;
unknown facts stay hidden. Private-media publication and any legacy Product
consolidation remain independent concrete approval packages.
