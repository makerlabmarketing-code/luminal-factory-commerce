import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

const adapter = readFileSync("src/features/shop/catalog-adapter.ts", "utf8");
const shopPage = readFileSync("src/app/shop/page.tsx", "utf8");
const detailPage = readFileSync("src/app/shop/[slug]/page.tsx", "utf8");

test("catalog adapter uses the publishable API-key boundary", () => {
  assert.match(adapter, /NEXT_PUBLIC_SUPABASE_URL/);
  assert.match(adapter, /NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY/);
  assert.match(adapter, /apikey: config\.publishableKey/);
  assert.doesNotMatch(adapter, /service_role|SUPABASE_SECRET|SUPABASE_SERVICE/i);
});

test("catalog adapter selects only public catalog relations", () => {
  assert.match(adapter, /product_prices\(currency,amount_minor\)/);
  assert.match(adapter, /product_media\(media_type,storage_path,alt_text,sort_order,is_primary\)/);
  assert.match(adapter, /rest\/v1\/products/);

  for (const forbidden of ["inventory_items", "customers", "orders", "order_items", "payments", "refunds", "commerce_events", "raffles"]) {
    assert.doesNotMatch(adapter, new RegExp(`rest/v1/${forbidden}|from\\([\\"'\\\`]${forbidden}`, "i"));
  }
});

test("catalog query values are normalized against schema allowlists", () => {
  assert.match(adapter, /SHOP_PRODUCT_TYPES = \["artisan_keycap", "collectible_object", "custom_object", "other"\]/);
  assert.match(adapter, /SHOP_RELEASE_TYPES = \["direct", "preorder", "informational"\]/);
  assert.match(adapter, /slice\(0, 80\)/);
  assert.match(adapter, /Math\.min\(Math\.max\(rawPage, 1\), 500\)/);
});

test("catalog pagination uses a bounded page and one lookahead row", () => {
  assert.match(adapter, /SHOP_PAGE_SIZE = 12/);
  assert.match(adapter, /SHOP_PAGE_SIZE \+ 1/);
  assert.match(adapter, /offset/);
  assert.match(adapter, /hasNextPage = resolvedRows\.length > SHOP_PAGE_SIZE/);
});

test("search and filters stay on public product fields", () => {
  assert.match(adapter, /name\.ilike/);
  assert.match(adapter, /description\.ilike/);
  assert.match(adapter, /product_type/);
  assert.match(adapter, /release_type/);
  assert.doesNotMatch(adapter, /quantity_on_hand|quantity_reserved/);
});

test("successful empty catalog is not replaced with fixtures", () => {
  assert.match(adapter, /rows === null \? filterFixtureEntries\(query\) : rows\.map\(mapProduct\)/);
  assert.doesNotMatch(adapter, /rows\.length === 0[\s\S]*getCuratedShopEntries/);
});

test("Shop listing and detail route through the adapter", () => {
  assert.match(shopPage, /await getShopCatalog\(rawSearchParams\)/);
  assert.match(shopPage, /searchParams: Promise/);
  assert.match(detailPage, /await getShopCatalogEntryBySlug\(slug\)/);
  assert.match(detailPage, /notFound\(\)/);
});

test("Shop controls use GET URLs and preserve pagination state", () => {
  assert.match(shopPage, /<form action="\/shop" method="get">/);
  assert.match(shopPage, /name="q"/);
  assert.match(shopPage, /name="type"/);
  assert.match(shopPage, /name="release"/);
  assert.match(shopPage, /pageHref/);
  assert.match(shopPage, /aria-label="Phân trang Shop"/);
});

test("Phase 5 remains read-only and non-transactional", () => {
  const source = `${adapter}\n${shopPage}\n${detailPage}`;
  assert.doesNotMatch(source, /\.insert\(|\.update\(|\.upsert\(|\.delete\(|createOrder|paymentIntent|checkoutSession/i);
});
