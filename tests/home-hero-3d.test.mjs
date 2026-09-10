import assert from "node:assert/strict";
import fs from "node:fs";
import test from "node:test";

const heroSource = fs.readFileSync("src/features/home/hero-object-stage.tsx", "utf8");
const heroConfig = fs.readFileSync("src/features/home/hero-model-config.ts", "utf8");
const homePageSource = fs.readFileSync("src/features/home/home-page.tsx", "utf8");
const globalStyles = fs.readFileSync("src/app/globals.css", "utf8");

test("homepage hero uses a replaceable presentation contract with the current optimized GLB default", () => {
  assert.match(heroConfig, /modelSrc: "\/models\/meowhe-hero\.glb"/);
  assert.match(heroConfig, /tint: null/);
  assert.match(homePageSource, /await getHeroModelPresentation\(\)/);
  assert.match(homePageSource, /presentation=\{heroPresentation\}/);
  assert.match(heroSource, /presentation\.modelSrc/);
  assert.equal(fs.existsSync("public/models/meowhe-hero.glb"), true);
  assert.equal(fs.existsSync("public/meowhe-hero.glb"), false);
});

test("homepage hero shows a dedicated loader instead of the old image fallback", () => {
  assert.match(heroSource, /Loading 3D object/);
  assert.match(heroSource, /loaderRef/);
  assert.match(heroSource, /3D preview unavailable/);
  assert.doesNotMatch(heroSource, /next\/image|hero-product-image|fallbackRef/);
  assert.match(globalStyles, /@media \(prefers-reduced-motion: reduce\)/);
  assert.equal(fs.existsSync("src/features/home/hero-object-stage.module.css"), false);
});

test("homepage hero drives camera, lighting and idle motion from presentation configuration", () => {
  assert.match(heroSource, /presentation\.exposure/);
  assert.match(heroSource, /presentation\.shadowIntensity/);
  assert.match(heroSource, /presentation\.camera\.minRadiusPercent/);
  assert.match(heroSource, /presentation\.autoRotate/);
  assert.match(heroSource, /presentation\.rotationPerSecondDeg/);
  assert.match(heroSource, /camera-controls/);
  assert.match(heroSource, /disable-pan/);
  assert.match(heroSource, /Drag to rotate · Scroll to zoom/);
  assert.match(heroSource, /requestAnimationFrame\(zoomIn\)/);
  assert.doesNotMatch(heroSource, /HERO_MODEL_SRC|DEFAULT_THETA|DEFAULT_PHI|DEFAULT_RADIUS/);
});
