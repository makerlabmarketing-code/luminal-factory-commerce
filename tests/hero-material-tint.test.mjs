import assert from "node:assert/strict";
import fs from "node:fs";
import test from "node:test";
import ts from "typescript";
import vm from "node:vm";
const compiled = ts.transpileModule(fs.readFileSync("src/features/home/hero-model-materials.ts", "utf8"), { compilerOptions: { module: ts.ModuleKind.CommonJS } }).outputText;
const exports = {};
vm.runInNewContext(compiled, { exports });
const { applyHeroMaterialTint } = exports;
test("Hero tint applies CSS color to every material preserving its alpha", () => {
  const colors = [];
  const materials = [1, .5].map(alpha => ({ pbrMetallicRoughness: { baseColorFactor: [.1, .2, .3, alpha], setBaseColorFactor: value => colors.push(value) } }));
  applyHeroMaterialTint(materials, "#12abef");
  assert.equal(colors[0][3], 1);
  assert.equal(colors[1][3], .5);
  assert.ok(Math.abs(colors[0][0] - .0060488) < .000001);
  assert.ok(Math.abs(colors[0][1] - .4072402) < .000001);
  assert.ok(Math.abs(colors[0][2] - .8631572) < .000001);
});
test("absent or invalid Hero tint preserves authored materials", () => {
  let changed = false;
  const materials = [{ pbrMetallicRoughness: { baseColorFactor: [1,1,1,1], setBaseColorFactor: () => { changed = true; } } }];
  applyHeroMaterialTint(materials, null);
  applyHeroMaterialTint(materials, "<script>");
  assert.equal(changed, false);
});
