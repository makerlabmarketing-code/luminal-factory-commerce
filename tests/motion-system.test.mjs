import assert from "node:assert/strict";
import fs from "node:fs";
import test from "node:test";

const layout = fs.readFileSync("src/app/layout.tsx", "utf8");
const motionLayer = fs.readFileSync("src/components/motion/luminal-motion-layer.tsx", "utf8");
const motionCss = fs.readFileSync("src/app/motion.css", "utf8");
const home = fs.readFileSync("src/features/home/home-page.tsx", "utf8");

test("global Luminal motion foundation mounts once without a new runtime package", () => {
  assert.match(layout, /LuminalMotionLayer/);
  assert.match(layout, /import "\.\/motion\.css"/);
  assert.match(motionLayer, /requestAnimationFrame/);
  assert.match(motionLayer, /IntersectionObserver/);
  assert.match(motionLayer, /MutationObserver/);
  assert.doesNotMatch(motionLayer, /setState|useState/);
});

test("motion honors reduced-motion and coarse pointers", () => {
  assert.match(motionLayer, /prefers-reduced-motion: reduce/);
  assert.match(motionLayer, /pointer: fine/);
  assert.match(motionCss, /@media \(hover: none\), \(pointer: coarse\)/);
  assert.match(motionCss, /@media \(prefers-reduced-motion: reduce\)/);
});

test("Luminal palette and local spotlight stay restrained and CSS-driven", () => {
  assert.match(motionCss, /--luminal-motion-gold: #d6b35a/);
  assert.match(motionCss, /--luminal-motion-violet: #7259b8/);
  assert.match(motionCss, /data-luminal-spotlight/);
  assert.match(motionLayer, /--luminal-spot-x/);
  assert.match(motionLayer, /--luminal-spot-y/);
});

test("below-fold Homepage content opts into reveal while Hero LCP stays untouched", () => {
  assert.match(home, /featured-object-copy[\s\S]*data-luminal-reveal="copy"/);
  assert.match(home, /archive-object-visual" data-luminal-spotlight="true"/);
  assert.match(home, /commerce-door-shop[\s\S]*data-luminal-reveal="card"/);
  assert.doesNotMatch(home, /<section className="revival-hero"[^>]*data-luminal-reveal/);
});
