import assert from "node:assert/strict";
import { existsSync, readFileSync, readdirSync, statSync } from "node:fs";
import { join } from "node:path";
import test from "node:test";

const read = (path) => readFileSync(path, "utf8");
const walk = (directory) => readdirSync(directory).flatMap((name) => { const path = join(directory, name); return statSync(path).isDirectory() ? walk(path) : [path]; });
const src = () => walk("src").filter((path) => /\.(ts|tsx|css)$/.test(path)).map(read).join("\n");

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

test("home archive and shop previews follow raffle-first hierarchy", () => {
  const page = read("src/app/page.tsx");
  assert.ok(page.indexOf('<section id="release-information"') < page.indexOf("<ArchivePreviewSection"));
  assert.ok(page.indexOf("<ArchivePreviewSection") < page.indexOf("<ShopPreviewSection"));
  assert.ok(page.indexOf("<ShopPreviewSection") < page.indexOf('<section id="about"'));
  assert.match(read("src/features/archive/archive-preview-section.tsx"), /href="\/archive"/);
  assert.match(read("src/features/archive/archive-preview-section.tsx"), /Curated archive placeholder entries/);
  assert.match(read("src/features/shop/shop-preview-section.tsx"), /href="\/shop"/);
  assert.match(read("src/features/shop/shop-preview-section.tsx"), /Curated shop presentation entries/);
});

test("archive and shop route foundations exist with one h1 and shared typed models", () => {
  assert.ok(existsSync("src/app/archive/page.tsx"));
  assert.ok(existsSync("src/app/shop/page.tsx"));
  const archivePage = read("src/app/archive/page.tsx");
  const shopPage = read("src/app/shop/page.tsx");
  assert.equal((archivePage.match(/<h1\b/g) ?? []).length, 1);
  assert.equal((shopPage.match(/<h1\b/g) ?? []).length, 1);
  assert.match(archivePage, /getCuratedArchiveEntries/);
  assert.match(shopPage, /getCuratedShopEntries/);
  assert.match(read("src/features/archive/archive-content.ts"), /export type ArchivePresentationEntry/);
  assert.match(read("src/features/shop/shop-content.ts"), /export type ShopPresentationEntry/);
  assert.match(read("src/features/shop/shop-content.ts"), /satisfies readonly ShopPresentationEntry\[\]/);
  assert.match(read("src/features/shop/shop-content.ts"), /presentationStatus/);
  assert.match(read("src/features/archive/archive-collection.tsx"), /entries\.length === 0/);
  assert.match(read("src/features/shop/shop-collection.tsx"), /entries\.length === 0/);
});

test("navigation follows approved order with real archive link and safe unavailable destinations", () => {
  const navigation = read("src/components/layout/navigation.ts");
  assert.match(navigation, /Raffle[\s\S]*Archive[\s\S]*Shop[\s\S]*Commission[\s\S]*About/);
  assert.match(navigation, /href: "\/archive", label: "Archive", isAvailable: true/);
  assert.match(navigation, /href: "\/shop", label: "Shop", isAvailable: true/);
  assert.match(navigation, /label: "Commission", isAvailable: false/);
  assert.doesNotMatch(read("src/components/layout/header.tsx") + read("src/components/layout/mobile-navigation.tsx"), /cart|giỏ hàng|account|tài khoản/i);
  assert.match(read("src/components/layout/mobile-navigation.tsx"), /aria-expanded/);
});

test("archive and shop foundations remain non-transactional and have no Supabase query", () => {
  const source = src();
  assert.match(source, /Curated placeholder|curated placeholder|PLACEHOLDER MEDIA/);
  assert.doesNotMatch(source, /\$\d|price:/i);
  assert.doesNotMatch(source, />\s*(add to cart|buy now|mua ngay|sold out|checkout)\s*</i);
  assert.doesNotMatch(source, /inventory system|cart state|checkout flow|payment provider|order creation/i);
  assert.doesNotMatch(source, /from\(["'`]|supabase\./i);
  assert.doesNotMatch(source, /create table|service_role|SUPABASE_DB_PASSWORD/i);
  assert.doesNotMatch(source, /interface\s+(Product|Order|Payment|Inventory|Customer)\b/);
});

test("design tokens have one source and reduced motion is supported", () => {
  const cssFiles = walk("src").filter((path) => path.endsWith(".css"));
  assert.deepEqual(cssFiles, ["src/app/globals.css"]);
  assert.match(read(cssFiles[0]), /prefers-reduced-motion/);
});

test("documentation reflects shop discovery foundation without completing full shop", () => {
  assert.match(read("specs/archive/archive-preview-foundation-technical-plan.md"), /Home Archive Preview \+ `\/archive` route foundation only/);
  assert.match(read("specs/shop/shop-discovery-foundation-technical-plan.md"), /Home Shop Discovery Preview \+ `\/shop` route foundation only/);
  const roadmap = read("docs/ECOMMERCE_IMPLEMENTATION_ROADMAP.md");
  for (const status of ["NOT_STARTED", "IN_PROGRESS", "CODE_COMPLETE", "MERGED", "DEPLOYED", "OPERATOR_RETEST_REQUIRED", "LIVE_APPROVAL_REQUIRED", "BLOCKED", "COMPLETED"]) assert.match(roadmap, new RegExp(status));
  assert.match(roadmap, /Current slice:.*Home Shop Discovery Preview \+ `\/shop` route foundation/);
  assert.doesNotMatch(roadmap, /Full Shop.*CODE_COMPLETE/);
  assert.match(read("docs/current-ecommerce-operator-handoff.md"), /Home Shop Discovery Preview \+ Shop route foundation/);
});
