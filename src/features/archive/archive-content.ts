import type { PresentationMedia } from "@/types/media";

export type ArchivePresentationStatus = "curated-placeholder";

export type ArchivePresentationEntry = Readonly<{
  id: string;
  slug: string;
  title: string;
  collection: string;
  year: string;
  description: string;
  materialNote: string;
  media: PresentationMedia & Readonly<{
    label: string;
    tone: "ice" | "violet" | "rose" | "smoke";
  }>;
  status: ArchivePresentationStatus;
  href: `/archive#${string}`;
  isPlaceholder: true;
}>;

export const archivePlaceholderNotice = "Curated placeholder — pending production content approval";

export const curatedArchiveEntries = [
  {
    id: "archive-object-study-01",
    slug: "object-study-01",
    title: "Object Study 01",
    collection: "Material memory study",
    year: "2024",
    description: "A quiet archive placeholder for a previous collectible study, reserved for approved historical content.",
    materialNote: "Obsidian surface, cold reflection, hand-finished silhouette note.",
    media: {
      type: "image",
      src: "/placeholders/archive-ice-study.svg",
      alt: "Abstract internal placeholder for archived collectible study one; not approved product media.",
      width: 1200,
      height: 1500,
      aspectRatio: "4 / 5",
      credit: "Internal Luminal Factory archive placeholder",
      source: "internal-placeholder",
      historicalBrand: false,
      productionApproved: false,
      objectPosition: "50% 45%",
      placeholderFallback: "CSS archive object fallback",
      label: "Internal archive media placeholder",
      tone: "ice",
    },
    status: "curated-placeholder",
    href: "/archive#object-study-01",
    isPlaceholder: true,
  },
  {
    id: "archive-object-study-02",
    slug: "object-study-02",
    title: "Object Study 02",
    collection: "Crystal edge record",
    year: "2025",
    description: "A restrained record slot for a former release story, without sale, stock, or customer claims.",
    materialNote: "Faceted edge, lavender shadow, layered resin-like depth note.",
    media: {
      type: "image",
      src: "/placeholders/archive-violet-study.svg",
      alt: "Abstract internal placeholder for archived collectible study two; not approved product media.",
      width: 1200,
      height: 1500,
      aspectRatio: "4 / 5",
      credit: "Internal Luminal Factory archive placeholder",
      source: "internal-placeholder",
      historicalBrand: false,
      productionApproved: false,
      objectPosition: "50% 45%",
      placeholderFallback: "CSS archive object fallback",
      label: "Internal archive media placeholder",
      tone: "violet",
    },
    status: "curated-placeholder",
    href: "/archive#object-study-02",
    isPlaceholder: true,
  },
  {
    id: "archive-object-study-03",
    slug: "object-study-03",
    title: "Object Study 03",
    collection: "Refraction archive note",
    year: "2025",
    description: "A tactile editorial placeholder for Luminal's future public archive of collectible history.",
    materialNote: "Pale rose reflection, dark metal base, softened handmade contour note.",
    media: {
      type: "image",
      src: "/placeholders/archive-rose-study.svg",
      alt: "Abstract internal placeholder for archived collectible study three; not approved product media.",
      width: 1200,
      height: 1500,
      aspectRatio: "4 / 5",
      credit: "Internal Luminal Factory archive placeholder",
      source: "internal-placeholder",
      historicalBrand: false,
      productionApproved: false,
      objectPosition: "50% 45%",
      placeholderFallback: "CSS archive object fallback",
      label: "Internal archive media placeholder",
      tone: "rose",
    },
    status: "curated-placeholder",
    href: "/archive#object-study-03",
    isPlaceholder: true,
  },
] as const satisfies readonly ArchivePresentationEntry[];

export function getCuratedArchiveEntries(): readonly ArchivePresentationEntry[] {
  return curatedArchiveEntries;
}
