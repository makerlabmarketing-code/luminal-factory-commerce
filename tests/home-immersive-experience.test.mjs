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

test("Home header rail and bubble control remain unavailable until dock completion", () => {
  const header = read("src/features/home/home-arrival-header.tsx");
  const css = read("src/features/home/home-arrival-header.module.css");
  assert.match(header, /type HeaderStage = "waiting" \| "revealed"/);
  assert.match(css, /data-stage="revealed"/);
  assert.match(css, /dockRipple/);
  assert.match(css, /menuButton/);
  assert.match(css, /scale\(0\.62\)/);
});

test("HOME-HERO-LAYOUT-02 moves the traveling object outside the clipped main composition", () => {
  const home = read("src/features/home/home-page.tsx");
  const immersive = read("src/features/home/home-immersive-experience.module.css");
  assert.match(home, /<HomeImmersiveExperience[\s\S]*?<main id="main-content"/);
  assert.match(home, /home-hero-object-corridor/);
  assert.match(home, /Object in motion · Meowhe/);
  assert.match(home, /featured-object-immersive/);
  assert.match(immersive, /position: fixed/);
});

test("immersive Home remains bounded by raffle, mobile and reduced-motion priorities", () => {
  const home = read("src/features/home/home-page.tsx");
  const immersive = read("src/features/home/home-immersive-experience.tsx");
  const css = read("src/features/home/home-immersive-experience.module.css");
  assert.match(home, /const immersive = !featuredRaffle/);
  assert.match(immersive, /min-width: 900px/);
  assert.match(immersive, /prefers-reduced-motion: reduce/);
  assert.match(css, /@media \(max-width: 899px\)/);
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
