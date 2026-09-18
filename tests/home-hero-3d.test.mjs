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
  assert.match(homePageSource, /await getHeroModelPresentation\(\)/);
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

test("Hero stays front-facing until drag and recenters after release", () => {
  assert.match(heroConfig, /rollDeg: 0/);
  assert.match(heroConfig, /pitchDeg: -52/);
  assert.match(heroConfig, /yawDeg: 0/);
  assert.match(heroConfig, /thetaDeg: 12/);
  assert.match(heroConfig, /phiDeg: 82/);
  assert.match(heroConfig, /radiusPercent: 103/);
  assert.match(heroConfig, /autoRotate: false/);
  assert.match(heroConfig, /autoRotateDelayMs: 700/);
  assert.match(heroConfig, /rotationPerSecondDeg: 3/);
  assert.match(heroSource, /viewer\.setAttribute\(\s*"orientation"/);
  assert.match(heroSource, /presentation\.orientation\.rollDeg/);
  assert.match(heroSource, /presentation\.orientation\.pitchDeg/);
  assert.match(heroSource, /presentation\.orientation\.yawDeg/);
  assert.match(heroSource, /const applyPointerOrbit/);
  assert.match(heroSource, /presentation\.camera\.thetaDeg - pointerCurrent\.yawDeg/);
  assert.match(heroSource, /presentation\.camera\.phiDeg - pointerCurrent\.pitchDeg/);
  assert.doesNotMatch(heroSource, /presentation\.camera\.thetaDeg \+ pointerCurrent\.yawDeg/);
  assert.doesNotMatch(heroSource, /presentation\.camera\.phiDeg \+ pointerCurrent\.pitchDeg/);
  assert.doesNotMatch(heroSource, /presentation\.orientation\.pitchDeg \+ pointerCurrent/);
  assert.doesNotMatch(heroSource, /presentation\.orientation\.yawDeg \+ pointerCurrent/);
  assert.match(heroSource, /data-hero-interaction="drag-to-rotate-and-recenter"/);
  assert.doesNotMatch(heroSource, /viewer\.setAttribute\("auto-rotate", ""\)/);
  assert.match(heroSource, /viewer\.style\.pointerEvents = "none"/);
  assert.match(heroSource, /HERO_DRAG_YAW_MAX_DEG = 22/);
  assert.match(heroSource, /HERO_DRAG_PITCH_MAX_DEG = 8/);
  assert.match(heroSource, /HERO_DRAG_YAW_DEG_PER_PIXEL = 0\.16/);
  assert.match(heroSource, /HERO_DRAG_PITCH_DEG_PER_PIXEL = 0\.1/);
  assert.match(heroSource, /HERO_POINTER_FOLLOW_RATE = 8/);
  assert.match(heroSource, /stage\.addEventListener\("pointerdown", handlePointerDown\)/);
  assert.match(heroSource, /stage\.addEventListener\("pointermove", handlePointerMove\)/);
  assert.match(heroSource, /stage\.addEventListener\("pointerleave", settlePointerTilt\)/);
  assert.match(heroSource, /stage\.addEventListener\("pointerup", settlePointerTilt\)/);
  assert.match(heroSource, /stage\.setPointerCapture\(event\.pointerId\)/);
  assert.match(heroSource, /stage\.releasePointerCapture\(pointerDrag\.pointerId\)/);
  assert.match(heroSource, /window\.cancelAnimationFrame\(pointerAnimationFrame\)/);
  assert.doesNotMatch(heroSource, /POINTER_THETA_RANGE_DEG|POINTER_PHI_RANGE_DEG|reactiveLightRef|Move to explore/);
  assert.doesNotMatch(heroSource, /data-hero-lens|fluid-glass|backdropFilter/);
  assert.doesNotMatch(heroSource, /viewer\.setAttribute\("camera-controls"/);
});

test("constrained clients keep the image fallback while eligible desktop defers 3D until browser idle", () => {
  assert.match(heroSource, /connection\?\.saveData === true/);
  assert.match(heroSource, /connection\?\.effectiveType === "slow-2g"/);
  assert.match(heroSource, /connection\?\.effectiveType === "2g"/);
  assert.match(heroSource, /posterOnly = !finePointer \|\| constrainedNetwork/);
  assert.match(heroSource, /poster-coarse-pointer/);
  assert.match(heroSource, /poster-constrained-network/);
  assert.match(heroSource, /preview\.style\.display = "block"/);
  assert.match(heroSource, /requestIdleCallback/);
  assert.match(heroSource, /HERO_IDLE_TIMEOUT_MS/);
  assert.match(heroSource, /HERO_IDLE_FALLBACK_MS/);
  assert.match(heroSource, /cancelIdleCallback/);
  assert.match(heroSource, /clearTimeout\(fallbackTimeout\)/);
});

test("reduced motion keeps an eligible desktop model static instead of removing the 3D object", () => {
  assert.match(heroSource, /prefers-reduced-motion: reduce/);
  assert.match(heroSource, /enhanced-static/);
  assert.match(heroSource, /enhanced-drag-to-rotate/);
  assert.match(heroSource, /if \(!reducedMotion\) \{[\s\S]*pointermove/);
});
