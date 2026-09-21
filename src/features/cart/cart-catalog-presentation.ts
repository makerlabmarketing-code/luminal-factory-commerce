import "server-only";

import type { CartLineIdentity } from "./cart-page-contract";
import {
  CART_PRESENTATION_MAX_LINES,
  formatUsd,
  normalizeCartCatalogPresentation,
} from "./cart-catalog-normalizer";

function getCatalogConfig(): Readonly<{ url: string; publishableKey: string }> | null {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL?.trim();
  const publishableKey = (
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY ?? process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
  )?.trim();
  if (!url || !publishableKey) return null;
  return { url: url.replace(/\/$/, ""), publishableKey };
}

async function requestRows(
  config: Readonly<{ url: string; publishableKey: string }>,
  table: "products" | "product_variants" | "product_prices" | "product_media",
  select: string,
  productIds: readonly string[],
): Promise<unknown | null> {
  const endpoint = new URL(`${config.url}/rest/v1/${table}`);
  endpoint.searchParams.set("select", select);
  endpoint.searchParams.set(table === "products" ? "id" : "product_id", `in.(${productIds.join(",")})`);
  if (table === "products") endpoint.searchParams.set("release_type", "eq.direct");
  endpoint.searchParams.set("order", table === "product_media" ? "sort_order.asc" : "created_at.asc");

  try {
    const response = await fetch(endpoint, {
      headers: { Accept: "application/json", apikey: config.publishableKey },
      cache: "no-store",
    });
    return response.ok ? await response.json() : null;
  } catch {
    return null;
  }
}

export async function getCartCatalogPresentation(
  cartLines: readonly CartLineIdentity[],
): Promise<ReturnType<typeof normalizeCartCatalogPresentation>> {
  const config = getCatalogConfig();
  if (!config || cartLines.length > CART_PRESENTATION_MAX_LINES) return null;
  if (cartLines.length === 0) {
    return { lines: [], staleLineCount: 0, estimateStatus: "complete", subtotalMinor: 0, subtotalLabel: formatUsd(0) };
  }

  const productIds = [...new Set(cartLines.map((line) => line.productId))];
  const [products, variants, prices, media] = await Promise.all([
    requestRows(config, "products", "id,slug,name,release_type,created_at", productIds),
    requestRows(config, "product_variants", "id,product_id,name,created_at", productIds),
    requestRows(config, "product_prices", "product_id,variant_id,currency,amount_minor,created_at", productIds),
    requestRows(config, "product_media", "product_id,variant_id,media_type,storage_path,alt_text,sort_order,is_primary", productIds),
  ]);
  if ([products, variants, prices, media].some((rows) => rows === null)) return null;

  return normalizeCartCatalogPresentation(cartLines, { products, variants, prices, media }, config.url);
}
