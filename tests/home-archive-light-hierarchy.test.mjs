import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

const read = (path) => readFileSync(path, "utf8");
const home = read("src/features/home/home-page.tsx");
const globals = read("src/app/globals.css");
const archiveCss = read("src/app/[locale]/archive/archive-stage.module.css");
const archive = read("src/app/[locale]/archive/page.tsx");

test("Making section keeps the light visible beneath a soft scrim rather than an opaque sticky block", () => {
  assert.match(home, /data-made-at-luminal-header="true"/);
  assert.match(home, /editorial-heading md:sticky md:top-20 md:z-30 md:bg-transparent md:pb-8/);
  assert.doesNotMatch(home, /md:bg-\[#0a0a0a\]/);
  assert.match(globals, /\.made-at-luminal \[data-made-at-luminal-header\]::before/);
  assert.match(globals, /mask-image: linear-gradient\(180deg, transparent, #000 18%, #000 78%, transparent\)/);
  assert.match(globals, /pointer-events: none/);
});

test("Archive relies on the tent entrance light and avoids an independent misaligned directional cone", () => {
  assert.match(archiveCss, /meowhe-circus-closed\.webp/);
  assert.match(archiveCss, /\.stageLight \{[^}]+radial-gradient\(/);
  assert.doesNotMatch(archiveCss, /conic-gradient/);
  assert.match(archiveCss, /\.stageLight \{ display: none; \}/);
});

test("Archive makes real colorway photographs legible and keyboard navigation stays intact", () => {
  assert.match(archiveCss, /flex: 0 0 clamp\(6\.25rem, 8vw, 8\.5rem\)/);
  assert.match(archiveCss, /scroll-snap-type: x mandatory/);
  assert.match(archiveCss, /@media \(max-width: 700px\)/);
  assert.match(archiveCss, /prefers-reduced-motion: reduce/);
  assert.match(archive, /href=\{entry\.href\}/);
  assert.match(archive, /<Image src=\{entry\.media\.src\}/);
  assert.match(archive, /136px/);
  assert.match(archive, /styles\.colorwayLabel/);
});

test("Making beam stays near the card edge and respects the supporting copy", () => {
  const renderer = read("src/features/home/home-light-renderer.ts");
  assert.match(renderer, /const beamX = left \+ \(right - left\) \* 0\.965/);
  assert.match(renderer, /opacity \* 0\.52/);
  assert.match(renderer, /u\.uAmount, 0\.50/);
  assert.match(globals, /text-shadow: 0 2px 12px rgba\(0,0,0,\.85\)/);
});
