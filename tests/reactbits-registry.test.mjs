import assert from "node:assert/strict";
import fs from "node:fs";
import test from "node:test";

const components = JSON.parse(fs.readFileSync("components.json", "utf8"));
const motionLayer = fs.readFileSync("src/components/motion/luminal-motion-layer.tsx", "utf8");
const bentoCss = fs.readFileSync("src/components/motion/luminal-bento.module.css", "utf8");
const packageJson = JSON.parse(fs.readFileSync("package.json", "utf8"));

test("Luminal Magic Bento adaptation stays registry-free and retires GlowCursor", () => {
  assert.deepEqual(components.registries ?? {}, {});
  assert.equal(fs.existsSync("src/components/motion/glow-cursor.tsx"), false);
  assert.equal(fs.existsSync("src/components/motion/glow-cursor.module.css"), false);
  assert.match(motionLayer, /BENTO_SELECTOR/);
  assert.match(bentoCss, /--luminal-bento-intensity/);
  assert.doesNotMatch(motionLayer + bentoCss, /REACTBITS_LICENSE_KEY|@reactbits|GlowCursor|glow-trail/i);
  assert.doesNotMatch(motionLayer, /from ["']gsap["']|gsap\./);
  assert.equal(packageJson.dependencies?.ogl, undefined);

  const serialized = JSON.stringify(components);
  assert.doesNotMatch(serialized, /reactbits|REACTBITS_LICENSE_KEY|Bearer rb_[A-Za-z0-9_-]+/i);
});
