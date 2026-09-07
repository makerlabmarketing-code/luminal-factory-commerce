/** Presentation fixture contract retained for the shared MediaCard primitive. */
export type PresentationCreation = Readonly<{
  id: string;
  title: string;
  category: string;
  status: "Khái niệm" | "Lưu trữ" | "Sắp tới";
  tone: string;
}>;

export type HomeArchiveObject = Readonly<{
  title: string;
  collection: string;
  year: string;
  tone: "ice" | "lavender" | "rose" | "smoke";
}>;

export const homePageContent = {
  hero: {
    eyebrow: "Luminal Revival · 2026",
    title: "Objects, shaped by light.",
    description:
      "A new chapter for our small-batch artisan objects—formed slowly, finished by hand, and released with intention.",
    primaryAction: { label: "Explore the Archive", href: "/archive" },
    secondaryAction: { label: "Shop objects", href: "/shop" },
  },
  featured: {
    index: "01 / Featured object",
    title: "A study in character and light",
    collection: "Luminal Collection · 2026",
    story:
      "Every Luminal object begins as a personality rather than a product. Gesture, silhouette, and surface are refined until the piece feels alive from every angle.",
  },
  archive: [
    { title: "Nocturne Study", collection: "Character archive", year: "2023", tone: "ice" },
    { title: "Soft Signal", collection: "Material archive", year: "2024", tone: "lavender" },
    { title: "Afterglow", collection: "Finish archive", year: "2025", tone: "rose" },
    { title: "Quiet Form", collection: "Studio archive", year: "2025", tone: "smoke" },
  ] satisfies readonly HomeArchiveObject[],
  process: [
    { number: "01", title: "Concept", copy: "A personality, a gesture, and a story establish the object before its form." },
    { number: "02", title: "Sculpt", copy: "Proportion and expression are explored in the studio—not published as production masters." },
    { number: "03", title: "Making", copy: "Each small run is cast, assembled, and considered by hand." },
    { number: "04", title: "Finish", copy: "Surface, color, and reflected light give every object its final presence." },
  ],
} as const;
