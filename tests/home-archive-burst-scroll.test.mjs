import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import vm from "node:vm";
import test from "node:test";
import ts from "typescript";

function mountScene(initialArrival = "") {
  const source = readFileSync("src/features/home/home-archive-burst.tsx", "utf8");
  const effect = source.slice(source.indexOf("    const scene = sceneRef.current;"), source.indexOf("  }, []);"));
  assert.ok(effect.includes("const onHeroArrival"), "effect must bind a Hero event");
  const listeners = new Map();
  const frames = new Map();
  let now = 0;
  let frameId = 0;
  let geometryMeasurements = 0;
  let modelQueries = 0;
  const viewport = {
    innerHeight: 1000,
    scrollY: 1000,
    matchMedia: () => ({ matches: false }),
    requestAnimationFrame: (callback) => { frames.set(++frameId, callback); return frameId; },
    cancelAnimationFrame: (id) => frames.delete(id),
    addEventListener: (name, callback) => listeners.set(name, callback),
    removeEventListener: (name) => listeners.delete(name),
  };
  const sceneStyles = new Map();
  const scene = {
    getBoundingClientRect: () => {
      geometryMeasurements++;
      return { left: 0, top: 88, width: 1400, height: 912 };
    },
    style: { setProperty: (key, value) => sceneStyles.set(key, value) },
  };
  const bubbles = [0, 1, 2].map((index) => ({
    offsetLeft: 600 + index * 200, offsetTop: 100,
    offsetWidth: 200, offsetHeight: 200, style: {}, dataset: {}, tabIndex: -1,
  }));
  const copy = { style: {} };
  const code = ts.transpileModule("const effect = () => {" + effect + "}; effect();", {
    compilerOptions: { target: ts.ScriptTarget.ES2022 },
  }).outputText;
  const cleanup = vm.runInNewContext(code, {
    window: viewport,
    document: {
      documentElement: { dataset: { luminalHeroFeaturedArrival: initialArrival } },
      querySelector: () => { modelQueries++; throw new Error("No model lookup during bubble flight"); },
    },
    sceneRef: { current: scene }, copyRef: { current: copy }, bubbleRefs: { current: bubbles },
    clamp01: (value) => Math.min(1, Math.max(0, value)),
  });
  const tick = (duration) => {
    for (let t = 0; t < duration; t += 16) {
      now += 16;
      const callbacks = [...frames.values()];
      frames.clear();
      callbacks.forEach((callback) => callback(now));
    }
  };
  const arrival = (value) => listeners.get("luminal:hero-featured-arrival")({ detail: { progress: value } });
  const scroll = (distance) => {
    viewport.scrollY += distance;
    listeners.get("scroll")?.();
  };
  const snapshot = () => ({
    light: Number(sceneStyles.get("--stage-light")),
    copy: Number(copy.style.opacity),
    bubbleOpacity: bubbles.map((bubble) => Number(bubble.style.opacity)),
    bubbleScale: bubbles.map((bubble) => Number(bubble.style.transform.match(/scale\(([^)]+)\)/)[1])),
  });
  return {
    viewport, bubbles, copy, frames, listeners, cleanup, arrival, scroll, tick,
    snapshot, modelQueries: () => modelQueries, geometryMeasurements: () => geometryMeasurements,
  };
}

test("content stays hidden until the actual 3D Hero reaches the trigger", () => {
  const scene = mountScene();
  scene.scroll(1000);
  scene.tick(2200);
  assert.equal(scene.snapshot().light, 0);
  assert.equal(scene.copy.style.visibility, "hidden");
  assert.deepEqual(scene.bubbles.map((bubble) => bubble.style.visibility), ["hidden", "hidden", "hidden"]);

  scene.arrival(0.88);
  scene.tick(1800);
  assert.equal(scene.snapshot().light, 0);
  scene.arrival(0.93);
  scene.tick(1800);
  assert.equal(scene.snapshot().light, 1);
  assert.equal(scene.snapshot().copy, 1);
  assert.deepEqual(scene.bubbles.map((bubble) => bubble.dataset.landed), ["true", "true", "true"]);
  assert.equal(scene.modelQueries(), 0);
  scene.cleanup();
});

