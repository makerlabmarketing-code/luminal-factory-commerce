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

test("The gallery pauses resin strokes while retaining the hero fallback", async () => {
  const { getHeroPhotoMotion, getHomePhotoHandoffProgress } = await import("../src/features/home/home-photo-handoff.ts");
  const flow = read("src/features/home/home-resin-flow.tsx");
  const immersive = read("src/features/home/home-immersive-experience.tsx");
  const style = read("src/features/home/home-resin-flow.module.css");
  assert.match(home, /<HomeMotionGallery/);
  assert.doesNotMatch(home, /<HomeResinFlow/);
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


test("The curved photos separate front and rear depth before the inset gallery settles", async () => {
  assert.match(home, /media\.gallery\.slice\(0, 6\)/);
  assert.match(read("src/features/home/home-resin-flow.module.css"), /\.galleryContainer \{\s*width: max\(60%,[^;]+;\s*max-inline-size: 72rem;/);
  const { galleryCoverProgress, galleryArrivalProgress, gallerySettleProgress, getGalleryArrival, getGalleryHeroPose, getGalleryProgress, getGalleryStripPanel } = await import("../src/features/home/home-gallery-motion.ts");
  for (const [width, height, slices] of [[390, 844, 4], [1440, 900, 7], [1920, 1030, 7]]) {
    const at = (progress, index = 0) => getGalleryStripPanel(progress, index, width, height, slices);
    const far = at(0.215);
    const cover = at(galleryCoverProgress);
    const bounds = panels => panels.flatMap(segment => segment.corners);
    const span = (panels, axis) => {
      const coordinates = bounds(panels).map(point => point[axis]);
      return Math.max(...coordinates) - Math.min(...coordinates);
    };
    assert.equal(far.length, slices);
    assert.equal(cover.length, slices);
    const center = Math.floor(slices / 2);
    const [before, after] = cover.slice(center - 1, center + 1);
    assert.deepEqual(before.corners[0], after.corners[1]);
    assert.deepEqual(before.corners[3], after.corners[2]);
    assert.ok(far.every(segment => segment.layer < 30));
    assert.ok(cover.every(segment => segment.layer > 30));
    assert.ok(bounds(cover).some(([x, y]) => x < width / 2 && y < height / 2));
    assert.ok(bounds(cover).some(([x, y]) => x > width / 2 && y > height / 2));
    assert.ok(span(cover, 0) > span(far, 0) * 2.5);
    const midpoint = panel => (panel[center].corners[1][1] + panel[center].corners[2][1]) / 2;
    assert.ok(midpoint(far) - midpoint(cover) > height * 0.20);
    const centerEdgeRatio = panels => {
      const { corners: [topLeft, topRight, bottomRight] } = panels[center];
      return (topRight[0] - topLeft[0]) * slices / (bottomRight[1] - topRight[1]);
    };
    assert.ok(Math.abs(centerEdgeRatio(far) - centerEdgeRatio(cover)) < 0.18);
    assert.equal(getGalleryHeroPose(0.3, -22).yaw, 0);
    assert.equal(getGalleryHeroPose(galleryCoverProgress - 0.001, -22).visible, true);
    assert.equal(getGalleryHeroPose(galleryCoverProgress, -22).visible, false);
    const entrance = bounds(at(0.165, 0));
    assert.ok(entrance.every(([x]) => x < width * 0.4));
    const exit = bounds(at(0.699, 5));
    assert.ok(exit.every(([x]) => x > width * 0.62));
    assert.ok(exit.some(([, y]) => y <= height * 0.08));
    assert.ok(bounds(at(0.725, 5)).every(([, y]) => y < 0));
    assert.ok(getGalleryArrival(0.699, 0) > 0.30);
    assert.ok(exit.some(([, y]) => y > 0), "the last spiral card remains visible when the first gallery card enters");
    assert.equal(getGalleryArrival(galleryArrivalProgress, 0), 0);
    assert.ok(getGalleryArrival(galleryArrivalProgress + 0.04, 0) > getGalleryArrival(galleryArrivalProgress + 0.04, 1));
    assert.ok(getGalleryArrival(galleryArrivalProgress + 0.04, 1) > 0);
    assert.equal(getGalleryArrival(galleryArrivalProgress + 0.04, 2), 0);
    assert.equal(getGalleryArrival(gallerySettleProgress, 5), 1);
    assert.ok(getGalleryProgress(-0.88 * height, height) < 0.85);
  }
});

test("Gallery tiles enter in reading order from their own viewport edges", async () => {
  const { galleryArrivalProgress, gallerySettleProgress, getGalleryArrival, getGalleryArrivalOffset } = await import("../src/features/home/home-gallery-motion.ts");
  const appearances = Array(6).fill(-1);
  for (let step = 0; step <= 1000; step++) {
    const progress = galleryArrivalProgress + step / 1000 * (gallerySettleProgress - galleryArrivalProgress);
    for (let index = 0; index < appearances.length; index++) {
      if (appearances[index] === -1 && getGalleryArrival(progress, index) > 0) appearances[index] = progress;
    }
  }
  assert.ok(appearances.every((start, index) => start > (appearances[index - 1] ?? 0)));
  assert.ok(appearances[5] < gallerySettleProgress);
  for (const [width, height, columns] of [[390, 844, 2], [1440, 900, 3]]) {
    const rows = Math.ceil(6 / columns);
    const viewport = { width, height };
    const origins = [];
    for (let index = 0; index < 6; index++) {
      const slot = { x: 40 + index % columns * 160, y: 200 + Math.floor(index / columns) * 120, width: 150, height: 100 };
      const offset = getGalleryArrivalOffset(0, index, columns, rows, viewport, slot, -80);
      const x = slot.x + offset.x;
      const y = slot.y + offset.y;
      const horizontal = x + slot.width <= 0 ? "left" : x >= width ? "right" : "center";
      const vertical = y + slot.height <= 0 ? "top" : y >= height ? "bottom" : "middle";
      origins.push(`${vertical} ${horizontal}`);
      const halfway = getGalleryArrivalOffset(0.5, index, columns, rows, viewport, slot, -80);
      assert.equal(halfway.x, offset.x / 2);
      assert.equal(halfway.y, (offset.y - 80) / 2);
      assert.deepEqual(getGalleryArrivalOffset(1, index, columns, rows, viewport, slot, 0), {
        x: 0, y: 0, tilt: 0,
      });
    }
    assert.deepEqual(origins, columns === 3
      ? ["top left", "top center", "top right", "bottom left", "bottom center", "bottom right"]
      : ["top left", "top right", "middle left", "middle right", "bottom left", "bottom right"]);
  }
});

test("The extended spiral overlaps the staggered gallery arrival", async () => {
  const { galleryArrivalProgress, galleryCoverProgress, gallerySettleProgress, getGalleryProgress, getGallerySettleOffset, getGalleryCaptionOpacity, getGalleryArrivalPadding, galleryStripEndProgress } = await import("../src/features/home/home-gallery-motion.ts");
  const viewport = 900;
  const entry = 0.88 * viewport;
  const topAtCover = entry - 2.25 * galleryCoverProgress * viewport;
  assert.ok(Math.abs(getGalleryProgress(topAtCover, viewport) - galleryCoverProgress) < 0.00001);
  const topAtStripEnd = entry - (2.25 * galleryStripEndProgress + 0.42) * viewport;
  assert.ok(Math.abs(getGalleryProgress(topAtStripEnd, viewport) - galleryStripEndProgress) < 0.00001);
  const newTop = entry - (2.25 * gallerySettleProgress + 0.42 + 0.45) * viewport;
  assert.ok(Math.abs(getGalleryProgress(newTop, viewport) - gallerySettleProgress) < 0.00001);
  for (const top of [(newTop + topAtStripEnd) / 2, topAtStripEnd + 130]) {
    assert.ok(Math.abs(getGallerySettleOffset(getGalleryProgress(top, viewport), viewport) - (newTop - top)) < 0.00001);
  }
  assert.equal(getGalleryCaptionOpacity(0), 0);
  assert.ok(getGalleryCaptionOpacity(galleryArrivalProgress) < 1);
  assert.equal(getGalleryCaptionOpacity(0.705), 0);
  assert.equal(getGalleryCaptionOpacity(gallerySettleProgress), 0);
  assert.ok(Math.abs(newTop + getGalleryArrivalPadding(viewport, 660) + 330 - viewport / 2) < 0.00001);
  assert.ok(newTop + getGalleryArrivalPadding(viewport, 1100) >= 87);
});
