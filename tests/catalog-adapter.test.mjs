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

  for (const forbidden of [
    "inventory_items",
    "customers",
    "orders",
    "order_items",
    "payments",
    "refunds",
    "commerce_events",
    "raffles",
  ]) {
    assert.doesNotMatch(adapter, new RegExp(`rest/v1/${forbidden}|from\\([\\"'\\\`]${forbidden}`, "i"));
  }
});

test("successful empty catalog is not replaced with fixtures", () => {
  assert.match(adapter, /return \{ entries: rows\.map\(mapProduct\), source: "commerce-catalog" \}/);
  assert.match(adapter, /if \(rows === null\)/);
  assert.doesNotMatch(adapter, /if \(rows\.length === 0\)[\s\S]*getCuratedShopEntries/);
});

test("Shop listing and detail route through the adapter", () => {
  assert.match(shopPage, /await getShopCatalog\(\)/);
  assert.match(detailPage, /await getShopCatalogEntryBySlug\(slug\)/);
  assert.match(detailPage, /notFound\(\)/);
});

test("Phase 5 remains read-only and non-transactional", () => {
  const source = `${adapter}\n${shopPage}\n${detailPage}`;
  assert.doesNotMatch(source, /\.insert\(|\.update\(|\.upsert\(|\.delete\(|createOrder|paymentIntent|checkoutSession/i);
});
