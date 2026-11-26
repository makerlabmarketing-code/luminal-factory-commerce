import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import test from 'node:test';
import vm from 'node:vm';
import ts from 'typescript';

const read = (path) => readFileSync(path, 'utf8');
const stage = read('src/features/home/hero-object-stage.tsx');

// Run the actual component's effects, not a second copy of its capability rule.
function mountPhoneStage(width) {
  const effects = [];
  const refs = [];
  let webglProbes = 0;
  const cleanups = [];
  const createRef = (initial) => {
    const ref = { current: initial === null && refs.length < 4 ? { style: {}, dataset: {} } : initial };
    refs.push(ref);
    return ref;
  };
  const react = {
    useState: () => [0, () => {}],
    useEffect: (effect) => effects.push(effect),
    useRef: createRef,
  };
  const fixtureModule = { exports: {} };
  const source = ts.transpileModule(stage, { compilerOptions: { module: ts.ModuleKind.CommonJS, jsx: ts.JsxEmit.ReactJSX } }).outputText;
  vm.runInNewContext(source, {
    module: fixtureModule, exports: fixtureModule.exports,
    require: (name) => {
      if (name === 'react') return react;
      if (name === 'react/jsx-runtime') return { jsx: () => null, jsxs: () => null };
      if (name === '@/lib/i18n/client') return { useTranslator: () => (value) => value };
      return {};
    },
    window: { matchMedia: (query) => ({ matches: query.includes('max-width: 699px') ? width <= 699 : false, addEventListener() {}, removeEventListener() {} }) },
    navigator: {},
    document: { createElement() { webglProbes++; throw new Error('Phones must not probe WebGL'); } },
  });
  fixtureModule.exports.HeroObjectStage({ media: { availability: 'available', alt: 'Meowhe' }, presentation: {}, preload: true, allowTouch3d: true });
  for (const effect of effects) { const cleanup = effect(); if (cleanup) cleanups.push(cleanup); }
  for (const cleanup of cleanups) cleanup();
  return { mode: refs[0].current.dataset.heroMode, webglProbes, mountDisplay: refs[1].current.style.display };
}

for (const width of [320, 390, 699]) {
  test(`phone ${width}px skips WebGL and runtime even when callers request eager touch 3D`, () => {
    const result = mountPhoneStage(width);
    assert.equal(result.mode, 'disabled-mobile');
    assert.equal(result.webglProbes, 0);
    assert.equal(result.mountDisplay, 'none');
  });
}

test('homepage renders usable copy immediately and reveals the model from its first frame', () => {
  const immersive = read('src/features/home/home-immersive-experience.tsx');
  const home = read('src/features/home/home-page.tsx');
  const styles = read('src/features/home/home-immersive-experience.module.css');
  assert.doesNotMatch(immersive, /style\.overflow|\.inert|data-home-brand-intro|sessionStorage/);
  assert.match(immersive, /HERO_INTRO_MS = 1600/);
  assert.match(immersive, /HERO_SCROLL_HANDOFF_MS = 200/);
  assert.match(immersive, /finishFrom = \{ start: performance\.now\(\), age: introAge \}/);
  assert.match(immersive, /scale \*= 1 - 0\.04 \* lift/);
  assert.match(immersive, /y \+= 20 \* lift/);
  assert.match(immersive, /onFirstFrame=\{onFirstFrame\}/);
  assert.match(immersive, /delay: 220 \+ index \* 100/);
  assert.match(home, /<h1 id="hero-title" data-hero-entrance>\{content.hero.title\}/);
  assert.match(styles, /animation: staticHeroAppear 220ms/);
});

