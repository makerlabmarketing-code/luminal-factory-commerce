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
  const sceneStyles = new Map();
  const scene = {
    closest: () => section,
    getBoundingClientRect: () => ({ left: 0, top: 88, width: 1400, height: 912 }),
    style: { setProperty: (key, value) => sceneStyles.set(key, value) },
  };
  const bubbles = [0, 1, 2].map((index) => ({
    offsetLeft: 600 + index * 200, offsetTop: 100, offsetWidth: 200, offsetHeight: 200, style: {}, dataset: {},
  }));
  const copy = { style: {} };
  let modelQueries = 0;
  const code = ts.transpileModule(`const effect = () => {${effect}}; effect();`, {
    compilerOptions: { target: ts.ScriptTarget.ES2022 },
  }).outputText;
  const cleanup = vm.runInNewContext(code, {
    window: viewport,
    document: { querySelector: () => { modelQueries++; throw new Error("Bubble animation must not query the model"); } },
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
  const snapshot = () => ({
    copy: Number(copy.style.opacity),
    light: Number(sceneStyles.get("--stage-light")),
    bubbleScales: bubbles.map((bubble) => Number(bubble.style.transform.match(/scale\(([^)]+)\)/)[1])),
  });
  return { bubbles, copy, tick, scroll, cleanup, frames, listeners, viewport, snapshot, modelQueries: () => modelQueries };
}

test("colorway bubbles launch near the left-side Hero and float after reaching their own positions", () => {
  const scene = mountScene();
  scene.tick(800);
  assert.equal(scene.bubbles[0].dataset.landed, "true");
  assert.equal(scene.bubbles[1].dataset.landed, "true");
  const source = readFileSync("src/features/home/home-archive-burst.tsx", "utf8");
  const css = readFileSync("src/features/home/home-archive-burst.module.css", "utf8");
  assert.match(source, /const originX = rect\.width \* 0\.29/);
  assert.match(source, /const originY = rect\.height \* 0\.50/);
  assert.match(source, /bubble\.offsetLeft/);
  assert.match(source, /measureFlight\(\)/);
  assert.match(source, /styles\.floatBody/);
  assert.match(css, /colorway-gentle-float/);
  assert.match(css, /prefers-reduced-motion: reduce/);
  assert.doesNotMatch(source, /01 \/ A character with a past/);
  assert.match(source, /A character with a past\. Explore three earlier colorways/);
  scene.cleanup();
});

test("bubble paths stay independent of model movement and use no model geometry reads", () => {
  const scene = mountScene();
  scene.tick(800);
  const full = scene.snapshot();
  assert.deepEqual(full.bubbleScales, [1, 1, 1]);
  assert.equal(scene.modelQueries(), 0);

  scene.scroll(-195);
  scene.tick(800);
  const partial = scene.snapshot();
  assert.ok(partial.light > 0 && partial.light < 1);
  assert.ok(partial.copy > 0 && partial.copy < 1);
  assert.ok(partial.bubbleScales[2] > 0.08 && partial.bubbleScales[2] < 1);
  assert.equal(scene.modelQueries(), 0);
  scene.cleanup();
});

test("bubble, copy and spotlight retract and reveal at the same scroll positions", () => {
  const scene = mountScene();
  scene.tick(800);

  scene.scroll(-195);
  scene.tick(800);
  const reverse = scene.snapshot();
  scene.scroll(-100);
  scene.tick(800);
  assert.equal(scene.copy.style.visibility, "hidden");
  assert.equal(scene.snapshot().light, 0);
  for (const bubble of scene.bubbles) {
    assert.equal(bubble.style.visibility, "hidden");
  }

  scene.scroll(100);
  scene.tick(800);
  assert.deepEqual(scene.snapshot(), reverse);
  scene.cleanup();
});

test("small reverse scroll makes gradual movement, without jumping to zero", () => {
  const scene = mountScene();
  scene.tick(800);
  scene.scroll(-195);
  scene.tick(800);
  const before = scene.snapshot();

  scene.scroll(-5);
  scene.tick(16);
  const after = scene.snapshot();
  assert.ok(after.copy > 0 && after.copy <= before.copy);
  assert.ok(after.light > 0 && after.light <= before.light);
  assert.ok(after.bubbleScales[2] > 0.08 && after.bubbleScales[2] <= before.bubbleScales[2]);
  scene.scroll(5);
  scene.tick(800);
  assert.deepEqual(scene.snapshot(), before);

  scene.cleanup();
  assert.equal(scene.frames.size, 0);
  assert.equal(scene.listeners.size, 0);
});