test("hysteresis ignores a minor Hero movement and lets the timeline finish autonomously", () => {
  const scene = mountScene();
  scene.arrival(0.94);
  scene.tick(400);
  const halfway = scene.snapshot();
  assert.ok(halfway.light > 0 && halfway.light < 1);
  scene.arrival(0.85); // inside hysteresis band: not a hide trigger
  scene.scroll(-240);
  scene.tick(1500);
  assert.equal(scene.snapshot().light, 1);
  assert.equal(scene.snapshot().copy, 1);
  assert.equal(scene.modelQueries(), 0);
  assert.equal(scene.geometryMeasurements(), 1);
  scene.cleanup();
});

test("retraction begins only when the Hero recedes past the return trigger", () => {
  const scene = mountScene();
  scene.arrival(0.96);
  scene.tick(1800);
  scene.arrival(0.83);
  scene.tick(800);
  assert.equal(scene.snapshot().copy, 1);
  scene.arrival(0.79);
  scene.tick(1120);
  assert.equal(scene.snapshot().light, 0);
  assert.equal(scene.snapshot().copy, 0);
  assert.ok(scene.bubbles.every((bubble) => bubble.style.visibility === "hidden"));
  scene.cleanup();
});

test("reversing a mid-flight bubble is continuous without position or opacity snapping", () => {
  const scene = mountScene();
  scene.arrival(0.95);
  scene.tick(760);
  const forward = scene.snapshot();
  assert.ok(forward.bubbleOpacity[1] > 0);
  scene.arrival(0.78);
  // Event merely changes direction, not the last rendered frame.
  assert.deepEqual(scene.snapshot(), forward);
  scene.tick(64);
  const returning = scene.snapshot();
  assert.ok(returning.light <= forward.light);
  assert.ok(returning.copy <= forward.copy);
  assert.ok(returning.bubbleScale[1] > 0.55);
  scene.arrival(0.95);
  assert.deepEqual(scene.snapshot(), returning);
  scene.tick(1800);
  assert.equal(scene.snapshot().light, 1);
  assert.equal(scene.snapshot().copy, 1);
  scene.cleanup();
  assert.equal(scene.frames.size, 0);
  assert.equal(scene.listeners.size, 0);
});

test("initial mid-page Hero arrival triggers a complete reveal without new scrolling", () => {
  const scene = mountScene("0.9700");
  scene.tick(1900);
  assert.equal(scene.snapshot().light, 1);
  assert.equal(scene.snapshot().copy, 1);
  scene.cleanup();
});

test("bubbles use a fixed Hero-side origin, curved flight, persistent float and reduced-motion support", () => {
  const source = readFileSync("src/features/home/home-archive-burst.tsx", "utf8");
  const css = readFileSync("src/features/home/home-archive-burst.module.css", "utf8");
  const hero = readFileSync("src/features/home/home-immersive-experience.tsx", "utf8");
  assert.match(source, /const originX = rect\.width \* 0\.29/);
  assert.match(source, /const originY = rect\.height \* 0\.5/);
  assert.match(source, /Math\.sin\(arrival \* Math\.PI\)/);
  assert.match(source, /REVEAL_MS = 1550/);
  assert.match(source, /RETRACT_MS = 980/);
  assert.doesNotMatch(source, /window\.addEventListener\("scroll"/);
  assert.match(css, /colorway-soap-float/);
  assert.match(css, /prefers-reduced-motion: reduce/);
  assert.match(hero, /luminal:hero-featured-arrival/);
  assert.match(hero, /state\.xVw \/ featuredDestination\.xVw/);
});
