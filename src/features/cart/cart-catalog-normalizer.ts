import { z } from "zod";
import type { CartLineIdentity, CartPageLine, CartReadyView } from "./cart-page-contract";

export const CART_PRESENTATION_MAX_LINES = 50;

const productRowsSchema = z.array(z.object({
  id: z.string().uuid(),
  slug: z.string().regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/),
  name: z.string().trim().min(1).max(160),
  release_type: z.literal("direct"),
}));
const variantRowsSchema = z.array(z.object({
  id: z.string().uuid(),
  product_id: z.string().uuid(),
  name: z.string().trim().min(1).max(160),
}));
const priceRowsSchema = z.array(z.object({
  product_id: z.string().uuid(),
  variant_id: z.string().uuid().nullable(),
  currency: z.literal("USD"),
  amount_minor: z.number().int().nonnegative().max(Number.MAX_SAFE_INTEGER),
}));
const mediaRowsSchema = z.array(z.object({
  product_id: z.string().uuid(),
  variant_id: z.string().uuid().nullable(),
  media_type: z.enum(["image", "video"]),
  storage_path: z.string().trim().min(1).max(2048),
  alt_text: z.string().max(500).nullable(),
  sort_order: z.number().int().nonnegative(),
  is_primary: z.boolean(),
}));

type ProductRow = z.infer<typeof productRowsSchema>[number];
type MediaRow = z.infer<typeof mediaRowsSchema>[number];

export type CartCatalogPayload = Readonly<{
  products: unknown;
  variants: unknown;
  prices: unknown;
  media: unknown;
}>;

export type CartCatalogPresentation = Pick<
  CartReadyView,
  "lines" | "subtotalMinor" | "subtotalLabel" | "estimateStatus"
> & Readonly<{ staleLineCount: number }>;

export function formatUsd(amountMinor: number): string {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(amountMinor / 100);
}

function toneForSlug(slug: string): CartPageLine["media"]["tone"] {
  const tones = ["ice", "violet", "rose"] as const;
  const score = [...slug].reduce((total, character) => total + character.charCodeAt(0), 0);
  return tones[score % tones.length];
}

function resolveMediaSource(storagePath: string, supabaseUrl: string): string | null {
  if (storagePath.startsWith("/") && !storagePath.startsWith("//")) return storagePath;
  try {
    const mediaUrl = new URL(storagePath);
    const catalogUrl = new URL(supabaseUrl);
    return mediaUrl.protocol === "https:" &&
      mediaUrl.origin === catalogUrl.origin &&
      mediaUrl.pathname.startsWith("/storage/v1/object/public/")
      ? mediaUrl.toString()
      : null;
  } catch {
    return null;
  }
}

function chooseMedia(media: readonly MediaRow[], variantId: string | null): MediaRow | undefined {
  return media.toSorted((left, right) => {
    const leftVariantRank = left.variant_id === variantId ? 0 : left.variant_id === null ? 1 : 2;
    const rightVariantRank = right.variant_id === variantId ? 0 : right.variant_id === null ? 1 : 2;
    if (leftVariantRank !== rightVariantRank) return leftVariantRank - rightVariantRank;
    if (left.is_primary !== right.is_primary) return left.is_primary ? -1 : 1;
    return left.sort_order - right.sort_order;
  }).find((entry) => entry.variant_id === variantId || entry.variant_id === null);
}

function createMedia(product: ProductRow, selectedMedia: MediaRow | undefined, supabaseUrl: string): CartPageLine["media"] {
  const imageSource = selectedMedia?.media_type === "image"
    ? resolveMediaSource(selectedMedia.storage_path, supabaseUrl)
    : null;
  const tone = toneForSlug(product.slug);
  return {
    type: "image",
    src: imageSource ?? `/placeholders/shop-${tone}-study.svg`,
    alt: selectedMedia?.alt_text?.trim() || `${product.name} catalog presentation media.`,
    width: 1500,
    height: 1200,
    aspectRatio: "5 / 4",
    credit: imageSource ? "Luminal Factory Commerce catalog" : "Internal Luminal Factory fallback",
    source: imageSource ? "commerce-catalog" : "internal-placeholder",
    historicalBrand: false,
    productionApproved: Boolean(imageSource),
    objectPosition: "50% 42%",
    placeholderFallback: "CSS cart object fallback",
    label: imageSource ? "Commerce catalog media" : "Catalog image chưa được cấu hình",
    tone,
  };
}

export function normalizeCartCatalogPresentation(
  cartLines: readonly CartLineIdentity[],
  payload: CartCatalogPayload,
  supabaseUrl: string,
): CartCatalogPresentation | null {
  const products = productRowsSchema.safeParse(payload.products);
  const variants = variantRowsSchema.safeParse(payload.variants);
  const prices = priceRowsSchema.safeParse(payload.prices);
  const media = mediaRowsSchema.safeParse(payload.media);
  if (!products.success || !variants.success || !prices.success || !media.success) return null;

  const productById = new Map(products.data.map((product) => [product.id, product]));
  const variantById = new Map(variants.data.map((variant) => [variant.id, variant]));
  const pricesByProduct = Map.groupBy(prices.data, (price) => price.product_id);
  const mediaByProduct = Map.groupBy(media.data, (entry) => entry.product_id);
  const normalizedLines: CartPageLine[] = [];
  let subtotalMinor = 0;
  let hasCompleteEstimate = true;
  let staleLineCount = 0;

  for (const cartLine of cartLines) {
    const product = productById.get(cartLine.productId);
    const variant = cartLine.variantId ? variantById.get(cartLine.variantId) : undefined;
    if (!product || (cartLine.variantId && (!variant || variant.product_id !== product.id))) {
      staleLineCount += 1;
      continue;
    }

    const matchingPrices = (pricesByProduct.get(product.id) ?? []).filter(
      (price) => price.variant_id === cartLine.variantId,
    );
    const unitPrice = matchingPrices.length === 1 ? matchingPrices[0].amount_minor : undefined;
    const lineEstimate = unitPrice === undefined ? undefined : unitPrice * cartLine.requestedQuantity;
    if (lineEstimate === undefined || !Number.isSafeInteger(lineEstimate) || !Number.isSafeInteger(subtotalMinor + lineEstimate)) {
      hasCompleteEstimate = false;
    } else {
      subtotalMinor += lineEstimate;
    }

    normalizedLines.push({
      productId: product.id,
      variantId: cartLine.variantId,
      slug: product.slug,
      title: product.name,
      ...(variant ? { variantLabel: variant.name } : {}),
      requestedQuantity: cartLine.requestedQuantity,
      ...(unitPrice === undefined ? {} : { unitPriceMinor: unitPrice, unitPriceLabel: formatUsd(unitPrice) }),
      ...(lineEstimate === undefined || !Number.isSafeInteger(lineEstimate)
        ? {}
        : { lineEstimateMinor: lineEstimate, lineEstimateLabel: formatUsd(lineEstimate) }),
      media: createMedia(product, chooseMedia(mediaByProduct.get(product.id) ?? [], cartLine.variantId), supabaseUrl),
    });
  }

  return {
    lines: normalizedLines,
    staleLineCount,
    estimateStatus: hasCompleteEstimate ? "complete" : "incomplete",
    ...(hasCompleteEstimate ? { subtotalMinor, subtotalLabel: formatUsd(subtotalMinor) } : {}),
  };
}
