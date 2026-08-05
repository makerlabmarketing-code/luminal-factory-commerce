import type { PresentationMedia } from "@/types/media";

export type ShopPresentationStatus = "detail-coming-soon";

export type ShopMediaTone = "ice" | "violet" | "rose";

export type ShopPresentationEntry = Readonly<{
  id: string;
  presentationKey: string;
  title: string;
  collection: string;
  type: string;
  description: string;
  materialNote: string;
  media: PresentationMedia & Readonly<{
    label: string;
    tone: ShopMediaTone;
  }>;
  presentationStatus: ShopPresentationStatus;
  href: `/shop#${string}`;
  isPlaceholder: true;
}>;

export const shopPlaceholderNotice = "Presentation placeholder — pending production catalog approval";
export const shopDetailAvailability = "Thông tin chi tiết sắp mở";

export const curatedShopEntries = [
  {
    id: "shop-object-study-01",
    presentationKey: "object-study-direct-01",
    title: "Object Study Direct 01",
    collection: "Direct object study",
    type: "Artisan collectible",
    description: "A restrained shop placeholder for a collectible that may later support direct purchase presentation.",
    materialNote: "Dark metal base, cold crystal reflection, tactile hand-finished contour note.",
    media: {
      type: "image",
      src: "/placeholders/shop-ice-study.svg",
      alt: "Abstract internal placeholder for shop collectible study one; not approved product media.",
      width: 1500,
      height: 1200,
      aspectRatio: "5 / 4",
      credit: "Internal Luminal Factory shop placeholder",
      source: "internal-placeholder",
      historicalBrand: false,
      productionApproved: false,
      objectPosition: "50% 42%",
      placeholderFallback: "CSS shop object fallback",
      label: "Internal shop media placeholder",
      tone: "ice",
    },
    presentationStatus: "detail-coming-soon",
    href: "/shop#object-study-direct-01",
    isPlaceholder: true,
  },
  {
    id: "shop-object-study-02",
    presentationKey: "object-study-direct-02",
    title: "Object Study Direct 02",
    collection: "Material shelf study",
    type: "Keycap-scale object",
    description: "A quiet object-led slot for future directly available work, without price, stock, or order claims.",
    materialNote: "Lavender shadow, smoked edge, resin-like depth reserved for approved media.",
    media: {
      type: "image",
      src: "/placeholders/shop-violet-study.svg",
      alt: "Abstract internal placeholder for shop collectible study two; not approved product media.",
      width: 1500,
      height: 1200,
      aspectRatio: "5 / 4",
      credit: "Internal Luminal Factory shop placeholder",
      source: "internal-placeholder",
      historicalBrand: false,
      productionApproved: false,
      objectPosition: "50% 42%",
      placeholderFallback: "CSS shop object fallback",
      label: "Internal shop media placeholder",
      tone: "violet",
    },
    presentationStatus: "detail-coming-soon",
    href: "/shop#object-study-direct-02",
    isPlaceholder: true,
  },
  {
    id: "shop-object-study-03",
    presentationKey: "object-study-direct-03",
    title: "Object Study Direct 03",
    collection: "Studio shelf note",
    type: "Collectible object",
    description: "An editorial presentation card for future shop discovery, separate from Archive release history.",
    materialNote: "Pale rose highlight, obsidian field, controlled crop placeholder composition.",
    media: {
      type: "image",
      src: "/placeholders/shop-rose-study.svg",
      alt: "Abstract internal placeholder for shop collectible study three; not approved product media.",
      width: 1500,
      height: 1200,
      aspectRatio: "5 / 4",
      credit: "Internal Luminal Factory shop placeholder",
      source: "internal-placeholder",
      historicalBrand: false,
      productionApproved: false,
      objectPosition: "50% 42%",
      placeholderFallback: "CSS shop object fallback",
      label: "Internal shop media placeholder",
      tone: "rose",
    },
    presentationStatus: "detail-coming-soon",
    href: "/shop#object-study-direct-03",
    isPlaceholder: true,
  },
] as const satisfies readonly ShopPresentationEntry[];

export function getCuratedShopEntries(): readonly ShopPresentationEntry[] {
  return curatedShopEntries;
}
