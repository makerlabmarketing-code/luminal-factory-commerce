import assert from "node:assert/strict";
import { createHash } from "node:crypto";
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

test("navigation follows approved order with real storefront routes", () => {
  const navigation = read("src/components/layout/navigation.ts");
  assert.match(navigation, /Raffle[\s\S]*Archive[\s\S]*Shop[\s\S]*Commission[\s\S]*About/);
  assert.match(navigation, /href: "\/archive", label: "Archive", isAvailable: true/);
  assert.match(navigation, /href: "\/shop", label: "Shop", isAvailable: true/);
  assert.match(navigation, /href: "\/commission", label: "Commission", isAvailable: true/);
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

test("documentation reflects bounded brand recovery slice without completing media migration", () => {
  assert.match(read("specs/archive/archive-preview-foundation-technical-plan.md"), /Home Archive Preview \+ `\/archive` route foundation only/);
  assert.match(read("specs/shop/shop-discovery-foundation-technical-plan.md"), /Home Shop Discovery Preview \+ `\/shop` route foundation only/);
  const roadmap = read("docs/ECOMMERCE_IMPLEMENTATION_ROADMAP.md");
  for (const status of ["NOT_STARTED", "IN_PROGRESS", "CODE_COMPLETE", "MERGED", "DEPLOYED", "OPERATOR_RETEST_REQUIRED", "LIVE_APPROVAL_REQUIRED", "BLOCKED", "COMPLETED"]) assert.match(roadmap, new RegExp(status));
  assert.match(roadmap, /Current slice:.*Luminal Brand Asset Integration \+ Legacy LazyFactory Asset Recovery Inventory/);
  assert.doesNotMatch(roadmap, /Full Shop.*CODE_COMPLETE/);
  assert.match(read("docs/current-ecommerce-operator-handoff.md"), /Luminal brand and legacy recovery slice/);
  assert.match(read("specs/assets/brand-and-legacy-asset-recovery-technical-plan.md"), /Status: `SOURCE_VALIDATED_BROWSER_REVIEW_REQUIRED`/);
});

test("legacy inventory is parseable and keeps historical product media outside production approval", () => {
  const inventory = JSON.parse(read("docs/assets/legacy-asset-inventory.json"));
  assert.equal(inventory.schemaVersion, 1);
  assert.equal(inventory.sourceSite, "https://adelina-builder-wzacpt1wtxwbfh5y.hostingersite.com/");
  assert.equal(inventory.policy.historicalBrand, "lazyfactory-historical");
  assert.equal(inventory.policy.defaultProductionApproved, false);
  assert.ok(Array.isArray(inventory.records));
  for (const record of inventory.records) {
    assert.ok(record.sourceUrl);
    assert.ok(record.sourceBrand);
    assert.ok(record.approval);
    assert.equal(record.historicalBrand, true);
    assert.equal(record.productionApproved, false);
  }
});

test("production source has no Drive or legacy hotlink and preserves current brand boundaries", () => {
  const productionSource = src();
  assert.doesNotMatch(productionSource, /drive\.google\.com|googleusercontent\.com|hostingersite\.com/i);
  assert.doesNotMatch(productionSource, /https?:\/\/[^\s"')]+\.(?:png|jpe?g|webp|avif|gif|mp4|webm)/i);
  assert.doesNotMatch(read("src/components/layout/header.tsx") + read("src/components/layout/footer.tsx"), /LazyFactory/i);
  assert.doesNotMatch(productionSource, /from\(["'`] |supabase\.|create table|service_role/i);
});

test("approved local Luminal logo is integrated accessibly without changing navigation", () => {
  const brandSurfaces = read("src/components/layout/header.tsx") + read("src/components/layout/footer.tsx");
  assert.match(brandSurfaces, /aria-label="Luminal Factory"/);
  assert.match(read("src/components/layout/header.tsx"), /href="\/"[\s\S]*src="\/brand\/luminal-factory-logo-primary\.png"/);
  assert.match(read("src/components/layout/footer.tsx"), /href="\/"[\s\S]*src="\/brand\/luminal-factory-logo-primary\.png"/);
  assert.equal((brandSurfaces.match(/href="\/"/g) ?? []).length, 2);
  assert.match(brandSurfaces, /next\/image/);
  assert.equal((brandSurfaces.match(/width=\{4000\}/g) ?? []).length, 2);
  assert.equal((brandSurfaces.match(/height=\{4000\}/g) ?? []).length, 2);
  assert.doesNotMatch(brandSurfaces, /drive\.google|googleusercontent|hostingersite/i);
  assert.equal(existsSync(join("public", "brand", "luminal-factory-logo-primary.png")), true);
  const assetDocuments = [
    "docs/ECOMMERCE_IMPLEMENTATION_ROADMAP.md",
    "docs/current-ecommerce-operator-handoff.md",
    "docs/reviews/logo-header-ui-ux-gate.md",
    "specs/assets/brand-and-legacy-asset-recovery-technical-plan.md",
  ].map(read).join("\n");
  assert.match(assetDocuments, /public\/brand\/luminal-factory-logo-primary\.png/);
  assert.match(assetDocuments, /SOURCE_VALIDATED_BROWSER_REVIEW_REQUIRED/);
  assert.match(assetDocuments, /browser review/i);
});

test("approved Luminal logo binary keeps its validated PNG contract", () => {
  const logoPath = join("public", "brand", "luminal-factory-logo-primary.png");
  const logo = readFileSync(logoPath);

  assert.ok(logo.byteLength > 0);
  assert.equal(logo.byteLength, 6_036_257);
  assert.deepEqual([...logo.subarray(0, 8)], [137, 80, 78, 71, 13, 10, 26, 10]);
  assert.equal(logo.subarray(12, 16).toString("ascii"), "IHDR");
  assert.equal(logo.readUInt32BE(16), 4000);
  assert.equal(logo.readUInt32BE(20), 4000);
  assert.equal(logo[24], 8);
  assert.equal(logo[25], 6); // PNG truecolor with alpha; do not flatten the approved source.
  assert.equal(createHash("sha256").update(logo).digest("hex"), "758397de87097ed08d8cff0945dd27f9a4e6b36be2b267b138d5759ce68da5ee");
});

test("logo review gate preserves favicon, OG, and bounded commerce scope", () => {
  const gate = read("docs/reviews/logo-header-ui-ux-gate.md");
  assert.match(gate, /does \*\*not\*\* declare UI\/UX PASS/);
  assert.match(gate, /Favicon:[\s\S]*retained/i);
  assert.match(gate, /Open Graph:[\s\S]*unchanged/i);
  assert.doesNotMatch(src(), /drive\.google\.com|hostingersite\.com/i);
  assert.doesNotMatch(read("src/components/layout/header.tsx") + read("src/components/layout/mobile-navigation.tsx"), /cart|account|giỏ hàng|tài khoản/i);
  assert.doesNotMatch(read("src/app/globals.css").match(/\.brand[^}]*}/g)?.join("\n") ?? "", /filter|animation|glow/i);
});

test("recovery tool is bounded, allowlisted, and absent from production build scripts", () => {
  const recovery = read("scripts/recover-legacy-assets.mjs");
  const packageJson = JSON.parse(read("package.json"));
  assert.match(recovery, /MAX_PAGES = 40/);
  assert.match(recovery, /MAX_ASSETS = 400/);
  assert.match(recovery, /CONCURRENCY = 3/);
  assert.match(recovery, /TIMEOUT_MS = 15_000/);
  assert.match(recovery, /ROOT_HOST/);
  assert.equal(packageJson.scripts.build, "next build");
  assert.equal(Object.values(packageJson.scripts).some((command) => command.includes("recover-legacy-assets")), false);
});
