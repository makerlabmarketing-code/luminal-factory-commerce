import assert from "node:assert/strict";
import fs from "node:fs";
import test from "node:test";

const heroSource = fs.readFileSync("src/features/home/hero-object-stage.tsx", "utf8");
const heroStyles = fs.readFileSync("src/features/home/hero-object-stage.module.css", "utf8");

test("homepage hero uses the optimized GLB distribution asset", () => {
  assert.match(heroSource, /\/models\/meowhe-hero\.glb/);
  assert.equal(fs.existsSync("public/models/meowhe-hero.glb"), true);
  assert.equal(fs.existsSync("public/meowhe-hero.glb"), false);
});

test("homepage hero preserves an image fallback and reduced-motion strategy", () => {
  assert.match(heroSource, /prefers-reduced-motion: reduce/);
  assert.match(heroSource, /hero-product-image/);
  assert.match(heroStyles, /@media \(prefers-reduced-motion: reduce\)/);
});

test("homepage hero uses a bounded depth interaction instead of the old magnifying lens", () => {
  assert.match(heroSource, /camera-orbit/);
  assert.match(heroSource, /requestAnimationFrame\(zoomIn\)/);
  assert.doesNotMatch(heroSource, /LENS_SIZE|moveLens|backgroundSize: "240% auto"/);
});
