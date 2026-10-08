import assert from "node:assert/strict";
import { existsSync, readFileSync } from "node:fs";
import test from "node:test";

const read = (path) => readFileSync(path, "utf8");

test("data-backed Shop routes expose a shared loading boundary", () => {
  assert.equal(existsSync("src/app/[locale]/shop/loading.tsx"), true);
  const boundary = read("src/app/[locale]/shop/loading.tsx");
  assert.match(boundary, /DataRouteLoading/);
  assert.match(boundary, /<Header \/>/);
  assert.match(boundary, /<Footer \/>/);
});

test("loading presentation is accessible and stays dependency-free", () => {
  const loader = read("src/components/ui/data-route-loading.tsx");
  const mark = read("src/components/ui/luminal-loading-mark.tsx");
  const styles = read("src/components/ui/luminal-loading-mark.module.css");

  assert.match(loader, /role="status"/);
  assert.match(loader, /aria-live="polite"/);
  assert.match(loader, /aria-busy="true"/);
  assert.match(mark, /aria-hidden="true"/);
  assert.match(styles, /@keyframes luminal-resin-travel/);
  assert.match(styles, /prefers-reduced-motion: reduce/);
  assert.doesNotMatch(`${loader}\n${mark}\n${styles}`, /lottiefiles|dotlottie|https?:\/\//i);
});
