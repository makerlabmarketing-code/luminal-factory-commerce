import type { CSSProperties } from "react";
export type FlexCarouselItem = Readonly<{ src: string; alt: string; title?: string; subtitle?: string }>;
export type FlexCarouselProps = Readonly<{
  items: readonly FlexCarouselItem[]; preset?: "liquid" | "ribbon" | "vortex" | "arch";
  intro?: "rise" | "bloom" | "spin" | "deal" | "fade"; cardHeight?: number; gap?: number; radius?: number;
  fit?: "natural" | "portrait" | "square" | "landscape";
  lensWidth?: number; lensHeight?: number; tilt?: number; roundness?: number; bend?: number;
  reach?: number; curl?: "twist" | "rise"; dispersion?: number; liquid?: number; followCursor?: boolean;
  squeeze?: number; focusOnClick?: boolean; autoplay?: boolean; interval?: number;
  captions?: boolean; captureWheel?: boolean; className?: string; style?: CSSProperties;
  ariaLabel?: string; previousLabel?: string; nextLabel?: string; onReady?: () => void; onError?: () => void;
  onChange?: (index: number, item: FlexCarouselItem) => void;
  onSelect?: (index: number, item: FlexCarouselItem) => void;
}>;
export default function FlexCarousel(props: FlexCarouselProps): import("react").ReactNode;
