import assert from "node:assert/strict";
import { readFileSync, readdirSync, statSync } from "node:fs";
import { join } from "node:path";
import test from "node:test";

const read = (path) => readFileSync(path, "utf8");
const walk = (directory) => readdirSync(directory).flatMap((name) => { const path = join(directory, name); return statSync(path).isDirectory() ? walk(path) : [path]; });

test("homepage has one main landmark, semantic sections, and typed fixture cards", () => {
  const page = read("src/app/page.tsx");
  assert.equal((page.match(/<main/g) ?? []).length, 1);
  assert.match(page, /<h1/);
  assert.match(page, /featuredCreations\.map/);
  assert.match(page, /commissionSteps\.map/);
});

test("header and mobile navigation contain only implemented fragment links", () => {
  const navigation = read("src/components/layout/navigation.ts");
  for (const target of ["#creations", "#gallery", "#commission", "#raffle", "#about"]) assert.match(navigation, new RegExp(target));
  const page = read("src/app/page.tsx");
  for (const id of ["creations", "gallery", "commission", "raffle", "about", "cart"]) assert.match(page + read("src/components/layout/header.tsx"), new RegExp(`id=\\"${id}\\"`));
  assert.match(read("src/components/layout/mobile-navigation.tsx"), /aria-expanded/);
});

test("design tokens have one source and reduced motion is supported", () => {
  const cssFiles = walk("src").filter((path) => path.endsWith(".css"));
  assert.deepEqual(cssFiles, ["src/app/globals.css"]);
  assert.match(read(cssFiles[0]), /prefers-reduced-motion/);
});

test("governance artifacts and roadmap status schema exist", () => {
  assert.match(read("docs/REPOSITORY_AUDIT.md"), /Suspected duplicate\/conflict/);
  const roadmap = read("docs/ECOMMERCE_IMPLEMENTATION_ROADMAP.md");
  for (const status of ["NOT_STARTED", "IN_PROGRESS", "CODE_COMPLETE", "MERGED", "DEPLOYED", "OPERATOR_RETEST_REQUIRED", "LIVE_APPROVAL_REQUIRED", "BLOCKED", "COMPLETED"]) assert.match(roadmap, new RegExp(status));
});

test("AGENTS commands match package scripts and skills have unique names and triggers", () => {
  const scripts = Object.keys(JSON.parse(read("package.json")).scripts);
  const guide = read("AGENTS.md");
  for (const command of scripts) assert.match(guide, new RegExp(command === "test" ? "npm test" : `npm run ${command}`));
  const skills = walk(".agents/skills").filter((path) => path.endsWith("SKILL.md")).map((path) => read(path).match(/^name:\s*(.+)$/m)?.[1]).filter(Boolean);
  assert.equal(new Set(skills).size, skills.length);
  for (const path of ["storefront-ui.md", "repository-cleanup.md", "pr-delivery.md"]) assert.match(read(`.agents/skills/luminal-commerce/references/${path}`), /\*\*Trigger:\*\*/);
});

test("foundation introduces no ERP production instructions or commerce schemas", () => {
  const source = walk("src").filter((path) => /\.(ts|tsx)$/.test(path)).map(read).join("\n");
  assert.doesNotMatch(source, /create table|service_role|SUPABASE_DB_PASSWORD/i);
  assert.doesNotMatch(source, /interface\s+(Product|Order|Payment|Inventory|Customer)\b/);
  assert.doesNotMatch(read("AGENTS.md"), /execute production SQL automatically/i);
});
