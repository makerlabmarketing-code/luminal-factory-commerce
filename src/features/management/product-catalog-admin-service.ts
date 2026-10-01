import "server-only";

import { z } from "zod";
import type { CommerceAdminPrivilegedClient } from "./commerce-admin-route-runtime";

const productSchema = z.object({
  id: z.uuid(),
  name: z.string().min(1).max(500),
  slug: z.string().min(1).max(500),
  product_type: z.string(),
  status: z.enum(["draft", "published", "archived"]),
  release_type: z.enum(["direct", "preorder", "informational"]),
  updated_at: z.string(),
});
const variantSchema = z.object({ product_id: z.uuid(), id: z.uuid(), is_active: z.boolean() });
const mediaSchema = z.object({ product_id: z.uuid(), id: z.uuid(), media_type: z.enum(["image", "video"]) });
const priceSchema = z.object({ product_id: z.uuid(), id: z.uuid(), is_active: z.boolean() });

export type AdminProductSummary = Readonly<{
  id: string;
  name: string;
  slug: string;
  productType: string;
  status: "draft" | "published" | "archived";
  releaseType: "direct" | "preorder" | "informational";
  updatedAt: string;
  variantCount: number;
  activeVariantCount: number;
  imageCount: number;
  videoCount: number;
  activePriceCount: number;
}>;

function validatedRows<T>(data: unknown, schema: z.ZodType<T>): T[] {
  if (!Array.isArray(data)) throw new Error("Commerce catalog response is invalid.");
  return data.map((row) => schema.parse(row));
}

// A deliberately bounded, read-only first batch. Product editing/publishing and
// private customer or order data are not reachable through this service.
export async function listAdminProductCatalog(
  client: CommerceAdminPrivilegedClient,
): Promise<AdminProductSummary[]> {
  const { data: productData, error: productError } = await client
    .from("products")
    .select("id,name,slug,product_type,status,release_type,updated_at")
    .order("created_at", { ascending: false })
    .limit(101);
  if (productError) throw productError;
  const products = validatedRows(productData, productSchema);
  if (products.length > 100) throw new Error("Commerce catalog needs pagination.");
  if (products.length === 0) return [];

  const ids = products.map((product) => product.id);
  const [variantResult, mediaResult, priceResult] = await Promise.all([
    client.from("product_variants").select("id,product_id,is_active").in("product_id", ids).limit(501),
    client.from("product_media").select("id,product_id,media_type").in("product_id", ids).limit(501),
    client.from("product_prices").select("id,product_id,is_active").in("product_id", ids).limit(501),
  ]);
  if (variantResult.error || mediaResult.error || priceResult.error) {
    throw variantResult.error ?? mediaResult.error ?? priceResult.error;
  }
  const variants = validatedRows(variantResult.data, variantSchema);
  const media = validatedRows(mediaResult.data, mediaSchema);
  const prices = validatedRows(priceResult.data, priceSchema);
  if ([variants.length, media.length, prices.length].some((length) => length > 500)) {
    throw new Error("Commerce catalog related rows need pagination.");
  }

  return products.map((product) => ({
    id: product.id,
    name: product.name,
    slug: product.slug,
    productType: product.product_type,
    status: product.status,
    releaseType: product.release_type,
    updatedAt: product.updated_at,
    variantCount: variants.filter((row) => row.product_id === product.id).length,
    activeVariantCount: variants.filter((row) => row.product_id === product.id && row.is_active).length,
    imageCount: media.filter((row) => row.product_id === product.id && row.media_type === "image").length,
    videoCount: media.filter((row) => row.product_id === product.id && row.media_type === "video").length,
    activePriceCount: prices.filter((row) => row.product_id === product.id && row.is_active).length,
  }));
}
