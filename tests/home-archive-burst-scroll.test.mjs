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
  let timerId = 0;
  const timers = new Map();
  const viewport = {
    innerHeight: 1000,
    scrollY: 1000,
    matchMedia: () => ({ matches: false }),
    requestAnimationFrame: (callback) => { frames.set(++frameId, callback); return frameId; },
    cancelAnimationFrame: (id) => frames.delete(id),
    setTimeout: (callback) => { timers.set(++timerId, callback); return timerId; },
    clearTimeout: (id) => timers.delete(id),
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
  const bubbles = [0, 1, 2].map((index) => {
    const clickListeners = new Set();
    return {
      offsetLeft: 600 + index * 200, offsetTop: 100,
      offsetWidth: 200, offsetHeight: 200,
      style: { setProperty: () => {} }, dataset: {}, tabIndex: -1,
      addEventListener: (type, fn) => { if (type === "click") clickListeners.add(fn); },
      removeEventListener: (type, fn) => { if (type === "click") clickListeners.delete(fn); },
      click: function () { for (const fn of clickListeners) fn({ currentTarget: this }); },
      clickListenerCount: () => clickListeners.size,
    };
  });
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
  const flushTimers = () => {
    const pending = [...timers.values()];
    timers.clear();
    pending.forEach((callback) => callback());
  };
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
    viewport, bubbles, copy, frames, listeners, cleanup, arrival, scroll, tick, flushTimers, timers,
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
  scene.arrival(0.91); // inside the narrower hysteresis band: not a hide trigger
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
  scene.arrival(0.91);
  scene.tick(800);
  assert.equal(scene.snapshot().copy, 1);
  scene.arrival(0.895); // reverse begins as soon as Hero leaves its featured pose
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
  scene.arrival(0.895);
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

test("clicking a landed bubble pops only that colorway, then reforms from the shared Hero-side origin", () => {
  const scene = mountScene();
  scene.arrival(0.96);
  scene.tick(1900);
  assert.equal(scene.bubbles[0].clickListenerCount(), 1);
  scene.bubbles[0].click();
  assert.equal(scene.bubbles[0].dataset.popPhase, "burst");
  assert.equal(scene.bubbles[1].dataset.popPhase, undefined);
  assert.equal(scene.timers.size, 1);
  scene.bubbles[0].click();
  assert.equal(scene.timers.size, 1, "repeated clicks cannot create duplicate timers");
  scene.flushTimers();
  assert.equal(scene.bubbles[0].dataset.popPhase, "reform");
  scene.flushTimers();
  assert.equal(scene.bubbles[0].dataset.popPhase, undefined);
  scene.cleanup();
  assert.equal(scene.bubbles[0].clickListenerCount(), 0);
});

test("scroll retraction cancels in-flight POP timers so hidden bubbles do not reappear", () => {
  const scene = mountScene();
  scene.arrival(0.96);
  scene.tick(1900);
  scene.bubbles[2].click();
  assert.equal(scene.bubbles[2].dataset.popPhase, "burst");
  scene.arrival(0.78);
  assert.equal(scene.bubbles[2].dataset.popPhase, undefined);
  assert.equal(scene.timers.size, 0);
  scene.tick(1050);
  assert.equal(scene.bubbles[2].style.visibility, "hidden");
  scene.cleanup();
});

test("POP uses CSS-only particles, honors reduced motion, and leaves archive navigation in the copy", () => {
  const source = readFileSync("src/features/home/home-archive-burst.tsx", "utf8");
  const css = readFileSync("src/features/home/home-archive-burst.module.css", "utf8");
  assert.match(source, /aria-label=\{`Làm vỡ bong bóng/);
  assert.match(source, /Array\.from\(\{ length: 8 \}/);
  assert.match(source, /Explore the full archive/);
  assert.match(css, /bubble-pop-collapse/);
  assert.match(css, /bubble-pop-spark/);
  assert.match(css, /bubble-pop-reform/);
  assert.match(css, /\.bubble\[data-landed="true"\]:not\(\[data-pop-phase\]\)/);
  assert.match(css, /prefers-reduced-motion: reduce/);
});

test("Hero reverse moves each bubble back toward its original launch point before disappearing", () => {
  const scene = mountScene();
  scene.arrival(0.95);
  scene.tick(1850);
  const bubble = scene.bubbles[1];
  const landedTransform = bubble.style.transform;
  assert.equal(bubble.dataset.landed, "true");

  // A small backward movement past the return threshold should start the
  // autonomous reverse timeline without immediately hiding the bubble.
  scene.arrival(0.895);
  scene.tick(420);
  assert.notEqual(bubble.style.transform, landedTransform);
  assert.equal(bubble.style.visibility, "visible");
  assert.equal(bubble.dataset.landed, "false");

  scene.tick(820);
  assert.equal(bubble.style.visibility, "hidden");
  assert.equal(bubble.style.opacity, "0.000");
  scene.cleanup();
});
