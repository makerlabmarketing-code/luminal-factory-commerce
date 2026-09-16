import assert from "node:assert/strict";
import fs from "node:fs";
import test from "node:test";

const heroSource = fs.readFileSync("src/features/home/hero-object-stage.tsx", "utf8");
const heroConfig = fs.readFileSync("src/features/home/hero-model-config.ts", "utf8");
const homePageSource = fs.readFileSync("src/features/home/home-page.tsx", "utf8");
const globalStyles = fs.readFileSync("src/app/globals.css", "utf8");
const heroModelPath = "public/models/meowhe-hero.glb";

test("homepage hero uses a replaceable presentation contract with the current optimized GLB default", () => {
  assert.match(heroConfig, /modelSrc: "\/models\/meowhe-hero\.glb"/);
  assert.match(heroConfig, /tint: null/);
  assert.match(homePageSource, /await getHeroModelPresentation\(\)/);
  assert.match(homePageSource, /presentation=\{heroPresentation\}/);
  assert.match(heroSource, /presentation\.modelSrc/);
  assert.equal(fs.existsSync(heroModelPath), true);
  assert.equal(fs.existsSync("public/meowhe-hero.glb"), false);
  assert.ok(fs.statSync(heroModelPath).size < 2 * 1024 * 1024, "Hero GLB should remain below 2 MiB");
});

test("homepage hero shows the real product image first and hands off to 3D when ready", () => {
  assert.match(heroSource, /import Image from "next\/image"/);
  assert.match(heroSource, /data-hero-product-image="true"/);
  assert.match(heroSource, /data-hero-mode="poster-first"/);
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

test("Hero Visual Pass 2 keeps a curated angled product pose without exposing an inspection viewer", () => {
  assert.match(heroConfig, /thetaDeg: 24/);
  assert.match(heroConfig, /phiDeg: 73/);
  assert.match(heroConfig, /autoRotate: false/);
  assert.match(heroSource, /data-hero-interaction="pointer-orbit-flow-light"/);
  assert.match(heroSource, /!border-0 !bg-transparent/);
  assert.match(heroSource, /viewer\.style\.pointerEvents = "none"/);
  assert.match(heroSource, /Move to explore/);
  assert.doesNotMatch(heroSource, /data-hero-lens|fluid-glass|backdropFilter/);
  assert.doesNotMatch(heroSource, /Drag to rotate · Scroll to zoom/);
  assert.doesNotMatch(heroSource, /viewer\.setAttribute\("camera-controls"/);
});

test("Hero Visual Pass 2 uses requestAnimationFrame pointer orbit and soft reactive light without React render churn", () => {
  assert.match(heroSource, /\(hover: hover\) and \(pointer: fine\)/);
  assert.match(heroSource, /pointermove/);
  assert.match(heroSource, /requestAnimationFrame\(animateInteraction\)/);
  assert.match(heroSource, /presentation\.camera\.thetaDeg/);
  assert.match(heroSource, /POINTER_THETA_RANGE_DEG/);
  assert.match(heroSource, /reactiveLightRef/);
  assert.match(heroSource, /radial-gradient\(ellipse at \$\{xPercent\}% \$\{yPercent\}%/);
  assert.doesNotMatch(heroSource, /useState|setState/);
});

test("Hero Visual Pass 2 removes the load-time zoom and keeps the optimized enhancement off constrained clients", () => {
  assert.match(heroSource, /connection\?\.saveData === true/);
  assert.match(heroSource, /connection\?\.effectiveType === "slow-2g"/);
  assert.match(heroSource, /connection\?\.effectiveType === "2g"/);
  assert.match(heroSource, /posterOnly = !finePointer \|\| constrainedNetwork/);
  assert.match(heroSource, /radiusRef\.current = presentation\.camera\.radiusPercent/);
  assert.doesNotMatch(heroSource, /const zoomIn|introFrameRef|requestAnimationFrame\(zoomIn\)/);
});

test("Hero 3D defers desktop enhancement until browser idle while preserving reduced-motion and cleanup", () => {
  assert.match(heroSource, /prefers-reduced-motion: reduce/);
  assert.match(heroSource, /requestIdleCallback/);
  assert.match(heroSource, /HERO_IDLE_TIMEOUT_MS/);
  assert.match(heroSource, /HERO_IDLE_FALLBACK_MS/);
  assert.match(heroSource, /cancelIdleCallback/);
  assert.match(heroSource, /clearTimeout\(fallbackTimeout\)/);
  assert.match(heroSource, /cancelAnimationFrame\(interactionFrameRef\.current\)/);
  assert.match(heroSource, /stage\.dataset\.heroMode = "enhanced"/);
});
