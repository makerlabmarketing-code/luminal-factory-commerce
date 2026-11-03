"use client";

import { useEffect, useState } from "react";
import type { HomeMediaContract } from "@/content/homepage-media";
import type { HeroModelPresentation } from "./hero-model-config";
import { HeroObjectStage } from "./hero-object-stage";

export function HomeScrollModel({ media, presentation }: Readonly<{
  media: HomeMediaContract;
  presentation: HeroModelPresentation;
}>) {
  const [enabled, setEnabled] = useState(false);
  useEffect(() => {
    const desktop = matchMedia("(min-width: 1000px) and (min-height: 700px) and (hover: hover) and (pointer: fine)");
    const reduced = matchMedia("(prefers-reduced-motion: reduce)");
    const update = () => setEnabled(desktop.matches && !reduced.matches);
    update();
    desktop.addEventListener("change", update);
    reduced.addEventListener("change", update);
    return () => {
      desktop.removeEventListener("change", update);
      reduced.removeEventListener("change", update);
    };
  }, []);
  return enabled ? <HeroObjectStage media={media} presentation={{ ...presentation, autoRotate: false }} showLoadingIndicator={false} /> : null;
}
