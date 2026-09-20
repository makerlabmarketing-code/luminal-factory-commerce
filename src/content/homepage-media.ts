export type HomeMediaContract = Readonly<{
  src: `/images/home/${string}.webp`;
  alt: string;
  sizes: string;
  objectPosition: string;
  availability: "pending" | "available";
}>;

export type HomeGalleryMedia = Readonly<{
  id: string;
  src: `/images/home/gallery/${string}.webp`;
  alt: string;
  colorway: "Lolipop" | "Mictlán" | "Mono";
  frame: "portrait" | "square" | "landscape";
  objectPosition?: string;
}>;

type HomePageMediaConfig = Readonly<{
  hero: HomeMediaContract;
  featured: HomeMediaContract;
  archive: Readonly<{
    meowhe: HomeMediaContract;
    monoMeowhe: HomeMediaContract;
    mictlan: HomeMediaContract;
  }>;
  gallery: readonly HomeGalleryMedia[];
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
    src: "/images/home/archive-meowhe.webp",
    alt: "Lolipop Meowhe artisan keycap from the first colorway collection",
    sizes: "(max-width: 800px) calc(100vw - 2rem), (max-width: 1200px) 48vw, 640px",
    objectPosition: "50% 48%",
    availability: "available",
  },
  featured: {
    src: "/images/home/featured.webp",
    alt: "Mono Meowhe artisan keycap from the 2023 Lazy Factory archive",
    sizes: "(max-width: 800px) calc(100vw - 2rem), (max-width: 1200px) 63vw, 930px",
    objectPosition: "50% 64%",
    availability: "available",
  },
  archive: {
    meowhe: {
      src: "/images/home/archive-meowhe.webp",
      alt: "Meowhe artisan keycap from the Lazy Factory archive",
      sizes: "(max-width: 500px) calc(100vw - 2rem), (max-width: 800px) 48vw, (max-width: 1440px) 34vw, 500px",
      objectPosition: "50% 48%",
      availability: "available",
    },
    monoMeowhe: {
      src: "/images/home/archive-mono-meowhe.webp",
      alt: "Mono Meowhe artisan keycap in black and white",
      sizes: "(max-width: 500px) calc(100vw - 2rem), (max-width: 800px) 48vw, (max-width: 1440px) 27vw, 390px",
      objectPosition: "50% 64%",
      availability: "available",
    },
    mictlan: {
      src: "/images/home/gallery/mictlan-keyboard.webp",
      alt: "Mictlán artisan keycap placed among black keyboard keys",
      sizes: "(max-width: 500px) calc(100vw - 2rem), (max-width: 800px) 48vw, (max-width: 1440px) 34vw, 500px",
      objectPosition: "50% 50%",
      availability: "available",
    },
  },
  gallery: [
    {
      id: "lolipop-garden",
      src: "/images/home/gallery/lolipop-garden.webp",
      alt: "Lolipop Meowhe artisan keycap nestled in green succulent leaves",
      colorway: "Lolipop",
      frame: "portrait",
      objectPosition: "50% 54%",
    },
    {
      id: "mictlan-keyboard",
      src: "/images/home/gallery/mictlan-keyboard.webp",
      alt: "Mictlán artisan keycap placed among black keyboard keys",
      colorway: "Mictlán",
      frame: "square",
    },
    {
      id: "mono-cookie-open",
      src: "/images/home/gallery/mono-cookie-open.webp",
      alt: "Mono Meowhe artisan keycap staged with black and white sandwich cookies",
      colorway: "Mono",
      frame: "landscape",
      objectPosition: "50% 62%",
    },
    {
      id: "lolipop-pastel-keys",
      src: "/images/home/gallery/lolipop-pastel-keys.webp",
      alt: "Lolipop Meowhe artisan keycap on a pastel mechanical keyboard",
      colorway: "Lolipop",
      frame: "square",
    },
    {
      id: "mictlan-skull-pair",
      src: "/images/home/gallery/mictlan-skull-pair.webp",
      alt: "Two Mictlán artisan keycaps arranged beside a skull study",
      colorway: "Mictlán",
      frame: "portrait",
      objectPosition: "50% 48%",
    },
    {
      id: "mono-cookie-stack",
      src: "/images/home/gallery/mono-cookie-stack.webp",
      alt: "Mono Meowhe artisan keycap framed by stacked sandwich cookies",
      colorway: "Mono",
      frame: "portrait",
    },
    {
      id: "lolipop-candy-stones",
      src: "/images/home/gallery/lolipop-candy-stones.webp",
      alt: "Lolipop Meowhe artisan keycap resting on colorful candy stones",
      colorway: "Lolipop",
      frame: "landscape",
    },
    {
      id: "mictlan-skull-study",
      src: "/images/home/gallery/mictlan-skull-study.webp",
      alt: "Mictlán artisan keycap centered against a pale skull",
      colorway: "Mictlán",
      frame: "landscape",
    },
    {
      id: "mono-cookie-portrait",
      src: "/images/home/gallery/mono-cookie-portrait.webp",
      alt: "Mono Meowhe artisan keycap presented on a single sandwich cookie",
      colorway: "Mono",
      frame: "square",
    },
  ],
};
