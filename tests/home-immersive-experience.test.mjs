import assert from "node:assert/strict";
import { existsSync, readFileSync } from "node:fs";
import test from "node:test";

const read = (path) => readFileSync(path, "utf8");

test("HOME-3D-HANDOFF-02 uses a measured logo dock before revealing Home navigation", () => {
  assert.equal(existsSync("src/features/home/home-arrival-header.tsx"), true);
  assert.equal(existsSync("src/features/home/home-arrival-header.module.css"), true);
  const header = read("src/features/home/home-arrival-header.tsx");
  const immersive = read("src/features/home/home-immersive-experience.tsx");
  assert.match(header, /data-home-logo-dock="true"/);
  assert.match(header, /luminal:brand-docked/);
  assert.match(immersive, /querySelector<HTMLElement>\("\[data-home-logo-dock\]"\)/);
  assert.match(immersive, /LOGO_DOCK_MS = 1080/);
  assert.match(immersive, /luminal:brand-docked/);
});

test("Home header rail and desktop navigation bubbles remain unavailable until dock completion", () => {
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


test("HOME-3D-PATH-02 terminates at Meet Meowhe and turns the camera left", () => {
  const immersive = read("src/features/home/home-immersive-experience.tsx");
  assert.match(immersive, /section: "hero" \| "featured"/);
  assert.doesNotMatch(immersive, /section: "hero" \| "featured" \| "revival"/);
  assert.match(immersive, /anchor: "bottom"/);
  assert.match(immersive, /xVw: -39/);
  assert.match(immersive, /orbitDeg: -32/);
  assert.match(immersive, /luminal:hero-orbit-offset/);
});

test("desktop Meowhe scales down before Brand Revival enters the viewport", () => {
  const immersive = read("src/features/home/home-immersive-experience.tsx");
  assert.match(immersive, /const desktopStates[\s\S]*?viewportOffset: 0\.98[\s\S]*?scale: 0\.54[\s\S]*?opacity: 1/);
  assert.match(immersive, /const desktopStates[\s\S]*?viewportOffset: 0\.80[\s\S]*?scale: 0\.42[\s\S]*?opacity: 0\.62/);
  assert.match(immersive, /const desktopStates[\s\S]*?viewportOffset: 0\.64[\s\S]*?scale: 0\.32[\s\S]*?opacity: 0/);
});

test("Hero 3D follows pointer on desktop and the same persistent GLB travels on mobile", () => {
  const stage = read("src/features/home/hero-object-stage.tsx");
  const home = read("src/features/home/home-page.tsx");
  const immersive = read("src/features/home/home-immersive-experience.tsx");
  assert.match(stage, /pointer-follow-and-recenter/);
  assert.doesNotMatch(stage, /setPointerCapture/);
  assert.doesNotMatch(stage, /pointerdown/);
  assert.match(stage, /normalizedX/);
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
  assert.match(immersive, /const compactStates[\s\S]*?viewportOffset: 0\.22[\s\S]*?scale: 0\.60[\s\S]*?opacity: 0\.42/);
  assert.match(immersive, /const compactStates[\s\S]*?anchor: "bottom"[\s\S]*?viewportOffset: 0\.96[\s\S]*?scale: 0\.48[\s\S]*?opacity: 0/);
  assert.match(css, /top: 66svh/);
  assert.match(css, /width: 96vw/);
  assert.match(global, /min-height: 118svh/);
  assert.match(global, /home-hero-object-corridor[\s\S]*min-height: 36svh/);
});

test("Made at Luminal exits the sticky chrome together with terminal Step 04", () => {
  const home = read("src/features/home/home-page.tsx");
  const stack = read("src/features/home/made-at-luminal-stack.tsx");
  assert.match(home, /MadeAtLuminalStack/);
  assert.match(home, /<MadeAtLuminalStack steps=\{content\.process\} \/>/);
  assert.match(home, /data-made-at-luminal-header="true"/);
  assert.match(home, /md:z-30/);
  assert.match(home, /md:pb-0/);
  assert.match(stack, /data-process-title-rail="true"/);
  assert.match(stack, /steps\.slice\(0, -1\)/);
  assert.match(stack, /collapsedStripPx/);
  assert.match(stack, /nextTop <= currentTop \+ collapsedStripPx/);
  assert.match(stack, /\{step\.number\} \/ \{step\.title\}/);
  assert.match(stack, /data-process-terminal=\{isLast \? "true" : undefined\}/);
  assert.match(stack, /isLast \? "md:relative" : "md:sticky"/);
  assert.match(stack, /top: isLast \? undefined/);
  assert.match(stack, /terminalTargetTop/);
  assert.match(stack, /releaseDistance = Math\.max\(0, terminalTargetTop - terminalTop\)/);
  assert.match(stack, /--process-release-y/);
  assert.match(stack, /header\.style\.translate/);
  assert.match(stack, /translate: "0 var\(--process-release-y, 0px\)"/);
  assert.match(stack, /translate: isLast \? undefined : "0 var\(--process-release-y, 0px\)"/);
  assert.match(stack, /md:pb-0/);
  assert.match(stack, /--process-stack-top/);
  assert.match(stack, /HEADER_STICKY_TOP_REM/);
  assert.match(stack, /HEADER_STACK_GAP_REM/);
  assert.match(stack, /var\(--process-stack-top, 15rem\)/);
  assert.match(stack, /md:min-h-\[60svh\]/);
  assert.doesNotMatch(stack, /100svh-12rem/);
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
