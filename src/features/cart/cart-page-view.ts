import type { CartCatalogPresentation } from "./cart-catalog-normalizer";
import type { CartLineIdentity, CartPageView } from "./cart-page-contract";
import type { CustomerCartServiceResult } from "./customer-cart-service";
import type { GuestCartResult, GuestCartView } from "./guest-cart-service";

type CartPageViewDependencies = Readonly<{
  enabled: boolean;
  guestToken?: string;
  readCart: (guestToken: string) => Promise<GuestCartResult>;
  enrichCatalog: (lines: readonly CartLineIdentity[]) => Promise<CartCatalogPresentation | null>;
}>;

export const emptyCartPageView: CartPageView = { state: "empty", currency: "VND", unavailableLineCount: 0 };
export const unavailableCartPageView: CartPageView = { state: "unavailable", currency: "VND", unavailableLineCount: 0 };
export const syncRequiredCartPageView: CartPageView = {
  state: "sync_required",
  currency: "VND",
  unavailableLineCount: 0,
};

async function presentCart(
  cart: GuestCartView | null,
  enrichCatalog: (lines: readonly CartLineIdentity[]) => Promise<CartCatalogPresentation | null>,
): Promise<CartPageView> {
  if (!cart || (cart.lines.length === 0 && cart.unavailableLineCount === 0)) return emptyCartPageView;

  const presentation = await enrichCatalog(cart.lines);
  if (!presentation) return unavailableCartPageView;
  return {
    state: "ready",
    currency: "VND",
    expiresAt: cart.expiresAt,
    lines: presentation.lines,
    unavailableLineCount: cart.unavailableLineCount + presentation.staleLineCount,
    estimateStatus: presentation.estimateStatus,
    ...(presentation.subtotalMinor === undefined ? {} : { subtotalMinor: presentation.subtotalMinor }),
    ...(presentation.subtotalLabel === undefined ? {} : { subtotalLabel: presentation.subtotalLabel }),
  };
}

export async function createCartPageView(dependencies: CartPageViewDependencies): Promise<CartPageView> {
  if (!dependencies.enabled) return unavailableCartPageView;
  if (!dependencies.guestToken) return emptyCartPageView;
  const cartResult = await dependencies.readCart(dependencies.guestToken);
  if (!cartResult.ok) {
    return cartResult.code === "cart_unavailable" ? emptyCartPageView : unavailableCartPageView;
  }
  return presentCart(cartResult.cart, dependencies.enrichCatalog);
}

export async function createCustomerCartPageView(dependencies: Readonly<{
  enabled: boolean;
  hasGuestToken: boolean;
  readCart: () => Promise<CustomerCartServiceResult>;
  enrichCatalog: (lines: readonly CartLineIdentity[]) => Promise<CartCatalogPresentation | null>;
}>): Promise<CartPageView> {
  if (!dependencies.enabled) return unavailableCartPageView;
  if (dependencies.hasGuestToken) return syncRequiredCartPageView;
  const cartResult = await dependencies.readCart();
  if (!cartResult.ok) return unavailableCartPageView;
  return presentCart(cartResult.cart, dependencies.enrichCatalog);
}
