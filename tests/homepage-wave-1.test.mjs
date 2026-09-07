import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

const read = (path) => readFileSync(path, "utf8");

test("Homepage Wave 1 follows the approved six-part editorial sequence", () => {
  const home = read("src/features/home/home-page.tsx");
  const order = ["revival-hero", "featured-object", "brand-revival", "selected-archive", "made-at-luminal", "commerce-split"];
  order.reduce((previous, marker) => {
    const position = home.indexOf(marker);
    assert.ok(position > previous, `${marker} must follow the prior section`);
    return position;
  }, -1);
  assert.match(home, /<h1 id="hero-title"/);
  assert.equal((home.match(/<h1\b/g) ?? []).length, 1);
  assert.match(home, /content\.hero\.primaryAction/);
  assert.match(home, /content\.hero\.secondaryAction/);
});

test("Wave 1 keeps the route thin and uses a server component feature boundary", () => {
  const route = read("src/app/page.tsx");
  const home = read("src/features/home/home-page.tsx");
  assert.match(route, /<HomePage \/>/);
  assert.doesNotMatch(route + home, /["']use client["']/);
  assert.doesNotMatch(home, /supabase|fetch\(|useEffect|useState|setInterval|requestAnimationFrame/i);
});

test("Wave 1 preserves product-media and commerce trust boundaries", () => {
  const home = read("src/features/home/home-page.tsx");
  const content = read("src/content/homepage.ts");
  const plan = read("specs/home/homepage-wave-1-technical-plan.md");
  assert.match(home, /approved product media pending sync/i);
  assert.doesNotMatch(home + content, /drive\.google|googleusercontent|\.stl|\.ztl|buy now|checkout|add to cart/i);
  assert.match(plan, /No Auth, cart, merge, order, payment, inventory, raffle, Supabase schema, RLS, runtime flag/);
});

test("Wave 1 CSS carries responsive and reduced-motion safeguards", () => {
  const css = read("src/app/globals.css");
  assert.match(css, /@keyframes wave-object-reveal/);
  assert.match(css, /@media \(max-width: 800px\)[\s\S]*\.revival-hero-inner/);
  assert.match(css, /@media \(prefers-reduced-motion: reduce\)[\s\S]*\.hero-object-stage \{ animation: none;/);
});
