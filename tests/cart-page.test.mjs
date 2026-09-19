import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";
import {
  CART_PRESENTATION_MAX_LINES,
  normalizeCartCatalogPresentation,
} from "../src/features/cart/cart-catalog-normalizer.ts";
import {
  createCartPageView,
  createCustomerCartPageView,
} from "../src/features/cart/cart-page-view.ts";

const PRODUCT_ID = "11111111-1111-4111-8111-111111111111";
const VARIANT_ID = "22222222-2222-4222-8222-222222222222";
const STALE_PRODUCT_ID = "33333333-3333-4333-8333-333333333333";
const SUPABASE_URL = "https://catalog.example.supabase.co";

const CART_LINES = [
  { productId: PRODUCT_ID, variantId: VARIANT_ID, requestedQuantity: 2 },
  { productId: STALE_PRODUCT_ID, variantId: null, requestedQuantity: 1 },
];

function catalogPayload(priceRows = [{
  product_id: PRODUCT_ID,
  variant_id: VARIANT_ID,
  currency: "VND",
  amount_minor: 125000,
}]) {
  return {
    products: [{ id: PRODUCT_ID, slug: "mono-study", name: "Mono Study", release_type: "direct" }],
    variants: [{ id: VARIANT_ID, product_id: PRODUCT_ID, name: "Mono" }],
    prices: priceRows,
    media: [{
      product_id: PRODUCT_ID,
      variant_id: VARIANT_ID,
      media_type: "image",
      storage_path: `${SUPABASE_URL}/storage/v1/object/public/products/mono.webp`,
      alt_text: "Mono Study artisan object.",
      sort_order: 0,
      is_primary: true,
    }],
  };
}

test("catalog enrichment preserves cart order, validates variants and computes a complete VND estimate", () => {
  const view = normalizeCartCatalogPresentation(CART_LINES, catalogPayload(), SUPABASE_URL);
  assert.ok(view);
  assert.equal(view.lines.length, 1);
  assert.equal(view.staleLineCount, 1);
  assert.equal(view.lines[0].title, "Mono Study");
  assert.equal(view.lines[0].variantLabel, "Mono");
  assert.equal(view.lines[0].unitPriceMinor, 125000);
  assert.equal(view.lines[0].lineEstimateMinor, 250000);
  assert.equal(view.subtotalMinor, 250000);
  assert.equal(view.estimateStatus, "complete");
  assert.equal(view.lines[0].media.source, "commerce-catalog");
});

test("ambiguous or missing prices never produce a partial subtotal", () => {
  const duplicatePrice = {
    product_id: PRODUCT_ID,
    variant_id: VARIANT_ID,
    currency: "VND",
    amount_minor: 125000,
  };
  const view = normalizeCartCatalogPresentation(
    CART_LINES.slice(0, 1),
    catalogPayload([duplicatePrice, { ...duplicatePrice, amount_minor: 130000 }]),
    SUPABASE_URL,
  );
  assert.ok(view);
  assert.equal(view.estimateStatus, "incomplete");
  assert.equal(view.subtotalMinor, undefined);
  assert.equal(view.lines[0].unitPriceMinor, undefined);
});

