import assert from "node:assert/strict";
import fs from "node:fs";
import test from "node:test";

const components = JSON.parse(fs.readFileSync("components.json", "utf8"));
const motionLayer = fs.readFileSync("src/components/motion/luminal-motion-layer.tsx", "utf8");

test("custom Luminal Glass Cursor stays independent from React Bits Pro licensing", () => {
  assert.deepEqual(components.registries ?? {}, {});
  assert.match(motionLayer, /data-cursor="glass-trail"/);
  assert.match(motionLayer, /backdropFilter: "blur\(5px\) saturate\(1\.35\)"/);
  assert.doesNotMatch(motionLayer, /@reactbits|glass-cursor-tw|REACTBITS_LICENSE_KEY/);

  const serialized = JSON.stringify(components);
  assert.doesNotMatch(serialized, /reactbits|REACTBITS_LICENSE_KEY|Bearer rb_[A-Za-z0-9_-]+/i);
});
