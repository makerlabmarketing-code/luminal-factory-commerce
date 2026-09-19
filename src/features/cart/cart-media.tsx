"use client";

import Image from "next/image";
import { useState } from "react";
import type { CartPageLine } from "./cart-page-contract";

export function CartMedia({ media }: Readonly<{ media: CartPageLine["media"] }>) {
  const [hasLoadError, setHasLoadError] = useState(false);
  const hasCatalogAsset = media.source === "commerce-catalog" && media.productionApproved && !hasLoadError;

  return (
    <div
      className={`cart-line-media cart-line-media-${media.tone}`}
      role={hasCatalogAsset ? undefined : "img"}
      aria-label={hasCatalogAsset ? undefined : media.alt}
    >
      {hasCatalogAsset ? (
        <Image
          className="cart-line-media-asset"
          src={media.src}
          alt={media.alt}
          fill
          sizes="(max-width: 600px) 35vw, 11rem"
          onError={() => setHasLoadError(true)}
          style={{ objectFit: "cover", objectPosition: media.objectPosition }}
        />
      ) : (
        <span aria-hidden="true" />
      )}
      <em>{hasLoadError ? media.placeholderFallback : media.label}</em>
    </div>
  );
}
