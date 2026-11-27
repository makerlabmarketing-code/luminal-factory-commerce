import assert from "node:assert/strict";
import { existsSync, readFileSync } from "node:fs";
import test from "node:test";

const read = (path) => readFileSync(path, "utf8");

test("Home navigation is available while Meowhe loads", () => {
  assert.equal(existsSync("src/features/home/home-arrival-header.tsx"), true);
  const immersive = read("src/features/home/home-immersive-experience.tsx");
  assert.match(immersive, /<HomeArrivalHeader \/>/);
  assert.doesNotMatch(immersive, /LOGO_DOCK_MS|INTRO_MAXIMUM_MS|finishDock|waiting/);
});

test("Home header rail retains its desktop navigation bubbles", () => {
  const header = read("src/features/home/home-arrival-header.tsx");
  const css = read("src/features/home/home-arrival-header.module.css");
  assert.match(header, /type HeaderStage = "waiting" \| "revealed"/);
  assert.match(header, /className=\{styles\.desktopNav\}/);
  assert.match(header, /className=\{styles\.navBubble\}/);
  assert.match(css, /data-stage="revealed"/);
  assert.match(css, /dockRipple/);
  assert.match(css, /\.navBubble/);
  assert.match(css, /var\(--nav-index\)/);
});

test("HOME-HERO-LAYOUT-02 moves the traveling object outside the clipped main composition", () => {
  const home = read("src/features/home/home-page.tsx");
  const immersive = read("src/features/home/home-immersive-experience.module.css");
  assert.match(home, /<HomeImmersiveExperience[\s\S]*?<main id="main-content"/);
  assert.match(home, /home-hero-object-corridor/);
  assert.doesNotMatch(home, /Our browser-safe 3D study introduces the character/);
  assert.match(home, /featured-object-immersive/);
  assert.match(immersive, /position: fixed/);
});


test("HOME-3D-PATH-02 parks beside the colorways and turns the camera left", () => {
  const immersive = read("src/features/home/home-immersive-experience.tsx");
  const home = read("src/features/home/home-page.tsx");
  const burst = read("src/features/home/home-archive-burst.tsx");
  assert.match(immersive, /section: "hero" \| "featured"/);
  assert.doesNotMatch(immersive, /section: "hero" \| "featured" \| "revival"/);
  assert.match(immersive, /anchor: "top"/);
  assert.match(immersive, /xVw: -49/);
  assert.match(immersive, /orbitDeg: -32/);
  assert.match(immersive, /luminal:hero-orbit-offset/);
  assert.match(home, /<HomeArchiveBurst colorways=\{media\.gallery\.slice\(0, 3\)\} \/>/);
  assert.match(burst, /Meet Meowhe\./);
  // Colorway flight is independent from the moving Hero model and its geometry.
  assert.doesNotMatch(burst, /data-home-immersive-model|getBoundingClientRect\(\).*model/);
  assert.match(burst, /BUBBLE_FLIGHT/);
});

test("desktop Meowhe parks beside the colorways and leaves with the scene", () => {
  const immersive = read("src/features/home/home-immersive-experience.tsx");
  assert.match(immersive, /const desktopStates[\s\S]*?viewportOffset: 0\.52[\s\S]*?scale: 0\.70[\s\S]*?opacity: 1/);
  assert.match(immersive, /const desktopStates[\s\S]*?anchor: "bottom"[\s\S]*?viewportOffset: 0\.98[\s\S]*?scale: 0\.70[\s\S]*?opacity: 1/);
  assert.match(immersive, /featuredSection.getBoundingClientRect\(\).bottom - window.innerHeight/);
});

test("Hero 3D follows pointer on desktop and the same persistent GLB travels on mobile", () => {
  const stage = read("src/features/home/hero-object-stage.tsx");
  const home = read("src/features/home/home-page.tsx");
  const immersive = read("src/features/home/home-immersive-experience.tsx");
  assert.match(stage, /drag-and-recenter/);
  assert.doesNotMatch(stage, /setPointerCapture/);
  assert.match(stage, /window\.addEventListener\("pointerdown", handlePointerDown\)/);
  assert.match(stage, /HERO_DRAG_PHI_MAX_DEG = 85/);
  assert.doesNotMatch(stage, /normalizedX|normalizedY|pointerTarget/);
  assert.match(immersive, /compactStates/);
  assert.match(immersive, /allowTouch3d/);
  assert.match(immersive, /max-width: 1023px/);
  assert.doesNotMatch(home, /home-object-mobile-stage/);
});

test("mobile Hero reserves a lower safe stage then fades and zooms out before Brand Revival", () => {
  const immersive = read("src/features/home/home-immersive-experience.tsx");
  const css = read("src/features/home/home-immersive-experience.module.css");
  const global = read("src/app/globals.css");
  assert.match(immersive, /const desktopStates[\s\S]*?scale: 1,/);
  assert.match(immersive, /const compactStates[\s\S]*?yVh: -34[\s\S]*?scale: 0\.80/);
  assert.match(immersive, /const compactStates[\s\S]*?viewportOffset: 0\.44[\s\S]*?opacity: 1/);
  assert.match(immersive, /const compactStates[\s\S]*?anchor: "bottom"[\s\S]*?viewportOffset: 0\.98[\s\S]*?scale: 0\.68[\s\S]*?opacity: 1/);
  assert.match(immersive, /releaseY/);
  assert.match(css, /top: 66svh/);
  assert.match(css, /width: 96vw/);
  assert.match(global, /min-height: 118svh/);
  assert.match(global, /home-hero-object-corridor[\s\S]*min-height: 36svh/);
});

test("Hero emits model-boundary intersection and scroll direction while retaining scroll-driven GLB travel", () => {
  const immersive = read("src/features/home/home-immersive-experience.tsx");
  const bubble = read("src/features/home/home-archive-burst.tsx");
  assert.match(immersive, /const heroContactY = modelBounds\.top \+ modelBounds\.height \* 0\.22/);
  assert.match(immersive, /featuredBoundaryTop, heroContactY, scrollingUp/);
  assert.match(immersive, /scrollingUp = scrollY < previousScrollY/);
  assert.match(bubble, /featuredBoundaryTop >= detail\.heroContactY/);
  assert.match(bubble, /returningAcrossSection/);
  assert.doesNotMatch(bubble, /RETRACT_AT = /);
});

test("immersive Home remains bounded by raffle, mobile and reduced-motion priorities", () => {
  const home = read("src/features/home/home-page.tsx");
  const immersive = read("src/features/home/home-immersive-experience.tsx");
  const css = read("src/features/home/home-immersive-experience.module.css");
  assert.match(home, /const immersive = !featuredRaffle/);
  assert.match(immersive, /max-width: 1023px/);
  assert.match(immersive, /prefers-reduced-motion: reduce/);
  assert.match(css, /@media \(max-width: 1023px\)/);
  assert.match(css, /@media \(prefers-reduced-motion: reduce\)/);
});

test("reference adaptation does not embed NOZO assets or branding", () => {
  const combined = [
    read("src/features/home/home-arrival-header.tsx"),
    read("src/features/home/home-arrival-header.module.css"),
    read("src/features/home/home-immersive-experience.tsx"),
    read("src/features/home/home-immersive-experience.module.css"),
  ].join("\n");
  assert.doesNotMatch(combined, /nozo|mingg\.space/i);
  assert.match(combined, /luminal-factory-logo-primary\.png/);
});
