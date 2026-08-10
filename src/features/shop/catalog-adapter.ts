import "server-only";

import {
  getCuratedShopEntries,
  getShopEntryBySlug as getFixtureShopEntryBySlug,
  type ShopDataSource,
  type ShopMediaTone,
  type ShopPresentationEntry,
} from "./shop-content";

type CatalogPriceRow = Readonly<{
  currency: string;
  amount_minor: number;
}>;

type CatalogMediaRow = Readonly<{
  media_type: "image" | "video";
  storage_path: string;
  alt_text: string | null;
  sort_order: number;
  is_primary: boolean;
}>;

type CatalogProductRow = Readonly<{
  id: string;
  slug: string;
  name: string;
  description: string | null;
  product_type: string;
  release_type: string;
  published_at: string | null;
  product_prices: readonly CatalogPriceRow[] | null;
  product_media: readonly CatalogMediaRow[] | null;
}>;

export type ShopCatalogResult = Readonly<{
  entries: readonly ShopPresentationEntry[];
  source: ShopDataSource;
}>;

const PRODUCT_SELECT = [
  "id",
  "slug",
  "name",
  "description",
  "product_type",
  "release_type",
  "published_at",
  "product_prices(currency,amount_minor)",
  "product_media(media_type,storage_path,alt_text,sort_order,is_primary)",
].join(",");

function getCatalogConfig() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL?.trim();
  const publishableKey =
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY?.trim() ||
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY?.trim();

  if (!url || !publishableKey) {
    return null;
  }

  return { url: url.replace(/\/$/, ""), publishableKey };
}

function formatPrice(price: CatalogPriceRow | undefined): string | undefined {
  if (!price) {
    return undefined;
  }

  const currency = price.currency.toUpperCase();
  const zeroDecimalCurrencies = new Set(["VND", "JPY", "KRW"]);
  const divisor = zeroDecimalCurrencies.has(currency) ? 1 : 100;

  try {
    return new Intl.NumberFormat("vi-VN", {
      style: "currency",
      currency,
      maximumFractionDigits: zeroDecimalCurrencies.has(currency) ? 0 : 2,
    }).format(price.amount_minor / divisor);
  } catch {
    return `${price.amount_minor} ${currency} (minor units)`;
  }
}

function toneForSlug(slug: string): ShopMediaTone {
  const tones: readonly ShopMediaTone[] = ["ice", "violet", "rose"];
  const score = [...slug].reduce((total, character) => total + character.charCodeAt(0), 0);
  return tones[score % tones.length];
}

function directMediaSource(media: CatalogMediaRow | undefined): string | null {
  if (!media) {
    return null;
  }

  if (media.storage_path.startsWith("https://") || media.storage_path.startsWith("http://") || media.storage_path.startsWith("/")) {
    return media.storage_path;
  }

  return null;
}

function mapProduct(row: CatalogProductRow): ShopPresentationEntry {
  const price = row.product_prices?.[0];
  const priceLabel = formatPrice(price);
  const primaryMedia = [...(row.product_media ?? [])].sort((a, b) => {
    if (a.is_primary !== b.is_primary) {
      return a.is_primary ? -1 : 1;
    }
    return a.sort_order - b.sort_order;
  })[0];
  const catalogMediaSrc = directMediaSource(primaryMedia);
  const tone = toneForSlug(row.slug);
  const description = row.description?.trim() || "Mô tả chi tiết cho object này chưa được công bố trong catalog.";

  const releaseLabel =
    row.release_type === "direct"
      ? "Direct catalog"
      : row.release_type === "preorder"
        ? "Preorder catalog"
        : "Catalog object";

  const availabilityLabel =
    row.release_type === "direct"
      ? "Catalog đã publish · purchase flow chưa mở"
      : row.release_type === "preorder"
        ? "Catalog preorder đã publish · checkout chưa mở"
        : "Catalog đã publish · chỉ hiển thị thông tin";

  const facts = [
    { label: "Product type", value: row.product_type },
    { label: "Release type", value: row.release_type },
    ...(priceLabel ? [{ label: "Published price", value: priceLabel }] : []),
    { label: "Catalog authority", value: "Luminal Factory Commerce" },
  ];

  return {
    id: row.id,
    slug: row.slug,
    presentationKey: `catalog-${row.slug}`,
    title: row.name,
    collection: releaseLabel,
    type: row.product_type,
    description,
    story: description,
    materialNote: "Material và production detail chỉ được hiển thị khi catalog có dữ liệu xác nhận.",
    craftNotes: [
      "Object này được đọc từ published Commerce catalog.",
      "Thông tin không tồn tại trong catalog sẽ không được suy diễn trên storefront.",
      "Giá hiển thị là catalog presentation; cart, checkout và payment chưa được mở trong Phase 5.",
    ],
    facts,
    media: {
      type: primaryMedia?.media_type ?? "image",
      src: catalogMediaSrc ?? `/placeholders/shop-${tone}-study.svg`,
      alt: primaryMedia?.alt_text?.trim() || `${row.name} catalog presentation media.`,
      width: 1500,
      height: 1200,
      aspectRatio: "5 / 4",
      credit: primaryMedia ? "Luminal Factory Commerce catalog" : "Internal Luminal Factory fallback",
      source: primaryMedia ? "commerce-catalog" : "internal-placeholder",
      historicalBrand: false,
      productionApproved: false,
      objectPosition: "50% 42%",
      placeholderFallback: "CSS shop object fallback",
      label: primaryMedia ? "Commerce catalog media" : "Catalog media chưa được cấu hình",
      tone,
    },
    presentationStatus: "published",
    availabilityLabel,
    priceLabel,
    href: `/shop/${row.slug}`,
    isPlaceholder: false,
    dataSource: "commerce-catalog",
  };
}

async function requestProducts(slug?: string): Promise<readonly CatalogProductRow[] | null> {
  const config = getCatalogConfig();
  if (!config) {
    return null;
  }

  const endpoint = new URL(`${config.url}/rest/v1/products`);
  endpoint.searchParams.set("select", PRODUCT_SELECT);
  endpoint.searchParams.set("status", "eq.published");
  endpoint.searchParams.set("order", "published_at.desc");
  endpoint.searchParams.set("limit", slug ? "1" : "100");

  if (slug) {
    endpoint.searchParams.set("slug", `eq.${slug}`);
  }

  try {
    const response = await fetch(endpoint, {
      headers: {
        Accept: "application/json",
        apikey: config.publishableKey,
      },
      cache: "no-store",
    });

    if (!response.ok) {
      return null;
    }

    const payload: unknown = await response.json();
    return Array.isArray(payload) ? (payload as readonly CatalogProductRow[]) : null;
  } catch {
    return null;
  }
}

export async function getShopCatalog(): Promise<ShopCatalogResult> {
  const rows = await requestProducts();

  if (rows === null) {
    return { entries: getCuratedShopEntries(), source: "fixture-fallback" };
  }

  return { entries: rows.map(mapProduct), source: "commerce-catalog" };
}

export async function getShopCatalogEntryBySlug(slug: string): Promise<ShopPresentationEntry | undefined> {
  const rows = await requestProducts(slug);

  if (rows === null) {
    return getFixtureShopEntryBySlug(slug);
  }

  return rows[0] ? mapProduct(rows[0]) : undefined;
}
