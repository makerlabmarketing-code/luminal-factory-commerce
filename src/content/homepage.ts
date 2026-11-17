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
  recordHref: "/archive/meowhe-lolipop" | "/archive/meowhe-mono" | "/archive/meowhe-mictlan";
  title: string;
  collection: string;
  year: string;
  tone: "ice" | "lavender" | "rose" | "smoke";
}>;

export const homePageContent = {
  hero: {
    eyebrow: "Luminal Revival · 2026",
    title: "Artisan objects, shaped by light.",
    description:
      "A new chapter for our small-batch artisan objects—formed slowly, finished by hand, and released with intention.",
    primaryAction: { label: "Explore Raffles", href: "/raffle" },
    secondaryAction: { label: "View Archive", href: "/archive" },
  },
  featured: {
    index: "01 / Featured object",
    title: "Mono Meowhe",
    collection: "Historical Lazy Factory archive · 2023",
    story:
      "A monochrome Meowhe character from the studio's 2023 chapter—sculpted with a mischievous expression and preserved as part of the bridge from Lazy Factory to Luminal Factory.",
  },
  archive: [
    { mediaKey: "meowhe", recordHref: "/archive/meowhe-lolipop", title: "Meowhe", collection: "Lazy Factory archive", year: "2023", tone: "lavender" },
    { mediaKey: "monoMeowhe", recordHref: "/archive/meowhe-mono", title: "Mono Meowhe", collection: "Lazy Factory archive", year: "2023", tone: "ice" },
    { mediaKey: "mictlan", recordHref: "/archive/meowhe-mictlan", title: "Mictlán", collection: "Lazy Factory archive", year: "2023", tone: "rose" },
  ] satisfies readonly HomeArchiveObject[],
  process: [
    { number: "01", title: "Concept", copy: "Every character starts with an idea." },
    { number: "02", title: "Sculpt", copy: "Form and expression take shape digitally." },
    { number: "03", title: "Making", copy: "Cast and assembled in small batches." },
    { number: "04", title: "Finish", copy: "Every piece is finished by hand." },
  ],
} as const;
