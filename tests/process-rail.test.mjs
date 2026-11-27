import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

const read = (path) => readFileSync(path, "utf8");
const home = read("src/features/home/home-page.tsx");
const rail = read("src/features/home/made-at-luminal-rail.tsx");
const css = read("src/features/home/made-at-luminal-rail.module.css");

test("The process rail uses available editorial imagery and preserves the four ordered steps", () => {
  assert.match(home, /content\.process\.map/);
  const imageIds = home.match(/processImageIds = \[(.*)\]/)[1].matchAll(/"([^"]+)"/g);
  const ids = Array.from(imageIds, ([, id]) => id);
  assert.equal(new Set(ids).size, 4);
  for (const id of ids) assert.ok(read(`public/images/home/gallery/${id}.webp`).length > 0);
  assert.match(rail, /<ol[^>]*>[\s\S]*steps\.map[\s\S]*<li/);
  assert.match(rail, /alt=\{step\.image\.alt\}/);
});

test("The rail ties desktop travel to native scroll and keeps a manual reduced-motion path", () => {
  assert.match(rail, /prefers-reduced-motion: no-preference/);
  assert.match(rail, /viewport\.scrollWidth - viewport\.clientWidth/);
  assert.match(rail, /viewport\.scrollLeft = Math\.max\(0, Math\.min\(travel, distance\)\)/);
  assert.match(rail, /addEventListener\("scroll", schedule, \{ passive: true \}\)/);
  assert.match(css, /\.viewport \{\s*overflow-x: auto/);
  assert.match(css, /\[data-process-pinned\] \.stage \{\s*position: sticky/);
});
