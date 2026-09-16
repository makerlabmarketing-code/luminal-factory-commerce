import assert from "node:assert/strict";
import fs from "node:fs";
import test from "node:test";

const layout = fs.readFileSync("src/app/layout.tsx", "utf8");
const motionLayer = fs.readFileSync("src/components/motion/luminal-motion-layer.tsx", "utf8");
const bentoCss = fs.readFileSync("src/components/motion/luminal-bento.module.css", "utf8");
const globals = fs.readFileSync("src/app/globals.css", "utf8");
const home = fs.readFileSync("src/features/home/home-page.tsx", "utf8");

test("global Luminal motion foundation mounts once and keeps the native cursor", () => {
  assert.match(layout, /LuminalMotionLayer/);
  assert.doesNotMatch(layout, /motion\.css/);
  assert.match(motionLayer, /IntersectionObserver/);
  assert.match(motionLayer, /MutationObserver/);
  assert.match(motionLayer, /requestAnimationFrame/);
  assert.doesNotMatch(motionLayer, /GlowCursor|glow-trail|canvas|getContext\(["']webgl|from ["']gsap["']|gsap\./);
  assert.equal(fs.existsSync("src/components/motion/glow-cursor.tsx"), false);
  assert.equal(fs.existsSync("src/components/motion/glow-cursor.module.css"), false);
});

test("Luminal Magic Bento activates only the topmost sticky card and keeps proximity quiet", () => {
  assert.match(motionLayer, /BENTO_SELECTOR = "\.made-at-luminal ol > li"/);
  assert.match(motionLayer, /BENTO_PROXIMITY_PX = 260/);
  assert.match(motionLayer, /BENTO_AMBIENT_SCALE = 0\.28/);
  assert.match(motionLayer, /document\.elementFromPoint\(pointerX, pointerY\)/);
  assert.match(motionLayer, /const isActive = card === activeCard/);
  assert.match(motionLayer, /const intensity = activeCard[\s\S]*isActive \? 1 : 0/);
  assert.match(motionLayer, /if \(isActive\) card\.dataset\.luminalBentoActive = "true"/);
  assert.match(motionLayer, /--luminal-bento-x/);
  assert.match(motionLayer, /--luminal-bento-y/);
  assert.match(motionLayer, /--luminal-bento-intensity/);
  assert.match(motionLayer, /Math\.hypot/);
  assert.match(bentoCss, /--luminal-bento-bronze: 176, 122, 63/);
  assert.match(bentoCss, /rgba\(var\(--luminal-bento-bronze\)/);
  assert.match(bentoCss, /rgba\(114, 89, 184/);
  assert.match(bentoCss, /padding: 4px/);
  assert.match(bentoCss, /border-color: rgba\(var\(--luminal-bento-bronze\), 0\.42\)/);
  assert.match(bentoCss, /font-size: clamp\(3\.25rem, 8\.3vw, 8\.5rem\)/);
  assert.match(bentoCss, /mask-composite: exclude/);
  assert.doesNotMatch(bentoCss, /214, 179, 90/);
  assert.doesNotMatch(motionLayer + bentoCss, /particle|magnetism|rotateX|rotateY|clickEffect/i);
});

test("Magic Bento interaction honors reduced-motion and coarse pointers", () => {
  assert.match(motionLayer, /prefers-reduced-motion: reduce/);
  assert.match(motionLayer, /pointer: fine/);
  assert.match(bentoCss, /@media \(hover: none\), \(pointer: coarse\)/);
  assert.match(bentoCss, /@media \(prefers-reduced-motion: reduce\)/);
  assert.match(globals, /@media \(prefers-reduced-motion: reduce\)/);
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
  assert.match(home, /className="made-at-luminal/);
  assert.doesNotMatch(home, /<section className="revival-hero"[^>]*data-luminal-reveal/);
});
