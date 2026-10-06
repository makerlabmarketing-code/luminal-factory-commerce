"use client";
import { useTranslator } from "@/lib/i18n/client";


import Image from "next/image";
import { useState } from "react";
import type { ShopPresentationEntry } from "./shop-content";

type ShopMediaProps = Readonly<{
  media: ShopPresentationEntry["media"];
  priority?: boolean;
  sizes?: string;
}>;

export function ShopMedia({ media, priority = false, sizes = "(max-width: 900px) 100vw, 33vw" }: ShopMediaProps) {
  const tr = useTranslator();
  const [hasLoadError, setHasLoadError] = useState(false);
  const hasCatalogAsset = media.source === "commerce-catalog" && media.productionApproved && !hasLoadError;

  return (
    <div
      className={`shop-media shop-media-${media.tone}`}
      role={hasCatalogAsset ? undefined : "img"}
      aria-label={hasCatalogAsset ? undefined : tr(media.alt)}
    >
      {hasCatalogAsset && media.type === "image" ? (
        <Image
          className="shop-media-asset"
          src={media.src}
          alt={tr(media.alt)}
          fill
          sizes={sizes}
          priority={priority}
          onError={() => setHasLoadError(true)}
          style={{ objectFit: "cover", objectPosition: media.objectPosition }}
        />
      ) : null}
      {hasCatalogAsset && media.type === "video" ? (
        <video
          className="shop-media-asset"
          src={media.src}
          aria-label={tr(media.alt)}
          controls
          muted
          playsInline
          preload="metadata"
          onError={() => setHasLoadError(true)}
        />
      ) : null}
      {!hasCatalogAsset ? <span aria-hidden="true" /> : null}
      <em>{hasLoadError ? tr("Object image unavailable") : tr(media.label)}</em>
    </div>
  );
}
