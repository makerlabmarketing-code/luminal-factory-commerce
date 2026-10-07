import assert from 'node:assert/strict';
import test from 'node:test';
import { readFileSync } from 'node:fs';
import { createRequire } from 'node:module';
import ts from 'typescript';
const require = createRequire(import.meta.url);

test('spotlight scopes coordinates, ignores touch/reduced motion and cancels pending work on leave/unmount', () => {
  const effects = []; const frames = new Map(); const cancelled = [];
  let sequence = 0;
  const query = { matches: false, addEventListener: (_name, fn) => { query.change = fn; }, removeEventListener: (_name, fn) => { assert.equal(fn, query.change); } };
  const saved = { window: global.window, requestAnimationFrame: global.requestAnimationFrame, cancelAnimationFrame: global.cancelAnimationFrame };
  try {
    global.window = { matchMedia: () => query };
    global.requestAnimationFrame = fn => { frames.set(++sequence, fn); return sequence; };
    global.cancelAnimationFrame = id => { cancelled.push(id); frames.delete(id); };
    const mod = { exports: {} };
    const code = ts.transpileModule(readFileSync('src/components/ui/spotlight-card.tsx', 'utf8'), { compilerOptions: { module: ts.ModuleKind.CommonJS, jsx: ts.JsxEmit.ReactJSX } }).outputText;
    new Function('require', 'module', 'exports', code)(name => {
      if (name === 'react') return { useRef: initial => ({ current: initial }), useEffect: fn => effects.push(fn) };
      if (name === '@/lib/utils') return { cn: (...args) => args.filter(Boolean).join(' ') };
      if (name.endsWith('.css')) return { default: { card: 'card', content: 'content' } };
      return require(name);
    }, mod, mod.exports);
    const element = mod.exports.GlowCard({ width: 320, height: 'auto', customSize: true, children: 'Luminal' });
    const properties = {}; const card = { dataset: {}, style: { setProperty: (key, value) => { properties[key] = value; } }, removeAttribute: () => { delete card.dataset.active; } };
    element.props.ref.current = card;
    const cleanup = effects[0]();
    const move = (pointerType, x, y) => element.props.onPointerMove({ pointerType, clientX: x, clientY: y, currentTarget: { getBoundingClientRect: () => ({ left: 100, top: 200 }) } });
    move('mouse', 120, 235); move('mouse', 130, 240);
    assert.equal(frames.size, 1); for (const fn of frames.values()) fn(); frames.clear();
    assert.equal(properties['--glow-x'], '30px'); assert.equal(properties['--glow-y'], '40px');
    assert.equal(card.dataset.active, 'true');
    move('touch', 400, 400); assert.equal(frames.size, 0);
    move('mouse', 150, 250); element.props.onPointerLeave(); assert.equal(frames.size, 0); assert.equal(card.dataset.active, undefined);
    query.matches = true; query.change(); move('mouse', 300, 300); assert.equal(frames.size, 0);
    query.matches = false; query.change(); move('mouse', 300, 300); cleanup(); assert.equal(frames.size, 0);
    assert.equal(element.props.style.width, 320); assert.equal(element.props.style.height, 'auto'); assert.ok(cancelled.length > 0);
  } finally { Object.assign(global, saved); }
});

test('carousel initialization errors and unsupported WebGL report fallback without starting listeners', () => {
  for (const mode of ['throw', 'webgl1']) {
    const effects = []; let errors = 0; let disposed = false;
    const mod = { exports: {} }; const refs = [];
    const code = ts.transpileModule(readFileSync('src/components/ui/flex-carousel.jsx', 'utf8'), { compilerOptions: { module: ts.ModuleKind.CommonJS, jsx: ts.JsxEmit.ReactJSX, allowJs: true } }).outputText;
    new Function('require', 'module', 'exports', code)(name => {
      if (name === 'react') return { useRef: initial => { const ref = { current: initial }; refs.push(ref); return ref; }, useEffect: fn => effects.push(fn), useState: initial => [initial, () => {}] };
      if (name === 'ogl') return { Renderer: class { constructor() { if (mode === 'throw') throw Error('unavailable'); this.isWebgl2 = false; this.gl = { getExtension: () => ({ loseContext: () => { disposed = true; } }) }; } } };
      if (name.endsWith('.css')) return {};
      return require(name);
    }, mod, mod.exports);
    const oldWindow = global.window; global.window = { devicePixelRatio: 1 };
    try {
      mod.exports.default({ items: [{ src: '/real.webp', alt: 'Meowhe' }], onError: () => errors++ });
      refs[0].current = {};
      for (const effect of effects) effect();
      assert.equal(errors, 1); assert.equal(disposed, mode === 'webgl1');
    } finally { global.window = oldWindow; }
  }
});
