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

test("homepage hero shows the real product image first and hands off to 3D when ready", () => {
  assert.match(heroSource, /import Image from "next\/image"/);
  assert.match(heroSource, /data-hero-product-image="true"/);
  assert.match(heroSource, /src=\{media\.src\}/);
  assert.match(heroSource, /preload/);
  assert.match(heroSource, /sizes=\{media\.sizes\}/);
  assert.match(heroSource, /previewRef/);
  assert.match(heroSource, /preview\.style\.opacity = "0"/);
  assert.match(heroSource, /3D preview unavailable · Product image active/);
  assert.match(heroSource, /Loading 3D object/);
  assert.match(globalStyles, /@media \(prefers-reduced-motion: reduce\)/);
  assert.equal(fs.existsSync("src/features/home/hero-object-stage.module.css"), false);
});

test("M-004 integrates the Hero model into the background instead of exposing an inspection viewer", () => {
  assert.match(heroSource, /data-hero-interaction="pointer-orbit-fluid-lens"/);
  assert.match(heroSource, /!border-0 !bg-transparent/);
  assert.match(heroSource, /viewer\.style\.pointerEvents = "none"/);
  assert.match(heroSource, /Move to explore/);
  assert.doesNotMatch(heroSource, /Drag to rotate · Scroll to zoom/);
  assert.doesNotMatch(heroSource, /viewer\.setAttribute\("camera-controls"/);
});

test("M-004 uses requestAnimationFrame pointer orbit, reactive light and one optical lens without React render churn", () => {
  assert.match(heroSource, /\(hover: hover\) and \(pointer: fine\)/);
  assert.match(heroSource, /pointermove/);
  assert.match(heroSource, /requestAnimationFrame\(animateInteraction\)/);
  assert.match(heroSource, /presentation\.camera\.thetaDeg/);
  assert.match(heroSource, /POINTER_THETA_RANGE_DEG/);
  assert.match(heroSource, /reactiveLightRef/);
  assert.match(heroSource, /data-hero-lens="fluid-glass"/);
  assert.match(heroSource, /backdropFilter: "blur\(2px\) brightness\(1\.16\)/);
  assert.doesNotMatch(heroSource, /useState|setState/);
});

test("M-004 preserves reduced-motion, simplified coarse-pointer idle motion and offscreen suspension", () => {
  assert.match(heroSource, /prefers-reduced-motion: reduce/);
  assert.match(heroSource, /useSimplifiedIdleMotion = !reducedMotion && !finePointer && presentation\.autoRotate/);
  assert.match(heroSource, /presentation\.rotationPerSecondDeg/);
  assert.match(heroSource, /IntersectionObserver/);
  assert.match(heroSource, /viewer\.removeAttribute\("auto-rotate"\)/);
  assert.match(heroSource, /cancelAnimationFrame\(interactionFrameRef\.current\)/);
});
