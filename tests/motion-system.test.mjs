import assert from "node:assert/strict";
import fs from "node:fs";
import test from "node:test";

const layout = fs.readFileSync("src/app/[locale]/layout.tsx", "utf8");
const motionLayer = fs.readFileSync("src/components/motion/luminal-motion-layer.tsx", "utf8");
const globals = fs.readFileSync("src/app/globals.css", "utf8");
const home = fs.readFileSync("src/features/home/home-page.tsx", "utf8");

test("global Luminal motion foundation mounts once and keeps the native cursor", () => {
  assert.match(layout, /LuminalMotionLayer/);
  assert.doesNotMatch(layout, /motion\.css/);
  assert.match(motionLayer, /IntersectionObserver/);
  assert.match(motionLayer, /MutationObserver/);
  assert.doesNotMatch(motionLayer, /GlowCursor|glow-trail|canvas|getContext\(["']webgl|from ["']gsap["']|gsap\./);
  assert.equal(fs.existsSync("src/components/motion/glow-cursor.tsx"), false);
  assert.equal(fs.existsSync("src/components/motion/glow-cursor.module.css"), false);
});

test("Luminal palette and local spotlight stay restrained and CSS-driven", () => {
  assert.match(globals, /--luminal-motion-gold: #d6b35a/);
  assert.match(globals, /--luminal-motion-violet: #7259b8/);
  assert.match(globals, /data-luminal-spotlight/);
  assert.match(motionLayer, /--luminal-spot-x/);
  assert.match(motionLayer, /--luminal-spot-y/);
});

test("below-fold Homepage content opts into reveal while Hero LCP stays untouched", () => {
  assert.match(home, /featured-object-copy[\s\S]*data-luminal-reveal="copy"/);
  assert.match(home, /archive-object-visual" data-luminal-spotlight="true"/);
  assert.match(home, /commerce-door-shop[\s\S]*data-luminal-reveal="card"/);
  assert.match(home, /<MadeAtLuminalRail/);
  assert.doesNotMatch(home, /<section className="revival-hero"[^>]*data-luminal-reveal/);
});
