export type HomeMediaContract = Readonly<{
  src: `/images/home/${string}.webp`;
  alt: string;
  sizes: string;
  objectPosition: string;
  availability: "pending" | "available";
}>;

type HomePageMediaConfig = Readonly<{
  hero: HomeMediaContract;
  featured: HomeMediaContract;
  archive: Readonly<{
    meowhe: HomeMediaContract;
    monoMeowhe: HomeMediaContract;
    mictlan: HomeMediaContract;
  }>;
}>;

/**
 * Stable browser-media contract for the Homepage Media Pass.
 *
 * Keep entries pending until the matching optimized file has been installed in
 * public/images/home. Pending entries render the designed fallback and never
 * emit an image request, so an asset-only follow-up cannot create production
 * 404s while photography is still being transferred.
 */
export const homePageMedia: HomePageMediaConfig = {
  hero: {
    src: "/images/home/hero.webp",
    alt: "Mono Meowhe artisan keycap in black and white",
    sizes: "(max-width: 800px) calc(100vw - 2rem), (max-width: 1200px) 48vw, 640px",
    objectPosition: "50% 68%",
    availability: "pending",
  },
  featured: {
    src: "/images/home/featured.webp",
    alt: "Mono Meowhe artisan keycap from the 2023 Lazy Factory archive",
    sizes: "(max-width: 800px) calc(100vw - 2rem), (max-width: 1200px) 58vw, 820px",
    objectPosition: "50% 64%",
    availability: "pending",
  },
  archive: {
    meowhe: {
      src: "/images/home/archive-meowhe.webp",
      alt: "Meowhe artisan keycap from the Lazy Factory archive",
      sizes: "(max-width: 500px) calc(100vw - 2rem), (max-width: 800px) 48vw, 30vw",
      objectPosition: "50% 48%",
      availability: "pending",
    },
    monoMeowhe: {
      src: "/images/home/archive-mono-meowhe.webp",
      alt: "Mono Meowhe artisan keycap in black and white",
      sizes: "(max-width: 500px) calc(100vw - 2rem), (max-width: 800px) 48vw, 30vw",
      objectPosition: "50% 64%",
      availability: "pending",
    },
    mictlan: {
      src: "/images/home/archive-mictlan.webp",
      alt: "Mictlán artisan keycap from the Lazy Factory archive",
      sizes: "(max-width: 500px) calc(100vw - 2rem), (max-width: 800px) 48vw, 30vw",
      objectPosition: "50% 50%",
      availability: "pending",
    },
  },
};
