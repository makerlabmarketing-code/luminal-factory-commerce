import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { stripTypeScriptTypes } from "node:module";
import vm from "node:vm";
import test from "node:test";

function mountStack() {
  const source = readFileSync("src/features/home/made-at-luminal-stack.tsx", "utf8");
  const effect = source.slice(source.indexOf("    const desktop ="), source.indexOf("  }, [steps]);"));
  const listeners = new Map();
  const frames = new Map();
  const properties = new Map();
  let bottom = 1100;
  let compact = false;
  let reduced = false;
  let collapsed = [false, false, false, false];
  let frameId = 0;
  const media = (matches) => ({
    get matches() { return matches(); },
    addEventListener: () => {},
    removeEventListener: () => {},
  });
  const header = { style: { removeProperty(name) { delete this[name]; } }, getBoundingClientRect: () => ({ height: 140 }) };
  const list = {
    style: { setProperty: (name, value) => properties.set(name, value), removeProperty: (name) => properties.delete(name) },
    getBoundingClientRect: () => ({ bottom }),
  };
  const top = (index) => {
    const ceiling = Number.parseFloat(properties.get("--process-stack-top") ?? "232") + index * 37.6;
    const release = Number.parseFloat(properties.get("--process-stack-release") ?? "0");
    const naturalTop = bottom - 600 - (3 - index) * 860;
    // Native sticky: natural flow, individual ceiling, shared parent bottom.
    return Math.min(Math.max(naturalTop, ceiling - release), bottom - 600);
  };
  const cards = [0, 1, 2, 3].map((index) => ({ getBoundingClientRect: () => ({ top: top(index), height: 600 }) }));
  const code = stripTypeScriptTypes("(() => {" + effect + "})()", { mode: "strip" });
  const cleanup = vm.runInNewContext(code, {
    window: {
      matchMedia: (query) => query.includes("min-width") ? media(() => !compact) : media(() => reduced),
      requestAnimationFrame: (fn) => { frames.set(++frameId, fn); return frameId; },
      cancelAnimationFrame: (id) => frames.delete(id),
      addEventListener: (name, fn) => listeners.set(name, fn),
      removeEventListener: (name) => listeners.delete(name),
    },
    document: { documentElement: {}, querySelector: () => header },
    getComputedStyle: () => ({ fontSize: "16px" }),
    HEADER_STICKY_TOP_REM: 5, HEADER_STACK_GAP_REM: .75, STICKY_STEP_REM: 2.35,
    DESKTOP_MEDIA: "(min-width: 768px)", REDUCED_MOTION_MEDIA: "(prefers-reduced-motion: reduce)",
    listRef: { current: list }, itemRefs: { current: cards }, frameRef: { current: null },
    steps: cards,
    statesEqual: (left, right) => left.every((value, index) => value === right[index]),
    setCollapsed: (fn) => { collapsed = fn(collapsed); },
  });
  const flush = () => { const pending = [...frames.values()]; frames.clear(); pending.forEach((fn) => fn()); };
  const scrollToBottom = (value) => { bottom = value; listeners.get("scroll")(); flush(); };
  flush();
  return {
    scrollToBottom, top, header, properties, cleanup, frames, listeners,
    collapsed: () => Array.from(collapsed),
    fallback: (kind) => { compact = kind === "mobile"; reduced = kind === "reduce"; listeners.get("resize")(); flush(); },
  };
}

test("Finish preserves all three title rails throughout exit and reverses without drift", () => {
  const stack = mountStack();
  for (const bottom of [1100, 945, 900, 760, 620, 400, 620, 900, 1100]) {
    stack.scrollToBottom(bottom);
    for (let index = 0; index < 3; index++) {
      assert.ok(stack.top(index + 1) - stack.top(index) >= 37.599, "Every previous title remains above the next folder");
    }
    const release = Number.parseFloat(stack.properties.get("--process-stack-release"));
    assert.ok(Math.abs(release - Math.max(0, 944.8 - bottom)) < .001);
    const headerY = stack.header.style.translate ? Number.parseFloat(stack.header.style.translate.split(" ")[1]) : 0;
    assert.ok(headerY <= 0, "Heading leaves upward with the cards");
    assert.ok(Math.abs(headerY + release) <= .5);
    assert.deepEqual(stack.collapsed(), [true, true, bottom <= 946.8, false]);
  }
  stack.cleanup();
  assert.equal(stack.frames.size, 0);
  assert.equal(stack.listeners.size, 0);
});

test("Mobile and reduced motion remove shared sticky offsets", () => {
  for (const kind of ["mobile", "reduce"]) {
    const stack = mountStack();
    stack.scrollToBottom(700);
    stack.fallback(kind);
    assert.equal(stack.properties.has("--process-stack-top"), false);
    assert.equal(stack.properties.has("--process-stack-release"), false);
    assert.equal(stack.header.style.translate, undefined);
    assert.deepEqual(stack.collapsed(), [false, false, false, false]);
    stack.cleanup();
  }
});
