import type { PresentationMedia } from "@/types/media";

export type ShopPresentationStatus = "detail-only" | "coming-soon" | "unavailable" | "archived";

export type ShopMediaTone = "ice" | "violet" | "rose";

export type ShopPresentationEntry = Readonly<{
  id: string;
  slug: string;
  presentationKey: string;
  title: string;
  collection: string;
  type: string;
  description: string;
  story: string;
  materialNote: string;
  craftNotes: readonly string[];
  facts: readonly Readonly<{ label: string; value: string }>[];
  media: PresentationMedia & Readonly<{
    label: string;
    tone: ShopMediaTone;
  }>;
  presentationStatus: ShopPresentationStatus;
  availabilityLabel: string;
  href: `/shop/${string}`;
  isPlaceholder: true;
}>;

export const shopPlaceholderNotice = "Presentation placeholder — pending production catalog approval";
export const shopDetailAvailability = "Chi tiết tham khảo · chưa mở bán trực tiếp";

export const curatedShopEntries = [
  {
    id: "shop-object-study-01",
    slug: "object-study-direct-01",
    presentationKey: "object-study-direct-01",
    title: "Object Study Direct 01",
    collection: "Direct object study",
    type: "Artisan collectible",
    description: "A restrained shop placeholder for a collectible that may later support direct purchase presentation.",
    story: "A presentation study for how a future Luminal collectible can be explored as an object first: silhouette, surface, material cues, and hand-finished character before any transactional layer exists.",
    materialNote: "Dark metal base, cold crystal reflection, tactile hand-finished contour note.",
    craftNotes: [
      "Object-led composition reserved for approved production photography.",
      "Hand-finished character remains part of the presentation language.",
      "No production method, compatibility, or dimensions are claimed until approved.",
    ],
    facts: [
      { label: "Collection", value: "Direct object study" },
      { label: "Object type", value: "Artisan collectible" },
      { label: "Detail state", value: "Presentation only" },
    ],
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
    presentationStatus: "detail-only",
    availabilityLabel: shopDetailAvailability,
    href: "/shop/object-study-direct-01",
    isPlaceholder: true,
  },
  {
    id: "shop-object-study-02",
    slug: "object-study-direct-02",
    presentationKey: "object-study-direct-02",
    title: "Object Study Direct 02",
    collection: "Material shelf study",
    type: "Keycap-scale object",
    description: "A quiet object-led slot for future directly available work, without price, stock, or order claims.",
    story: "This study explores a denser material-led detail page where the object is framed as a collectible artifact rather than a generic ecommerce SKU.",
    materialNote: "Lavender shadow, smoked edge, resin-like depth reserved for approved media.",
    craftNotes: [
      "Material language is illustrative until production assets are approved.",
      "Future product facts should come from one authoritative catalog source.",
      "Availability copy stays neutral until stock and release authority exist.",
    ],
    facts: [
      { label: "Collection", value: "Material shelf study" },
      { label: "Object type", value: "Keycap-scale object" },
      { label: "Detail state", value: "Presentation only" },
    ],
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
    presentationStatus: "coming-soon",
    availabilityLabel: "Chi tiết tham khảo · trạng thái mở bán chưa được công bố",
    href: "/shop/object-study-direct-02",
    isPlaceholder: true,
  },
  {
    id: "shop-object-study-03",
    slug: "object-study-direct-03",
    presentationKey: "object-study-direct-03",
    title: "Object Study Direct 03",
    collection: "Studio shelf note",
    type: "Collectible object",
    description: "An editorial presentation card for future shop discovery, separate from Archive release history.",
    story: "A studio-shelf presentation study focused on quiet editorial context, giving future production work enough space for story and craft notes without collapsing into a dense storefront card.",
    materialNote: "Pale rose highlight, obsidian field, controlled crop placeholder composition.",
    craftNotes: [
      "Editorial story and product facts remain separate blocks.",
      "Internal placeholder media is visibly marked as non-production.",
      "Direct purchase controls remain absent until commerce contracts are approved.",
    ],
    facts: [
      { label: "Collection", value: "Studio shelf note" },
      { label: "Object type", value: "Collectible object" },
      { label: "Detail state", value: "Presentation only" },
    ],
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
    presentationStatus: "unavailable",
    availabilityLabel: "Chi tiết tham khảo · hiện không mở bán trực tiếp",
    href: "/shop/object-study-direct-03",
    isPlaceholder: true,
  },
] as const satisfies readonly ShopPresentationEntry[];

export function getCuratedShopEntries(): readonly ShopPresentationEntry[] {
  return curatedShopEntries;
}

export function getShopEntryBySlug(slug: string): ShopPresentationEntry | undefined {
  return curatedShopEntries.find((entry) => entry.slug === slug);
}
