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
  const snapshot = () => ({
    copy: Number(copy.style.opacity),
    light: Number(sceneStyles.get("--stage-light")),
    bubbleScales: bubbles.map((bubble) => Number(bubble.style.transform.match(/scale\(([^)]+)\)/)[1])),
  });
  return { bubbles, copy, tick, scroll, cleanup, frames, listeners, viewport, snapshot };
}

test("a tiny upward scroll does not retract Meet Meowhe if the reveal is still in its held viewport region", () => {
  const scene = mountScene();
  scene.tick(3500);
  const before = scene.snapshot();
  assert.equal(before.copy, 1);
  assert.equal(before.light, 1);
  assert.deepEqual(before.bubbleScales, [1, 1, 1]);

  scene.scroll(-10);
  scene.tick(700);
  assert.deepEqual(scene.snapshot(), before);
  scene.scroll(-140);
  scene.tick(700);
  assert.deepEqual(scene.snapshot(), before);
  scene.cleanup();
});

test("the same scroll position yields the same bubble, copy and light states moving up or down", () => {
  const scene = mountScene();
  scene.tick(3500);

  scene.scroll(-420); // 580: within the symmetric reveal span 480..750.
  scene.tick(3500);
  const reverseState = scene.snapshot();
  assert.ok(reverseState.copy > 0 && reverseState.copy < 1);
  assert.ok(reverseState.light > 0 && reverseState.light < 1);
  assert.ok(reverseState.bubbleScales[2] > 0.08 && reverseState.bubbleScales[2] < 1);

  scene.scroll(-100); // 480: reveal is fully hidden.
  scene.tick(3500);
  assert.equal(scene.copy.style.visibility, "hidden");
  for (const bubble of scene.bubbles) assert.equal(bubble.style.visibility, "hidden");

  scene.scroll(100); // back to 580, this time moving down.
  scene.tick(3500);
  const forwardState = scene.snapshot();
  assert.deepEqual(forwardState, reverseState);
  scene.cleanup();
});

test("a partial reverse by a few pixels changes the visual state gradually, without resetting content", () => {
  const scene = mountScene();
  scene.tick(3500);
  scene.scroll(-400); // 600px, inside the transition.
  scene.tick(3500);
  const before = scene.snapshot();

  scene.scroll(-5);
  scene.tick(16);
  const afterOneFrame = scene.snapshot();
  assert.ok(afterOneFrame.copy <= before.copy);
  assert.ok(afterOneFrame.copy > 0);
  assert.ok(afterOneFrame.light > 0);
  assert.ok(afterOneFrame.bubbleScales[2] > 0.08);

  scene.scroll(5);
  scene.tick(3500);
  assert.deepEqual(scene.snapshot(), before);
  scene.cleanup();
  assert.equal(scene.frames.size, 0);
  assert.equal(scene.listeners.size, 0);
});
