import type { PresentationMedia } from "@/types/media";

export type CartPageLine = Readonly<{
  productId: string;
  variantId: string | null;
  slug: string;
  title: string;
  variantLabel?: string;
  requestedQuantity: number;
  unitPriceMinor?: number;
  unitPriceLabel?: string;
  lineEstimateMinor?: number;
  lineEstimateLabel?: string;
  media: PresentationMedia & Readonly<{
    label: string;
    tone: "ice" | "violet" | "rose";
  }>;
}>;

export type CartReadyView = Readonly<{
  state: "ready";
  currency: "VND";
  expiresAt: string;
  lines: readonly CartPageLine[];
  unavailableLineCount: number;
  subtotalMinor?: number;
  subtotalLabel?: string;
  estimateStatus: "complete" | "incomplete";
}>;

export type CartPageView =
  | Readonly<{ state: "empty"; currency: "VND"; unavailableLineCount: 0 }>
  | Readonly<{ state: "unavailable"; currency: "VND"; unavailableLineCount: 0 }>
  | CartReadyView;

export type CartLineIdentity = Readonly<{
  productId: string;
  variantId: string | null;
  requestedQuantity: number;
}>;
