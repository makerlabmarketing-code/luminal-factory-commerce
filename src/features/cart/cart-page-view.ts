import type { CartCatalogPresentation } from "./cart-catalog-normalizer";
import type { CartLineIdentity, CartPageView } from "./cart-page-contract";
import type { GuestCartResult } from "./guest-cart-service";

type CartPageViewDependencies = Readonly<{
  enabled: boolean;
  guestToken?: string;
  readCart: (guestToken: string) => Promise<GuestCartResult>;
  enrichCatalog: (lines: readonly CartLineIdentity[]) => Promise<CartCatalogPresentation | null>;
}>;

export const emptyCartPageView: CartPageView = { state: "empty", currency: "VND", unavailableLineCount: 0 };
export const unavailableCartPageView: CartPageView = { state: "unavailable", currency: "VND", unavailableLineCount: 0 };

export async function createCartPageView(dependencies: CartPageViewDependencies): Promise<CartPageView> {
  if (!dependencies.enabled) return unavailableCartPageView;
  if (!dependencies.guestToken) return emptyCartPageView;
  const cartResult = await dependencies.readCart(dependencies.guestToken);
  if (!cartResult.ok) {
    return cartResult.code === "cart_unavailable" ? emptyCartPageView : unavailableCartPageView;
  }
  if (cartResult.cart.lines.length === 0 && cartResult.cart.unavailableLineCount === 0) return emptyCartPageView;

  const presentation = await dependencies.enrichCatalog(cartResult.cart.lines);
  if (!presentation) return unavailableCartPageView;
  return {
    state: "ready",
    currency: "VND",
    expiresAt: cartResult.cart.expiresAt,
    lines: presentation.lines,
    unavailableLineCount: cartResult.cart.unavailableLineCount + presentation.staleLineCount,
    estimateStatus: presentation.estimateStatus,
    ...(presentation.subtotalMinor === undefined ? {} : { subtotalMinor: presentation.subtotalMinor }),
    ...(presentation.subtotalLabel === undefined ? {} : { subtotalLabel: presentation.subtotalLabel }),
  };
}
