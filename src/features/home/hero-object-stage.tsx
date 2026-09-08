import Image from "next/image";
import type { HomeMediaContract } from "@/content/homepage-media";

type HeroObjectStageProps = Readonly<{
  media: HomeMediaContract;
}>;

/**
 * Stable presentation boundary for the Homepage hero object.
 *
 * The current renderer intentionally stays image-based. When the approved GLB
 * is available, the WebGL renderer can replace the internals of this component
 * without changing the Homepage layout or its content contract.
 */
export function HeroObjectStage({ media }: HeroObjectStageProps) {
  return (
    <div className="hero-object-stage" data-hero-renderer="static-fallback">
      {media.availability === "available" ? (
        <Image
          className="home-product-image hero-product-image"
          src={media.src}
          alt={media.alt}
          fill
          priority
          sizes={media.sizes}
          style={{ objectPosition: media.objectPosition }}
        />
      ) : (
        <>
          <span className="hero-object-silhouette" aria-hidden="true" />
          <p className="home-media-pending">
            {media.alt}<br />
            <span>Approved product media pending sync</span>
          </p>
        </>
      )}
      <div className="hero-object-vignette" aria-hidden="true" />
    </div>
  );
}
