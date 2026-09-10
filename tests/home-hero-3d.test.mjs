import assert from "node:assert/strict";
import fs from "node:fs";
import test from "node:test";

const heroSource = fs.readFileSync("src/features/home/hero-object-stage.tsx", "utf8");
const globalStyles = fs.readFileSync("src/app/globals.css", "utf8");

test("homepage hero uses the optimized GLB distribution asset", () => {
  assert.match(heroSource, /\/models\/meowhe-hero\.glb/);
  assert.equal(fs.existsSync("public/models/meowhe-hero.glb"), true);
  assert.equal(fs.existsSync("public/meowhe-hero.glb"), false);
});

test("homepage hero preserves an image fallback and reduced-motion strategy", () => {
  assert.match(heroSource, /prefers-reduced-motion: reduce/);
  assert.match(heroSource, /hero-product-image/);
  assert.match(globalStyles, /@media \(prefers-reduced-motion: reduce\)/);
  assert.equal(fs.existsSync("src/features/home/hero-object-stage.module.css"), false);
});

test("homepage hero supports direct 360 rotation and bounded zoom", () => {
  assert.match(heroSource, /camera-controls/);
  assert.match(heroSource, /disable-pan/);
  assert.match(heroSource, /min-camera-orbit/);
  assert.match(heroSource, /max-camera-orbit/);
  assert.match(heroSource, /pointerEvents = "auto"/);
  assert.match(heroSource, /Drag to rotate · Scroll to zoom/);
  assert.match(heroSource, /requestAnimationFrame\(zoomIn\)/);
  assert.doesNotMatch(heroSource, /onPointerMove|moveCamera|settleCamera|LENS_SIZE|moveLens|backgroundSize: "240% auto"/);
});
