import assert from "node:assert/strict";
import fs from "node:fs";
import test from "node:test";

const heroSource = fs.readFileSync("src/features/home/hero-object-stage.tsx", "utf8");
const heroConfig = fs.readFileSync("src/features/home/hero-model-config.ts", "utf8");
const heroData = fs.readFileSync("src/features/home/hero-model-data.ts", "utf8");
const homePageSource = fs.readFileSync("src/features/home/home-page.tsx", "utf8");
const globalStyles = fs.readFileSync("src/app/globals.css", "utf8");
const heroModelPath = "public/models/meowhe-hero.glb";

test("homepage hero uses a replaceable presentation contract with the current optimized GLB default", () => {
  assert.match(heroConfig, /modelSrc: "\/models\/meowhe-hero\.glb"/);
  assert.match(heroConfig, /tint: null/);
  assert.match(homePageSource, /Promise\.all\(\[[\s\S]*getHeroModelPresentation\(\),[\s\S]*getHomeFeaturedRaffle\(\)/);
  assert.match(homePageSource, /presentation=\{heroPresentation\}/);
  assert.match(heroSource, /presentation\.modelSrc/);
  assert.equal(fs.existsSync(heroModelPath), true);
  assert.equal(fs.existsSync("public/meowhe-hero.glb"), false);
  assert.ok(fs.statSync(heroModelPath).size < 2 * 1024 * 1024, "Hero GLB should remain below 2 MiB");
});

test("remote Hero configuration inherits the local orientation without requiring a Production DB migration", () => {
  assert.match(heroData, /orientation: defaultHeroModelPresentation\.orientation/);
  assert.doesNotMatch(heroData, /orientation_roll_deg|orientation_pitch_deg|orientation_yaw_deg/);
});

test("desktop Hero keeps the product poster out of the 3D loading and error path", () => {
  assert.match(heroSource, /import Image from "next\/image"/);
  assert.match(heroSource, /data-hero-product-image="true"/);
  assert.match(heroSource, /data-hero-poster-role="constrained-fallback"/);
  assert.match(heroSource, /data-hero-mode="capability-gated"/);
  assert.match(heroSource, /className="absolute inset-0 z-\[1\] overflow-hidden opacity-100 md:hidden"/);
  assert.match(heroSource, /preview\.style\.display = "none"/);
  assert.match(heroSource, /preview\.style\.visibility = "hidden"/);
  assert.match(heroSource, /stage\.dataset\.heroMode = "3d-error"/);
  assert.match(heroSource, /3D preview unavailable/);
  assert.doesNotMatch(heroSource, /Product image active/);
  assert.match(heroSource, /Loading 3D object/);
  assert.match(globalStyles, /@media \(prefers-reduced-motion: reduce\)/);
});

test("Hero supports constrained drag, preserves scroll orbit, and recenters on release", () => {
  assert.match(heroConfig, /rollDeg: 0/);
  assert.match(heroConfig, /pitchDeg: -52/);
  assert.match(heroConfig, /yawDeg: 0/);
  assert.match(heroConfig, /thetaDeg: 12/);
  assert.match(heroConfig, /phiDeg: 82/);
  assert.match(heroConfig, /radiusPercent: 103/);
  assert.match(heroConfig, /autoRotate: false/);
  assert.match(heroSource, /viewer\.setAttribute\(\s*"orientation"/);
  assert.match(heroSource, /const applyPointerOrbit/);
  assert.match(heroSource, /const sectionTheta = presentation\.camera\.thetaDeg \+ scrollOrbitOffsetDeg/);
  assert.match(heroSource, /sectionTheta \+ dragOffset\.yawDeg/);
  assert.match(heroSource, /sectionTheta - HERO_DRAG_YAW_MAX_DEG/);
  assert.match(heroSource, /clamp\(presentation\.camera\.phiDeg \+ dragOffset\.phiDeg, HERO_DRAG_PHI_MIN_DEG, HERO_DRAG_PHI_MAX_DEG\)/);
  assert.match(heroSource, /luminal:hero-orbit-offset/);
  assert.match(heroSource, /data-hero-interaction=\{mobileOnly \? "touch-static" : "drag-and-recenter"\}/);
  assert.doesNotMatch(heroSource, /HERO_TEXT_FACING_YAW_DEG|landingYaw/);
  assert.match(heroSource, /HERO_DRAG_RETURN_RATE = 5\.5/);
  assert.doesNotMatch(heroSource, /pointerTarget|normalizedX|normalizedY/);
  assert.match(heroSource, /HERO_POINTER_SETTLE_EPSILON_DEG = 0\.01/);
  assert.match(heroSource, /window\.addEventListener\("pointermove", handlePointerMove/);
  assert.match(heroSource, /window\.addEventListener\("pointerup", handlePointerUp\)/);
  assert.match(heroSource, /viewer\.style\.pointerEvents = "none"/);
  assert.match(heroSource, /window\.addEventListener\("pointerdown", handlePointerDown\)/);
  assert.match(heroSource, /HERO_DRAG_YAW_MAX_DEG = 36/);
  assert.match(heroSource, /HERO_DRAG_PHI_MIN_DEG = 48/);
  assert.match(heroSource, /HERO_DRAG_PHI_MAX_DEG = 85/);
  assert.match(heroSource, /draggingPointerId === null/);
  assert.doesNotMatch(heroSource, /setPointerCapture|releasePointerCapture/);
  assert.match(heroSource, /if \(presentation\.autoRotate && !reducedMotion\)/);
  assert.doesNotMatch(heroSource, /viewer\.setAttribute\("camera-controls"/);
});

test("constrained clients keep the image fallback while eligible desktop defers 3D until browser idle", () => {
  assert.match(heroSource, /connection\?\.saveData === true/);
  assert.match(heroSource, /connection\?\.effectiveType === "slow-2g"/);
  assert.match(heroSource, /connection\?\.effectiveType === "2g"/);
  assert.match(heroSource, /posterOnly = constrainedNetwork \|\| \(!finePointer && !allowTouch3d\)/);
  assert.match(heroSource, /poster-coarse-pointer/);
  assert.match(heroSource, /poster-constrained-network/);
  assert.match(heroSource, /preview\.style\.display = "block"/);
  assert.match(heroSource, /requestIdleCallback/);
  assert.match(heroSource, /HERO_IDLE_TIMEOUT_MS/);
  assert.match(heroSource, /HERO_IDLE_FALLBACK_MS/);
  assert.match(heroSource, /cancelIdleCallback/);
  assert.match(heroSource, /clearTimeout\(fallbackTimeout\)/);
});

test("reduced motion keeps an eligible model static and disables pointer-follow", () => {
  assert.match(heroSource, /prefers-reduced-motion: reduce/);
  assert.match(heroSource, /reducedMotion[\s\S]*"enhanced-static"/);
  assert.match(heroSource, /if \(!reducedMotion && finePointer\)/);
  assert.match(heroSource, /window\.addEventListener\("pointermove", handlePointerMove/);
  assert.match(heroSource, /allowTouch3d/);
});

test("Hero respects disabled auto-rotation and continues pointer tracking in Meet Meowhe", () => {
  assert.match(heroSource, /else viewer\.removeAttribute\("auto-rotate"\)/);
  assert.match(heroSource, /data-home-3d-section="featured"/);
  assert.match(heroSource, /data-home-3d-section="hero"/);
  assert.match(heroSource, /window\.removeEventListener\("pointermove", handlePointerMove\)/);
  assert.match(heroSource, /window\.removeEventListener\("pointerup", handlePointerUp\)/);
});
