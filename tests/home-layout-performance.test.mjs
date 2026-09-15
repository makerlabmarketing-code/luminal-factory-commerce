import assert from "node:assert/strict";
import fs from "node:fs";
import test from "node:test";

const home = fs.readFileSync("src/features/home/home-page.tsx", "utf8");
const heroStage = fs.readFileSync("src/features/home/hero-object-stage.tsx", "utf8");
const header = fs.readFileSync("src/components/layout/header.tsx", "utf8");
const footer = fs.readFileSync("src/components/layout/footer.tsx", "utf8");
const media = fs.readFileSync("src/content/homepage-media.ts", "utf8");
const layoutPlan = fs.readFileSync("specs/homepage-layout-performance-pass.md", "utf8");

const companionSkills = [
  ".agents/skills/frontend-design/SKILL.md",
  ".agents/skills/design-taste-frontend/SKILL.md",
  ".agents/skills/vercel-react-best-practices/SKILL.md",
];

test("Homepage visual pass keeps the object dominant without adding a runtime dependency", () => {
  assert.match(home, /lg:!grid-cols-\[minmax\(0,\.72fr\)_minmax\(28rem,1\.28fr\)\]/);
  assert.match(home, /lg:-mr-\[min\(7vw,7rem\)\]/);
  assert.match(layoutPlan, /Do not add Three\.js \/ R3F yet/);
});

test("legacy decorative Hero watermark stays out of the Homepage", () => {
  assert.doesNotMatch(home, /hero-crystal-mark/);
  assert.doesNotMatch(home, /\/brand\/luminal-factory-logo-primary\.png/);
});

test("small header branding keeps source geometry without competing with the product Hero preload", () => {
  assert.match(header, /width=\{4000\}/);
  assert.match(header, /height=\{4000\}/);
  assert.match(header, /sizes="60px"/);
  assert.doesNotMatch(header, /loading="eager"|\bpriority\b|\bpreload\b/);
});

test("footer branding declares its rendered width instead of requesting an oversized source", () => {
  assert.match(footer, /src="\/brand\/luminal-factory-logo-primary\.png"/);
  assert.match(footer, /sizes="72px"/);
  assert.doesNotMatch(footer, /loading="eager"|\bpriority\b|\bpreload\b/);
});

test("Homepage product media sizes follow the asymmetric editorial grids", () => {
  assert.match(media, /featured:[\s\S]*?sizes: "\(max-width: 800px\) calc\(100vw - 2rem\), \(max-width: 1200px\) 63vw, 930px"/);
  assert.equal((media.match(/\(max-width: 1440px\) 34vw, 500px/g) ?? []).length, 2);
  assert.equal((media.match(/\(max-width: 1440px\) 27vw, 390px/g) ?? []).length, 1);
  assert.match(media, /archive-meowhe\.webp[\s\S]*?objectPosition: "50% 48%"/);
  assert.match(media, /archive-mono-meowhe\.webp[\s\S]*?objectPosition: "50% 64%"/);
  assert.match(media, /archive-mictlan\.webp[\s\S]*?objectPosition: "50% 50%"/);
});

test("safe below-fold Homepage sections opt into rendering deferral", () => {
  const matches = home.match(/\[content-visibility:auto\]/g) ?? [];
  assert.ok(matches.length >= 3);
  assert.match(home, /\[contain-intrinsic-size:auto_1500px\]/);
});

test("Hero heavy 3D stays an idle desktop enhancement while ambient and reactive light stay separated", () => {
  assert.match(heroStage, /requestIdleCallback/);
  assert.match(heroStage, /poster-coarse-pointer/);
  assert.match(heroStage, /poster-constrained-network/);
  assert.match(heroStage, /rounded-full opacity-55 blur-3xl/);
  assert.match(heroStage, /reactiveLightRef/);
  assert.match(heroStage, /radial-gradient\(circle at \$\{xPercent\}% \$\{yPercent\}%/);
  assert.doesNotMatch(heroStage, /@react-three|from "three"/);
});

test("design and performance companion skills are installed locally", () => {
  for (const path of companionSkills) assert.equal(fs.existsSync(path), true, path);
});