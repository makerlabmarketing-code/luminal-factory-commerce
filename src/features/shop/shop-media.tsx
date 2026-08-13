"use client";

import Image from "next/image";
import { useState } from "react";
import type { ShopPresentationEntry } from "./shop-content";

type ShopMediaProps = Readonly<{
  media: ShopPresentationEntry["media"];
  priority?: boolean;
}>;

export function ShopMedia({ media, priority = false }: ShopMediaProps) {
  const [hasLoadError, setHasLoadError] = useState(false);
  const hasCatalogAsset = media.source === "commerce-catalog" && media.productionApproved && !hasLoadError;

  return (
    <div
      className={`shop-media shop-media-${media.tone}`}
      role={hasCatalogAsset ? undefined : "img"}
      aria-label={hasCatalogAsset ? undefined : media.alt}
    >
      {hasCatalogAsset && media.type === "image" ? (
        <Image
          className="shop-media-asset"
          src={media.src}
          alt={media.alt}
          fill
          sizes="(max-width: 900px) 100vw, 33vw"
          priority={priority}
          onError={() => setHasLoadError(true)}
          style={{ objectFit: "cover", objectPosition: media.objectPosition }}
        />
      ) : null}
      {hasCatalogAsset && media.type === "video" ? (
        <video
          className="shop-media-asset"
          src={media.src}
          aria-label={media.alt}
          controls
          muted
          playsInline
          preload="metadata"
          onError={() => setHasLoadError(true)}
        />
      ) : null}
      {!hasCatalogAsset ? <span aria-hidden="true" /> : null}
      <em>{hasLoadError ? media.placeholderFallback : media.label}</em>
    </div>
  );
}
