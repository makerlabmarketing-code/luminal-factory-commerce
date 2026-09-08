"use client";

import Image from "next/image";
import { useRef } from "react";
import type { PointerEvent } from "react";
import type { HomeMediaContract } from "@/content/homepage-media";

type HeroObjectStageProps = Readonly<{
  media: HomeMediaContract;
}>;

const LENS_SIZE = 176;

/**
 * Stable presentation boundary for the Homepage hero object.
 *
 * The current renderer intentionally stays image-based. When the approved GLB
 * is available, the WebGL renderer can replace the internals of this component
 * without changing the Homepage layout or its content contract.
 */
export function HeroObjectStage({ media }: HeroObjectStageProps) {
  const lensRef = useRef<HTMLDivElement>(null);

  const moveLens = (event: PointerEvent<HTMLDivElement>) => {
    if (!lensRef.current || !window.matchMedia("(hover: hover) and (pointer: fine)").matches) return;

    const bounds = event.currentTarget.getBoundingClientRect();
    const localX = Math.min(Math.max(event.clientX - bounds.left, 0), bounds.width);
    const localY = Math.min(Math.max(event.clientY - bounds.top, 0), bounds.height);
    const xPercent = bounds.width === 0 ? 50 : (localX / bounds.width) * 100;
    const yPercent = bounds.height === 0 ? 50 : (localY / bounds.height) * 100;
    const halfLens = LENS_SIZE / 2;
    const lensX = Math.min(Math.max(localX, halfLens), Math.max(bounds.width - halfLens, halfLens));
    const lensY = Math.min(Math.max(localY, halfLens), Math.max(bounds.height - halfLens, halfLens));

    lensRef.current.style.left = `${lensX}px`;
    lensRef.current.style.top = `${lensY}px`;
    lensRef.current.style.backgroundPosition = `${xPercent}% ${yPercent}%`;
    lensRef.current.style.opacity = "1";
  };

  const hideLens = () => {
    if (lensRef.current) lensRef.current.style.opacity = "0";
  };

  return (
    <div
      className="hero-object-stage group cursor-crosshair"
      data-hero-renderer="static-fallback"
      onPointerMove={moveLens}
      onPointerLeave={hideLens}
    >
      {media.availability === "available" ? (
        <>
          <Image
            className="home-product-image hero-product-image"
            src={media.src}
            alt={media.alt}
            fill
            priority
            sizes={media.sizes}
            style={{ objectPosition: media.objectPosition }}
          />
          <div
            ref={lensRef}
            className="pointer-events-none absolute z-20 hidden size-44 -translate-x-1/2 -translate-y-1/2 rounded-full border-[3px] border-white bg-no-repeat opacity-0 shadow-[0_1.5rem_5rem_rgba(0,0,0,0.55),0_0_0_1px_rgba(0,0,0,0.75)] transition-opacity duration-150 md:block motion-reduce:hidden"
            style={{
              backgroundImage: `url(${media.src})`,
              backgroundSize: "240% auto",
              backgroundPosition: "50% 50%",
            }}
            aria-hidden="true"
          />
          <span className="pointer-events-none absolute bottom-4 right-4 z-10 hidden rounded-full border border-white/15 bg-black/45 px-3 py-1.5 text-[10px] uppercase tracking-[0.18em] text-white/55 backdrop-blur-sm md:block" aria-hidden="true">
            Move to inspect
          </span>
        </>
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
