import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import vm from "node:vm";
import test from "node:test";
import ts from "typescript";

function mountScene() {
  const source = readFileSync("src/features/home/home-archive-burst.tsx", "utf8");
  const effect = source.slice(source.indexOf("    const scene = sceneRef.current;"), source.indexOf("  }, []);"));
  const listeners = new Map();
  const frames = new Map();
  let now = 0;
  let frameId = 0;
  const viewport = {
    innerHeight: 1000, scrollY: 1000,
    matchMedia: () => ({ matches: false }),
    requestAnimationFrame: (callback) => { frames.set(++frameId, callback); return frameId; },
    cancelAnimationFrame: (id) => frames.delete(id),
    addEventListener: (name, callback) => listeners.set(name, callback),
    removeEventListener: (name) => listeners.delete(name),
  };
  const section = { getBoundingClientRect: () => ({ top: 1000 - viewport.scrollY }) };
  const scene = {
    closest: () => section,
    getBoundingClientRect: () => ({ left: 0, top: 88, width: 1400, height: 912 }),
    style: { setProperty() {} },
  };
  const bubbles = [0, 1, 2].map((index) => ({
    offsetLeft: 600 + index * 200, offsetTop: 100, offsetWidth: 200, offsetHeight: 200, style: {},
  }));
  const copy = { style: {} };
  const code = ts.transpileModule(`const effect = () => {${effect}}; effect();`, {
    compilerOptions: { target: ts.ScriptTarget.ES2022 },
  }).outputText;
  const cleanup = vm.runInNewContext(code, {
    window: viewport,
    document: { querySelector: () => ({ getBoundingClientRect: () => ({ left: 100, top: 200, width: 400, height: 400 }) }) },
    sceneRef: { current: scene }, copyRef: { current: copy }, bubbleRefs: { current: bubbles },
    clamp01: (value) => Math.min(1, Math.max(0, value)),
  });
  const tick = (duration) => {
    for (let elapsed = 0; elapsed < duration; elapsed += 16) {
      now += 16;
      const callbacks = [...frames.values()];
      frames.clear();
      callbacks.forEach((callback) => callback(now));
    }
  };
  const scroll = (distance) => { viewport.scrollY += distance; listeners.get("scroll")(); };
  return { bubbles, copy, tick, scroll, cleanup, frames, listeners, viewport };
}

const scale = (bubble) => Number(bubble.style.transform.match(/scale\(([^)]+)\)/)[1]);

test("colorways begin immediately and return on the first upward scroll within the held section", () => {
  const scene = mountScene();
  scene.tick(16);
  assert.equal(scene.bubbles[0].style.visibility, "visible");
  scene.tick(3400);
  assert.equal(scale(scene.bubbles[0]), 1);
  // The positional reveal target is still saturated after this tiny upward scroll.
  scene.scroll(-10);
  scene.tick(960);
  assert.ok(scale(scene.bubbles[2]) < 1);
  assert.equal(scene.copy.style.opacity, "1.000");
  for (const bubble of scene.bubbles) assert.equal(bubble.style.visibility, "visible");
  scene.tick(2400);
  for (const bubble of scene.bubbles) {
    assert.equal(bubble.style.visibility, "hidden");
    assert.equal(scale(bubble), 0.08);
  }
  assert.equal(scene.copy.style.visibility, "hidden");
  scene.scroll(10);
  scene.tick(16);
  assert.equal(scene.bubbles[0].style.visibility, "visible");
  scene.cleanup();
  assert.equal(scene.frames.size, 0);
  assert.equal(scene.listeners.size, 0);
});

test("reversing during a partial reveal cancels outward motion and can replay repeatedly", () => {
  const scene = mountScene();
  for (let attempt = 0; attempt < 3; attempt += 1) {
    scene.tick(700);
    const before = scale(scene.bubbles[0]);
    scene.scroll(-5);
    scene.tick(32);
    assert.ok(scale(scene.bubbles[0]) < before);
    scene.tick(850);
    assert.equal(scene.bubbles[0].style.visibility, "hidden");
    scene.scroll(5);
  }
  scene.cleanup();
});


test("reverse playback retracts bubbles and copy smoothly with a slightly quicker exit", () => {
  const scene = mountScene();
  scene.tick(3400);
  assert.equal(scene.copy.style.opacity, "1.000");
  scene.scroll(-10);
  scene.tick(960);
  const firstScale = scale(scene.bubbles[2]);
  assert.ok(firstScale > 0.08 && firstScale < 1);
  scene.tick(320);
  const secondScale = scale(scene.bubbles[2]);
  assert.ok(secondScale < firstScale && secondScale > 0.08);
  scene.tick(1920);
  assert.equal(scene.copy.style.visibility, "hidden");
  for (const bubble of scene.bubbles) {
    assert.equal(bubble.style.visibility, "hidden");
    assert.equal(scale(bubble), 0.08);
  }
  scene.cleanup();
});
