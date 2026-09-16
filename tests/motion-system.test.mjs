import assert from "node:assert/strict";
import fs from "node:fs";
import test from "node:test";

const layout = fs.readFileSync("src/app/layout.tsx", "utf8");
const motionLayer = fs.readFileSync("src/components/motion/luminal-motion-layer.tsx", "utf8");
const globals = fs.readFileSync("src/app/globals.css", "utf8");
const home = fs.readFileSync("src/features/home/home-page.tsx", "utf8");
const components = fs.readFileSync("components.json", "utf8");

test("global Luminal motion foundation mounts once without a new runtime package", () => {
  assert.match(layout, /LuminalMotionLayer/);
  assert.doesNotMatch(layout, /motion\.css/);
  assert.match(motionLayer, /requestAnimationFrame/);
  assert.match(motionLayer, /IntersectionObserver/);
  assert.match(motionLayer, /MutationObserver/);
  assert.doesNotMatch(motionLayer, /setState|useState/);
});

test("motion honors reduced-motion and coarse pointers", () => {
  assert.match(motionLayer, /prefers-reduced-motion: reduce/);
  assert.match(motionLayer, /pointer: fine/);
  assert.match(motionLayer, /if \(!finePointer\.matches\) cursor\.style\.display = "none"/);
  assert.match(globals, /@media \(prefers-reduced-motion: reduce\)/);
});

test("global cursor uses a lightweight custom glass trail without licensed React Bits code", () => {
  assert.match(motionLayer, /data-cursor="glass-trail"/);
  assert.match(motionLayer, /GLASS_TRAIL_LENGTH = 14/);
  assert.match(motionLayer, /CURSOR_IDLE_TIMEOUT_MS = 700/);
  assert.match(motionLayer, /backdropFilter: "blur\(5px\) saturate\(1\.35\)"/);
  assert.match(motionLayer, /WebkitBackdropFilter: "blur\(5px\) saturate\(1\.35\)"/);
  assert.match(motionLayer, /mixBlendMode: "screen"/);
  assert.match(motionLayer, /Math\.hypot\(dx, dy\)/);
  assert.match(motionLayer, /scale\(\$\{localStretch\}, \$\{crossScale\}\)/);
  assert.doesNotMatch(motionLayer, /@reactbits|glass-cursor-tw|dual-follower|goldRef|violetRef/);
  assert.match(components, /"registries": \{\}/);
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
  assert.doesNotMatch(home, /<section className="revival-hero"[^>]*data-luminal-reveal/);
});
