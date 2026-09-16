import assert from "node:assert/strict";
import fs from "node:fs";
import test from "node:test";

const layout = fs.readFileSync("src/app/layout.tsx", "utf8");
const blend = fs.readFileSync("src/app/hero-blend.css", "utf8");
const stage = fs.readFileSync("src/features/home/hero-object-stage.tsx", "utf8");

test("Hero 3D stage blends into the section instead of rendering as a card", () => {
  assert.match(layout, /import "\.\/hero-blend\.css"/);
  assert.match(blend, /\.hero-object-stage\s*\{[\s\S]*background:\s*transparent\s*!important/);
  assert.match(blend, /\.hero-object-stage::before\s*\{[\s\S]*content:\s*none\s*!important/);
  assert.match(blend, /\.hero-object-stage model-viewer\s*\{[\s\S]*background:\s*transparent\s*!important/);
  assert.match(blend, /mask-image:\s*radial-gradient/);
  assert.match(blend, /\.hero-object-vignette\s*\{[\s\S]*display:\s*none\s*!important/);
  assert.match(stage, /viewer\.style\.background = "transparent"/);
  assert.doesNotMatch(blend, /border:\s*1px/);
});
