import assert from "node:assert/strict";
import { readFileSync, readdirSync, statSync } from "node:fs";
import { join } from "node:path";
import test from "node:test";

const read = (path) => readFileSync(path, "utf8");
const walk = (directory) => readdirSync(directory).flatMap((name) => { const path = join(directory, name); return statSync(path).isDirectory() ? walk(path) : [path]; });

test("homepage has semantic raffle discovery hero and valid CTA anchor", () => {
  const page = read("src/app/page.tsx");
  const content = read("src/content/homepage.ts");
  assert.equal((page.match(/<main/g) ?? []).length, 1);
  assert.match(page, /<section id="raffle"[^>]+aria-labelledby="hero-title"/);
  assert.match(page, /<h1 id="hero-title"/);
  assert.match(content, /Khám phá bản phát hành/);
  assert.match(content, /href: "#release-information"/);
  assert.match(page, /<section id="release-information"/);
});

test("navigation follows approved order and avoids account or cart placeholders", () => {
  const navigation = read("src/components/layout/navigation.ts");
  assert.match(navigation, /Raffle[\s\S]*Archive[\s\S]*Shop[\s\S]*Commission[\s\S]*About/);
  assert.doesNotMatch(read("src/components/layout/header.tsx") + read("src/components/layout/mobile-navigation.tsx"), /cart|giỏ hàng|account|tài khoản/i);
  assert.match(read("src/components/layout/mobile-navigation.tsx"), /aria-expanded/);
  assert.match(navigation, /isAvailable: false/);
});

test("raffle-first content remains non-transactional and has no fake urgency", () => {
  const source = read("src/app/page.tsx") + read("src/content/homepage.ts");
  assert.match(source, /Đợt raffle tiếp theo đang được chuẩn bị/);
  assert.match(source, /Lịch phát hành sẽ được công bố/);
  assert.doesNotMatch(source, /countdown|raffle open|mua ngay|checkout/i);
});

test("design tokens have one source and reduced motion is supported", () => {
  const cssFiles = walk("src").filter((path) => path.endsWith(".css"));
  assert.deepEqual(cssFiles, ["src/app/globals.css"]);
  assert.match(read(cssFiles[0]), /prefers-reduced-motion/);
});

test("governance artifacts and Home approvals reflect the first implementation slice", () => {
  assert.match(read("docs/REPOSITORY_AUDIT.md"), /Suspected duplicate\/conflict/);
  const roadmap = read("docs/ECOMMERCE_IMPLEMENTATION_ROADMAP.md");
  for (const status of ["NOT_STARTED", "IN_PROGRESS", "CODE_COMPLETE", "MERGED", "DEPLOYED", "OPERATOR_RETEST_REQUIRED", "LIVE_APPROVAL_REQUIRED", "BLOCKED", "COMPLETED"]) assert.match(roadmap, new RegExp(status));
  assert.match(read("docs/page-scripts/home-raffle-first-experience-script-draft.md"), /OWNER_APPROVED_FOR_FIRST_IMPLEMENTATION_SLICE/);
  assert.match(read("specs/home/home-page-specification.md"), /IMPLEMENTATION_READY/);
  assert.match(read("specs/home/home-hero-first-slice-technical-plan.md"), /Global visual foundation \+ Home raffle discovery hero shell/);
});

test("foundation introduces no ERP production instructions or commerce schemas", () => {
  const source = walk("src").filter((path) => /\.(ts|tsx)$/.test(path)).map(read).join("\n");
  assert.doesNotMatch(source, /create table|service_role|SUPABASE_DB_PASSWORD/i);
  assert.doesNotMatch(source, /interface\s+(Product|Order|Payment|Inventory|Customer)\b/);
  assert.doesNotMatch(read("AGENTS.md"), /execute production SQL automatically/i);
});
