import assert from "node:assert/strict";
import fs from "node:fs";
import test from "node:test";

const components = JSON.parse(fs.readFileSync("components.json", "utf8"));
const motionLayer = fs.readFileSync("src/components/motion/luminal-motion-layer.tsx", "utf8");
const packageJson = JSON.parse(fs.readFileSync("package.json", "utf8"));

test("Luminal motion stays registry-free and keeps GlowCursor retired", () => {
  assert.deepEqual(components.registries ?? {}, {});
  assert.equal(fs.existsSync("src/components/motion/glow-cursor.tsx"), false);
  assert.equal(fs.existsSync("src/components/motion/glow-cursor.module.css"), false);
  assert.doesNotMatch(motionLayer, /REACTBITS_LICENSE_KEY|@reactbits|GlowCursor|glow-trail/i);
  assert.doesNotMatch(motionLayer, /from ["']gsap["']|gsap\./);
  // OGL is approved for the owner-supplied Home FlexCarousel.
  assert.doesNotMatch(motionLayer, /from ["']ogl["']|FlexCarousel/);
  assert.equal(packageJson.dependencies?.ogl, "1.0.11");

  const serialized = JSON.stringify(components);
  assert.doesNotMatch(serialized, /reactbits|REACTBITS_LICENSE_KEY|Bearer rb_[A-Za-z0-9_-]+/i);
});