function mountDesktopMotion(scrollY = 0) {
  let afterMount;
  let clock = 0;
  const raf = new Map();
  const listeners = new Map();
  const makeStyle = () => ({
    setProperty(name, value) { this[name] = value; },
    getPropertyValue(name) { return this[name] ?? ''; },
    removeProperty(name) { delete this[name]; },
  });
  const layer = {
    offsetLeft: 650, offsetWidth: 700, offsetHeight: 700, style: makeStyle(),
    getBoundingClientRect: () => ({ top: 70, height: 700 }),
  };
  const light = { style: makeStyle() };
  const frameQueue = { window: {
    scrollY, innerWidth: 1348, innerHeight: 900,
    matchMedia: () => ({ matches: false, addEventListener() {}, removeEventListener() {} }),
    requestAnimationFrame(callback) { const id = Symbol(); raf.set(id, callback); return id; },
    cancelAnimationFrame: (id) => raf.delete(id),
    addEventListener: (name, callback) => listeners.set(name, callback),
    removeEventListener: (name) => listeners.delete(name),
    dispatchEvent() {},
  } };
  const sections = {
    hero: { querySelector: () => light, querySelectorAll: () => [], getBoundingClientRect: () => ({ top: -frameQueue.window.scrollY, height: 900 }) },
    featured: { getBoundingClientRect: () => ({ top: 900 - frameQueue.window.scrollY, bottom: 2100 - frameQueue.window.scrollY, height: 1200 }) },
  };
  const jsx = (type, props) => ({ type, props });
  const stageName = Symbol();
  const fixtureModule = { exports: {} };
  const source = ts.transpileModule(read('src/features/home/home-immersive-experience.tsx'), { compilerOptions: { module: ts.ModuleKind.CommonJS, jsx: ts.JsxEmit.ReactJSX } }).outputText;
  vm.runInNewContext(source, {
    module: fixtureModule, exports: fixtureModule.exports, ...frameQueue,
    location: { hash: '' }, performance: { now: () => clock }, CustomEvent: class {},
    document: {
      documentElement: { dataset: {} },
      querySelector: (selector) => selector.includes('"hero"') ? sections.hero : selector.includes('"featured"') ? sections.featured : null,
    },
    require: (name) => {
      if (name === 'react') return { useCallback: fn => fn, useEffect: fn => { afterMount = fn; }, useRef: initial => ({ current: initial }) };
      if (name === 'react/jsx-runtime') return { jsx, jsxs: jsx };
      if (name === './hero-object-stage') return { HeroObjectStage: stageName };
      if (name.endsWith('.css')) return { default: {} };
      return {};
    },
  });
  const tree = fixtureModule.exports.HomeImmersiveExperience({ enabled: true, media: {}, presentation: { camera: {} } });
  const model = tree.props.children[1].props.children;
  model.props.ref.current = layer;
  const clean = afterMount();
  return {
    layer, light,
    ready: model.props.children.props.onFirstFrame,
    frame(time) { clock = time; const work = [...raf.values()]; raf.clear(); work.forEach(fn => fn(time)); },
    scroll(y) { frameQueue.window.scrollY = y; listeners.get('scroll')(); },
    clean,
  };
}

test('desktop model starts centered, then exits the intro smoothly at its current scroll position', () => {
  const model = mountDesktopMotion();
  model.frame(0);
  assert.match(model.layer.style.transform, /translate3d\(-326\.00px, -36\.00px.*scale\(1\.0000\)/);
  model.ready();
  model.frame(0);
  assert.match(model.layer.style.transform, /-16\.00px.*scale\(0\.9600\)/);
  assert.equal(model.layer.style.opacity, '0.0000');
  model.frame(420);
  assert.ok(Number(model.layer.style.opacity) > 0);
  model.scroll(300);
  model.frame(420);
  const duringHandoff = model.layer.style.transform;
  model.frame(520);
  assert.notEqual(model.layer.style.transform, duringHandoff);
  for (let time = 620; time <= 1620; time += 16) model.frame(time);
  assert.equal(model.layer.style.opacity, '1.0000');
  model.scroll(0);
  for (let time = 1640; time < 2600; time += 16) model.frame(time);
  assert.match(model.layer.style.transform, /translate3d\(-326\.00px, -36\.00px.*scale\(1\.0000\)/);
  model.clean();
});

test('a first frame after restored scroll fades in without restarting the spatial intro', () => {
  const model = mountDesktopMotion(300);
  model.frame(0);
  const restored = model.layer.style.transform;
  model.ready();
  model.frame(0);
  assert.equal(model.layer.style.transform, restored);
  assert.equal(model.layer.style.opacity, '0.0000');
  model.frame(200);
  assert.equal(model.layer.style.transform, restored);
  assert.equal(model.layer.style.opacity, '1.0000');
  model.clean();
});
