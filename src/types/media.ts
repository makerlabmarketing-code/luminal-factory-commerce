export type PresentationMediaKind = "image" | "video";

export type PresentationMediaSource =
  | "lazyfactory-historical-archive"
  | "luminal-current-brand"
  | "commerce-catalog"
  | "internal-placeholder";

export type PresentationMedia = Readonly<{
  type: PresentationMediaKind;
  src: string;
  alt: string;
  width: number;
  height: number;
  aspectRatio: string;
  poster?: string;
  credit: string;
  source: PresentationMediaSource;
  historicalBrand: boolean;
  productionApproved: boolean;
  focalPoint?: string;
  objectPosition?: string;
  placeholderFallback: string;
}>;
