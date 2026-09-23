import assert from "node:assert/strict";
import { existsSync, readFileSync } from "node:fs";
import test from "node:test";

const read = (path) => readFileSync(path, "utf8");

test("HOME-3D-SCROLL-01 has one bounded immersive controller", () => {
  assert.equal(existsSync("src/features/home/home-immersive-experience.tsx"), true);
  assert.equal(existsSync("src/features/home/home-immersive-experience.module.css"), true);
  const home = read("src/features/home/home-page.tsx");
  assert.match(home, /HomeImmersiveExperience/);
  assert.match(home, /enabled=\{!featuredRaffle\}/);
  assert.match(home, /data-home-3d-section="hero"/);
  assert.match(home, /data-home-3d-section="gallery"/);
});

test("intro preloads the existing object, waits for readiness, and cannot deadlock", () => {
  const intro = read("src/features/home/home-immersive-experience.tsx");
  const hero = read("src/features/home/hero-object-stage.tsx");
  assert.match(intro, /INTRO_MINIMUM_MS = 2100/);
  assert.match(intro, /INTRO_MAXIMUM_MS = 4800/);
  assert.match(intro, /luminal:hero-object-ready/);
  assert.match(intro, /sessionStorage/);
  assert.match(hero, /preload\?: boolean/);
  assert.match(hero, /signalObjectReady\("3d"\)/);
  assert.match(hero, /signalObjectReady\("poster"\)/);
  assert.match(hero, /if \(preload\)/);
});

test("scroll choreography is decorative and respects mobile and reduced motion fallbacks", () => {
  const intro = read("src/features/home/home-immersive-experience.tsx");
  const css = read("src/features/home/home-immersive-experience.module.css");
  assert.match(intro, /min-width: 900px/);
  assert.match(intro, /prefers-reduced-motion: reduce/);
  assert.match(css, /@media \(max-width: 899px\)/);
  assert.match(css, /@media \(prefers-reduced-motion: reduce\)/);
  assert.doesNotMatch(intro, /fetch\(|createClient|supabase|payment|order/);
});

test("reference adaptation does not embed NOZO assets or branding", () => {
  const intro = read("src/features/home/home-immersive-experience.tsx");
  const css = read("src/features/home/home-immersive-experience.module.css");
  assert.doesNotMatch(intro + css, /nozo|mingg\.space/i);
  assert.match(intro, /luminal-factory-logo-primary\.png/);
});
