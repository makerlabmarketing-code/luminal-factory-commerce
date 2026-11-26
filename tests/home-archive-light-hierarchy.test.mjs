import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

const read = (path) => readFileSync(path, "utf8");
const home = read("src/features/home/home-page.tsx");
const globals = read("src/app/globals.css");
const archiveCss = read("src/app/[locale]/archive/archive-stage.module.css");
const archive = read("src/app/[locale]/archive/page.tsx");

test("Making section keeps the light visible beneath a soft scrim rather than an opaque sticky block", () => {
  assert.match(home, /data-made-at-luminal-header="true"/);
  assert.match(home, /editorial-heading md:sticky md:top-20 md:z-30 md:bg-transparent md:pb-8/);
  assert.doesNotMatch(home, /md:bg-\[#0a0a0a\]/);
  assert.match(globals, /\.made-at-luminal \[data-made-at-luminal-header\]::before/);
  assert.match(globals, /mask-image: linear-gradient\(180deg, transparent, #000 18%, #000 78%, transparent\)/);
  assert.match(globals, /pointer-events: none/);
});

test("Archive relies on the tent entrance light and avoids an independent misaligned directional cone", () => {
  assert.match(archiveCss, /meowhe-circus-closed\.webp/);
  assert.match(archiveCss, /\.stageLight \{[^}]+radial-gradient\(/);
  assert.doesNotMatch(archiveCss, /conic-gradient/);
  assert.match(archiveCss, /\.stageLight \{ display: none; \}/);
});

test("Archive makes real colorway photographs legible and keyboard navigation stays intact", () => {
  assert.match(archiveCss, /flex: 0 0 clamp\(6\.25rem, 8vw, 8\.5rem\)/);
  assert.match(archiveCss, /scroll-snap-type: x mandatory/);
  assert.match(archiveCss, /@media \(max-width: 700px\)/);
  assert.match(archiveCss, /prefers-reduced-motion: reduce/);
  assert.match(archive, /href=\{entry\.href\}/);
  assert.match(archive, /<Image src=\{entry\.media\.src\}/);
  assert.match(archive, /136px/);
  assert.match(archive, /styles\.colorwayLabel/);
});

test("Two reversible resin strokes frame the photo handoff in opposite directions", async () => {
  const { getHeroPhotoMotion, getHomePhotoHandoffProgress } = await import("../src/features/home/home-photo-handoff.ts");
  const flow = read("src/features/home/home-resin-flow.tsx");
  const immersive = read("src/features/home/home-immersive-experience.tsx");
  const style = read("src/features/home/home-resin-flow.module.css");
  assert.match(home, /<HomeResinFlow direction="entry" \/>[\s\S]*<HomeMotionGallery[\s\S]*<HomeResinFlow direction="exit" \/>/);
  assert.doesNotMatch(home, /HomeFlexGallery/);
  assert.match(flow, /entry: \{\s*start: \[0\.025, 0\.025\]/);
  assert.match(flow, /exit: \{\s*start: \[1\.04,[\s\S]*-0\.04/);
  assert.match(flow, /setLineDash/);
  assert.match(flow, /aria-hidden="true"/);
  assert.match(immersive, /getHeroPhotoMotion\(sectionTop/);
  assert.match(style, /margin-block-end: calc\(-1 \* var\(--ribbon-photo-overlap\)\)/);
  assert.match(style, /\.photoChapter\[data-gallery-motion="ready"\]/);
  const down = [960, 540, 320, 160].map((top) => getHomePhotoHandoffProgress(top, 800));
  assert.equal(down[0], 0);
  assert.equal(down.at(-1), 1);
  assert.ok(down[1] < down[2]);
  const up = [160, 320, 540, 960].map((top) => getHomePhotoHandoffProgress(top, 800));
  assert.deepEqual(up, down.toReversed());
  const viewport = 800;
  const at = (progress) => getHeroPhotoMotion(viewport * (0.88 - 0.82 * progress), viewport);
  const facing = at(0.64);
  assert.equal(facing.faceFront, 1);
  assert.equal(facing.opacity, 1);
  assert.ok(facing.travel < 1);
  const fading = at(0.88);
  assert.equal(fading.faceFront, 1);
  assert.equal(fading.travel, 1);
  assert.ok(fading.opacity > 0 && fading.opacity < 1);
  assert.equal(getHeroPhotoMotion(0, viewport).opacity, 0);
});


test("The gallery rises from the lower left, conceals the hero, and settles a row at a time", async () => {
  const { galleryCoverProgress, getGalleryCardPose, getGalleryHeroPose, getGalleryProgress } = await import("../src/features/home/home-gallery-motion.ts");
  for (const [width, height] of [[390, 844], [1440, 900]]) {
    const at = (p, index) => getGalleryCardPose(p, index, width, height, width < 700);
    const start = at(0.29, 0);
    assert.ok(start.x < 0 && start.y > 0 && start.opacity > 0);
    assert.equal(at(0.29, 5).opacity, 0);
    assert.equal(getGalleryHeroPose(0, 0).yaw, 0);
    assert.equal(getGalleryHeroPose(0.35, 0).yaw, -360);
    assert.equal(getGalleryHeroPose(galleryCoverProgress - 0.001, -22).visible, true);
    assert.equal(getGalleryHeroPose(galleryCoverProgress, -22).visible, false);
    const cover = at(galleryCoverProgress, 1);
    assert.equal(cover.opacity, 1);
    assert.ok(cover.layer > 30);
    assert.ok(Math.abs(cover.x) < 5 && Math.abs(cover.y) < 5);
    assert.ok(at(0.8, 1).y < cover.y);
    assert.ok(at(0.86, 0).settle > at(0.86, 5).settle);
    assert.equal(at(0.97, 5).settle, 1);
    const positions = [height, height / 2, 0, -height];
    const down = positions.map(top => getGalleryProgress(top, height));
    const up = positions.toReversed().map(top => getGalleryProgress(top, height));
    assert.deepEqual(up, down.toReversed());
  }
});
