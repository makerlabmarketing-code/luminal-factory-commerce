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

test('home waits for a bounded intro, with no-JS and mobile escape paths', () => {
  const copy = read('src/features/home/hero-copy-motion.tsx');
  const immersive = read('src/features/home/home-immersive-experience.tsx');
  const styles = read('src/features/home/home-immersive-experience.module.css');
  assert.doesNotMatch(copy, /filter:|supporting\.forEach/);
  assert.match(immersive, /if \(objectSettled.current\) dockBrand\(\)/);
  assert.match(immersive, /phone.matches/);
  assert.match(immersive, /root.style.overflow = "hidden"/);
  assert.match(immersive, /root.style.overflow = previousOverflow/);
  assert.match(immersive, /stage=\{waiting \? "waiting" : "revealed"\}/);
  assert.match(styles, /introSafetyExit 1500ms/);
  assert.match(immersive, /<noscript><style>/);
});
