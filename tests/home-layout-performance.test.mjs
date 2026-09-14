import assert from "node:assert/strict";
import fs from "node:fs";
import test from "node:test";

const home = fs.readFileSync("src/features/home/home-page.tsx", "utf8");
const heroStage = fs.readFileSync("src/features/home/hero-object-stage.tsx", "utf8");
const header = fs.readFileSync("src/components/layout/header.tsx", "utf8");
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

test("decorative hero branding does not compete as a priority resource", () => {
  assert.match(home, /luminal-factory-logo-primary\.png[\s\S]*loading="lazy"[\s\S]*quality=\{62\}/);
  assert.doesNotMatch(home, /luminal-factory-logo-primary\.png[\s\S]{0,220}\bpriority\b/);
});

test("small header branding keeps source geometry but requests only its rendered size", () => {
  assert.match(header, /width=\{4000\}/);
  assert.match(header, /height=\{4000\}/);
  assert.match(header, /sizes="60px"/);
  assert.match(header, /loading="eager"/);
  assert.doesNotMatch(header, /\bpriority\b|\bpreload\b/);
});

test("safe below-fold Homepage sections opt into rendering deferral", () => {
  const matches = home.match(/\[content-visibility:auto\]/g) ?? [];
  assert.ok(matches.length >= 3);
  assert.match(home, /\[contain-intrinsic-size:auto_1500px\]/);
});

test("Hero auto-rotation pauses offscreen and decorative glow stays static", () => {
  assert.match(heroStage, /visibilityObserver = new IntersectionObserver/);
  assert.match(heroStage, /viewer\.removeAttribute\("auto-rotate"\)/);
  assert.match(heroStage, /intersectionRatio > 0\.05/);
  assert.match(heroStage, /rounded-full opacity-40 blur-3xl/);
});

test("design and performance companion skills are installed locally", () => {
  for (const path of companionSkills) assert.equal(fs.existsSync(path), true, path);
});
