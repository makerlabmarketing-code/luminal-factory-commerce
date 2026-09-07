/** Presentation fixture contract retained for the shared MediaCard primitive. */
export type PresentationCreation = Readonly<{
  id: string;
  title: string;
  category: string;
  status: "Khái niệm" | "Lưu trữ" | "Sắp tới";
  tone: string;
}>;

export type HomeArchiveObject = Readonly<{
  mediaKey: "meowhe" | "monoMeowhe" | "mictlan";
  title: string;
  collection: string;
  year: string;
  tone: "ice" | "lavender" | "rose" | "smoke";
}>;

export const homePageContent = {
  hero: {
    eyebrow: "Luminal Revival · 2026",
    title: "Mono Meowhe, shaped by light.",
    description:
      "A new chapter for our small-batch artisan objects—formed slowly, finished by hand, and released with intention.",
    primaryAction: { label: "Explore the Archive", href: "/archive" },
    secondaryAction: { label: "Shop objects", href: "/shop" },
  },
  featured: {
    index: "01 / Featured object",
    title: "Mono Meowhe",
    collection: "Historical Lazy Factory archive · 2023",
    story:
      "A monochrome Meowhe character from the studio's 2023 chapter—sculpted with a mischievous expression and preserved as part of the bridge from Lazy Factory to Luminal Factory.",
  },
  archive: [
    { mediaKey: "meowhe", title: "Meowhe", collection: "Lazy Factory archive", year: "2023", tone: "lavender" },
    { mediaKey: "monoMeowhe", title: "Mono Meowhe", collection: "Lazy Factory archive", year: "2023", tone: "ice" },
    { mediaKey: "mictlan", title: "Mictlán", collection: "Lazy Factory archive", year: "2023", tone: "rose" },
  ] satisfies readonly HomeArchiveObject[],
  process: [
    { number: "01", title: "Concept", copy: "A personality, a gesture, and a story establish the object before its form." },
    { number: "02", title: "Sculpt", copy: "Proportion and expression are explored in the studio—not published as production masters." },
    { number: "03", title: "Making", copy: "Each small run is cast, assembled, and considered by hand." },
    { number: "04", title: "Finish", copy: "Surface, color, and reflected light give every object its final presence." },
  ],
} as const;