test("catalog enrichment rejects malformed public payloads and unapproved media origins", () => {
  assert.equal(
    normalizeCartCatalogPresentation(CART_LINES, { ...catalogPayload(), products: [{ id: "not-a-uuid" }] }, SUPABASE_URL),
    null,
  );

  const payload = catalogPayload();
  payload.media[0].storage_path = "https://untrusted.example/products/mono.webp";
  const view = normalizeCartCatalogPresentation(CART_LINES.slice(0, 1), payload, SUPABASE_URL);
  assert.ok(view);
  assert.equal(view.lines[0].media.source, "internal-placeholder");
  assert.match(view.lines[0].media.src, /^\/placeholders\//);
});

test("Cart page fails closed before cookie or persistence work while runtime is disabled", async () => {
  let readCount = 0;
  let enrichCount = 0;
  const view = await createCartPageView({
    enabled: false,
    guestToken: "unused",
    async readCart() {
      readCount += 1;
      throw new Error("must not run");
    },
    async enrichCatalog() {
      enrichCount += 1;
      throw new Error("must not run");
    },
  });
  assert.deepEqual(view, { state: "unavailable", currency: "VND", unavailableLineCount: 0 });
  assert.equal(readCount, 0);
  assert.equal(enrichCount, 0);
});

test("Cart page does not create a cart when the guest cookie is missing", async () => {
  let readCount = 0;
  const view = await createCartPageView({
    enabled: true,
    async readCart() {
      readCount += 1;
      throw new Error("must not run");
    },
    async enrichCatalog() {
      throw new Error("must not run");
    },
  });
  assert.deepEqual(view, { state: "empty", currency: "VND", unavailableLineCount: 0 });
  assert.equal(readCount, 0);
});

test("Cart page combines service and catalog stale counts without exposing private identity", async () => {
  const view = await createCartPageView({
    enabled: true,
    guestToken: "opaque-cookie",
    async readCart() {
      return {
        ok: true,
        cart: {
          currency: "VND",
          expiresAt: "2026-10-19T00:00:00.000Z",
          lines: CART_LINES,
          unavailableLineCount: 2,
        },
      };
    },
    async enrichCatalog(lines) {
      return normalizeCartCatalogPresentation(lines, catalogPayload(), SUPABASE_URL);
    },
  });
  assert.equal(view.state, "ready");
  assert.equal(view.unavailableLineCount, 3);
  assert.equal(view.lines.length, 1);
  assert.doesNotMatch(JSON.stringify(view), /opaque-cookie|guest_token|cart_id/i);
});

test("verified Cart requires explicit synchronization while the guest credential remains", async () => {
  let reads = 0;
  const view = await createCustomerCartPageView({
    enabled: true,
    hasGuestToken: true,
    async readCart() {
      reads += 1;
      throw new Error("GET must not merge or read either cart");
    },
    async enrichCatalog() {
      throw new Error("must not enrich before synchronization");
    },
  });
  assert.deepEqual(view, { state: "sync_required", currency: "VND", unavailableLineCount: 0 });
  assert.equal(reads, 0);
});

test("verified Cart reads customer state and creates nothing for an empty cart", async () => {
  const view = await createCustomerCartPageView({
    enabled: true,
    hasGuestToken: false,
    async readCart() { return { ok: true, cart: null }; },
    async enrichCatalog() { throw new Error("empty cart must not enrich"); },
  });
  assert.deepEqual(view, { state: "empty", currency: "VND", unavailableLineCount: 0 });
});

test("Cart route is private, noindex, default-off and absent from global navigation", () => {
  const route = readFileSync("src/app/cart/page.tsx", "utf8");
  const proxy = readFileSync("src/proxy.ts", "utf8");
  const nextConfig = readFileSync("next.config.ts", "utf8");
  const service = readFileSync("src/features/cart/cart-page-service.ts", "utf8");
  const controls = readFileSync("src/features/cart/cart-line-controls.tsx", "utf8");
  const syncControl = readFileSync("src/features/cart/cart-sync-control.tsx", "utf8");
  const header = readFileSync("src/components/layout/header.tsx", "utf8");
  const mobileNavigation = readFileSync("src/components/layout/mobile-navigation.tsx", "utf8");

  assert.match(route, /dynamic\s*=\s*["']force-dynamic["']/);
  assert.match(route, /robots:\s*\{\s*index:\s*false,\s*follow:\s*false/);
  assert.match(proxy, /private, no-store, max-age=0/);
  assert.match(nextConfig, /source:\s*["']\/cart["']/);
  assert.match(nextConfig, /private, no-store, max-age=0/);
  assert.match(service, /COMMERCE_GUEST_CART_ENABLED/);
  assert.match(controls, /X-Luminal-Cart-Request|GUEST_CART_REQUEST_HEADER/);
  assert.match(controls, /action:\s*["']set_line["']/);
  assert.match(controls, /action:\s*["']remove_line["']/);
  assert.match(syncControl, /action:\s*["']merge_guest["']/);
  assert.match(syncControl, /aria-live=["']polite["']/);
  assert.doesNotMatch(header + mobileNavigation, /href=["']\/cart["']/);
  assert.equal(CART_PRESENTATION_MAX_LINES, 50);
});

test("Cart UI keeps checkout informational and preserves the order/payment/inventory boundary", () => {
  const page = readFileSync("src/features/cart/cart-page.tsx", "utf8");
  const catalog = readFileSync("src/features/cart/cart-catalog-presentation.ts", "utf8");
  const combined = `${page}\n${catalog}`;
  assert.match(page, /Thanh toán đang được chuẩn bị/);
  assert.doesNotMatch(page, /action=["'][^"']*checkout|href=["'][^"']*checkout/i);
  assert.doesNotMatch(combined, /from\(["'](?:orders|payments|inventory_items)["']\)|\/rest\/v1\/(?:orders|payments|inventory_items)/i);
});
