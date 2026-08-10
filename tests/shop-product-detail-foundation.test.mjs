import assert from "node:assert/strict";
import { existsSync, readFileSync } from "node:fs";
import test from "node:test";

const read = (path) => readFileSync(path, "utf8");

test("shop detail route exists and resolves catalog slugs with notFound", () => {
  assert.equal(existsSync("src/app/shop/[slug]/page.tsx"), true);
  const route = read("src/app/shop/[slug]/page.tsx");
  assert.match(route, /generateStaticParams/);
  assert.match(route, /getShopCatalogEntryBySlug/);
  assert.match(route, /notFound\(\)/);
  assert.match(route, /generateMetadata/);
});

test("shop presentation fallback keeps stable slugs and real detail hrefs", () => {
  const content = read("src/features/shop/shop-content.ts");
  assert.match(content, /slug: "object-study-direct-01"/);
  assert.match(content, /href: "\/shop\/object-study-direct-01"/);
  assert.match(content, /getShopEntryBySlug/);
  assert.match(content, /dataSource: "fixture-fallback"/);
});

test("shop index links to detail routes and exposes catalog source", () => {
  const collection = read("src/features/shop/shop-collection.tsx");
  assert.match(collection, /<Link href=\{entry\.href\}>\{entry\.title\}<\/Link>/);
  assert.match(collection, /Xem object detail/);
  assert.match(collection, /Commerce catalog/);
  assert.doesNotMatch(collection, /id=\{entry\.presentationKey\}/);
});

test("shop detail presentation has one h1 and no transactional controls", () => {
  const detail = read("src/features/shop/shop-product-detail.tsx");
  const route = read("src/app/shop/[slug]/page.tsx");
  const source = `${detail}\n${route}`;

  assert.equal((detail.match(/<h1\b/g) ?? []).length, 1);
  assert.match(detail, /Object story/);
  assert.match(detail, /Published facts/);
  assert.match(detail, /Purchase flow chưa được mở trong Phase 5/);
  assert.doesNotMatch(source, /<form|onSubmit=|addToCart|createOrder|checkoutSession|paymentIntent|supabase\.|from\(["'`]/i);
});

test("shop detail foundation history remains documented", () => {
  const plan = read("specs/shop/shop-product-detail-foundation-technical-plan.md");
  assert.match(plan, /Owner approval: `2026-08-09`/);
  assert.match(plan, /NOT_APPLICABLE_NO_DATA_CHANGE/);
  assert.match(plan, /feat\/shop-product-detail-foundation/);
});
