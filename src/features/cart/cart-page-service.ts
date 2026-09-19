import "server-only";

import { cookies } from "next/headers";
import { getCartCatalogPresentation } from "./cart-catalog-presentation";
import type { CartPageView } from "./cart-page-contract";
import {
  createCartPageView,
  createCustomerCartPageView,
  unavailableCartPageView,
} from "./cart-page-view";
import { GUEST_CART_COOKIE_NAME } from "./guest-cart-service";
import { createServerCustomerCartIdentityResolver } from "@/lib/supabase/customer-cart-identity-server";
import { getServerCustomerCartService } from "@/lib/supabase/customer-cart-server";
import { getServerGuestCartService } from "@/lib/supabase/guest-cart-server";

export async function getServerCartPageView(): Promise<CartPageView> {
  const guestEnabled = process.env.COMMERCE_GUEST_CART_ENABLED?.trim().toLowerCase() === "true";
  const authEnabled = process.env.COMMERCE_CUSTOMER_AUTH_ENABLED?.trim().toLowerCase() === "true";
  const customerEnabled = process.env.COMMERCE_CUSTOMER_CART_ENABLED?.trim().toLowerCase() === "true";
  if (!guestEnabled && !(authEnabled && customerEnabled)) return unavailableCartPageView;

  const cookieStore = await cookies();
  const guestToken = cookieStore.get(GUEST_CART_COOKIE_NAME)?.value;
  if (authEnabled) {
    const resolvedIdentity = await createServerCustomerCartIdentityResolver(cookieStore).resolve();
    if (resolvedIdentity.state === "identity_unavailable") return unavailableCartPageView;
    if (resolvedIdentity.state === "verified_customer") {
      const service = getServerCustomerCartService();
      return createCustomerCartPageView({
        enabled: customerEnabled,
        hasGuestToken: Boolean(guestToken),
        readCart: () => service.read(resolvedIdentity.identity),
        enrichCatalog: getCartCatalogPresentation,
      });
    }
  }

  const service = getServerGuestCartService();
  return createCartPageView({
    enabled: guestEnabled,
    guestToken,
    readCart: (token) => service.read(token),
    enrichCatalog: getCartCatalogPresentation,
  });
}
