import type { PresentationMedia } from "@/types/media";

export type ArchivePresentationStatus = "curated-placeholder";

export type ArchivePresentationFact = Readonly<{
  label: string;
  value: string;
}>;

export type ArchivePresentationEntry = Readonly<{
  id: string;
  slug: string;
  title: string;
  collection: string;
  year: string;
  description: string;
  story: string;
  materialNote: string;
  historicalNotes: readonly string[];
  facts: readonly ArchivePresentationFact[];
  media: PresentationMedia & Readonly<{
    label: string;
    tone: "ice" | "violet" | "rose" | "smoke";
  }>;
  status: ArchivePresentationStatus;
  href: `/archive/${string}`;
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
    story: "This record is intentionally restrained: it demonstrates how a future release story can preserve object identity, material memory, and studio context without inventing launch claims that have not been approved.",
    materialNote: "Obsidian surface, cold reflection, hand-finished silhouette note.",
    historicalNotes: [
      "Archive study only; release chronology remains pending production-content approval.",
      "No sale, customer, quantity, or raffle history is asserted by this placeholder.",
    ],
    facts: [
      { label: "Record type", value: "Historical presentation study" },
      { label: "Media status", value: "Internal placeholder" },
      { label: "Commerce state", value: "Not represented in Archive" },
    ],
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
    href: "/archive/object-study-01",
    isPlaceholder: true,
  },
  {
    id: "archive-object-study-02",
    slug: "object-study-02",
    title: "Object Study 02",
    collection: "Crystal edge record",
    year: "2025",
    description: "A restrained record slot for a former release story, without sale, stock, or customer claims.",
    story: "The page treatment focuses on a collectible as a studio record rather than a product listing. Surface, edge language, and visual memory can be documented while commercial facts remain outside the archive unless verified later.",
    materialNote: "Faceted edge, lavender shadow, layered resin-like depth note.",
    historicalNotes: [
      "Designed as an editorial record template for approved historical releases.",
      "Dates beyond the presentation year are omitted until an authoritative source exists.",
    ],
    facts: [
      { label: "Record type", value: "Editorial archive study" },
      { label: "Media status", value: "Internal placeholder" },
      { label: "Verification", value: "Historical claims intentionally limited" },
    ],
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
    href: "/archive/object-study-02",
    isPlaceholder: true,
  },
  {
    id: "archive-object-study-03",
    slug: "object-study-03",
    title: "Object Study 03",
    collection: "Refraction archive note",
    year: "2025",
    description: "A tactile editorial placeholder for Luminal's future public archive of collectible history.",
    story: "This study explores an archive page where craft memory carries more weight than transaction history. The object can be revisited through texture, silhouette, and collection context while unsupported commercial narratives stay absent.",
    materialNote: "Pale rose reflection, dark metal base, softened handmade contour note.",
    historicalNotes: [
      "Presentation language separates creative history from current availability.",
      "Future approved production imagery may replace the internal placeholder without changing the public slug.",
    ],
    facts: [
      { label: "Record type", value: "Collection memory study" },
      { label: "Media status", value: "Internal placeholder" },
      { label: "Availability", value: "Not a current-sale signal" },
    ],
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
    href: "/archive/object-study-03",
    isPlaceholder: true,
  },
] as const satisfies readonly ArchivePresentationEntry[];

export function getCuratedArchiveEntries(): readonly ArchivePresentationEntry[] {
  return curatedArchiveEntries;
}

export function getArchiveEntryBySlug(slug: string): ArchivePresentationEntry | undefined {
  return curatedArchiveEntries.find((entry) => entry.slug === slug);
}
