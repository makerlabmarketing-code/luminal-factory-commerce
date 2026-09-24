import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

const read = (path) => readFileSync(path, "utf8");

test("Homepage follows the approved editorial sequence with the colorway gallery", () => {
  const home = read("src/features/home/home-page.tsx");
  const order = [
    '<section className="revival-hero"',
    'aria-labelledby="featured-title"',
    '<section className="brand-revival',
    '<section className="selected-archive',
    '<section className="home-gallery',
    '<section className="made-at-luminal',
    '<section className="commerce-split',
  ];
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

test("Homepage gallery uses a compact, motion-safe Drift Wall with a touch fallback", () => {
  const home = read("src/features/home/home-page.tsx");
  const gallery = read("src/features/home/home-drift-wall.tsx");
  const galleryCss = read("src/features/home/home-drift-wall.module.css");
  const media = read("src/content/homepage-media.ts");
  const galleryMedia = media.slice(media.indexOf("gallery: ["));

  assert.match(home, /<HomeDriftWall items={homePageMedia\.gallery}/);
  assert.equal((galleryMedia.match(/colorway: "Lolipop"/g) ?? []).length, 3);
  assert.equal((galleryMedia.match(/colorway: "Mictlán"/g) ?? []).length, 3);
  assert.equal((galleryMedia.match(/colorway: "Mono"/g) ?? []).length, 3);
  assert.doesNotMatch(media + gallery, /drive\.google|googleusercontent/);
  assert.match(gallery, /prefers-reduced-motion: reduce/);
  assert.match(gallery, /IntersectionObserver/);
  assert.match(gallery, /DRIFT_COLUMN_COUNT = 5/);
  assert.match(gallery, /DRIFT_ITEMS_PER_COLUMN = 3/);
  assert.match(gallery, /DRIFT_POINTER_RANGE_PX = 12/);
  assert.match(gallery, /data-gallery-mode={supportsDrift \? "drift-wall" : "compact-strip"}/);
  assert.match(gallery, /alt={item\.alt}/);
  assert.match(gallery, /onClick={\(\) => setSelectedItem\(item\)}/);
  assert.match(gallery, /onPointerDown={\(event\) =>/);
  assert.match(gallery, /event\.button === 0/);
  assert.match(gallery, /role="dialog"/);
  assert.match(galleryCss, /perspective: 1200px/);
  assert.match(galleryCss, /\.wall \{[\s\S]*pointer-events: none/);
  assert.match(galleryCss, /\.tile \{[\s\S]*pointer-events: auto/);
  assert.match(galleryCss, /height: clamp\(28rem, 43vw, 34rem\)/);
  assert.match(galleryCss, /@keyframes drift-up/);
  assert.match(galleryCss, /\.column:hover \.track,[\s\S]*\.column:focus-within \.track[\s\S]*animation-play-state: paused/);
  assert.doesNotMatch(galleryCss, /\.viewport:hover \.track/);
  assert.match(galleryCss, /scroll-snap-type: x mandatory/);
  assert.match(galleryCss, /@media \(max-width: 768px\)/);
  assert.match(galleryCss, /@media \(prefers-reduced-motion: reduce\)/);
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

test("Homepage media pass uses real archive names and a non-requesting pending asset contract", () => {
  const home = read("src/features/home/home-page.tsx");
  const content = read("src/content/homepage.ts");
  const media = read("src/content/homepage-media.ts");
  assert.match(content, /Mono Meowhe/);
  assert.match(content, /Meowhe/);
  assert.match(content, /Mictlán/);
  assert.match(content, /Historical Lazy Factory archive · 2023/);
  assert.doesNotMatch(content, /Nocturne Study|Soft Signal|Afterglow|Quiet Form/);
  for (const path of ["featured.webp", "archive-meowhe.webp", "archive-mono-meowhe.webp"]) {
    assert.match(media, new RegExp(`/images/home/${path}`));
  }
  assert.match(media, /hero:[\s\S]*src: "\/images\/home\/archive-meowhe\.webp"[\s\S]*alt: "Lolipop/);
  assert.match(media, /mictlan:[\s\S]*src: "\/images\/home\/gallery\/mictlan-keyboard\.webp"/);
  assert.match(media, /availability: "pending"/);
  assert.match(home, /media\.availability === "available"/);
  assert.match(home, /<Image/);
  assert.match(home, /sizes=/);
  assert.match(home, /objectPosition/);
});

test("Homepage Hero copy represents the Luminal brand rather than one fallback object", () => {
  const content = read("src/content/homepage.ts");
  assert.match(content, /title: "Artisan objects, shaped by light\."/);
  assert.match(content, /featured:[\s\S]*title: "Mono Meowhe"/);
  assert.doesNotMatch(content, /title: "Mono Meowhe, shaped by light\."/);
});

test("Wave 1 CSS carries responsive and reduced-motion safeguards", () => {
  const css = read("src/app/globals.css");
  assert.match(css, /@keyframes wave-object-reveal/);
  assert.match(css, /@media \(max-width: 800px\)[\s\S]*\.revival-hero-inner/);
  assert.match(css, /@media \(prefers-reduced-motion: reduce\)[\s\S]*\.hero-object-stage \{ animation: none;/);
});
