import "server-only";

import { cookies } from "next/headers";
import { getCartCatalogPresentation } from "./cart-catalog-presentation";
import type { CartPageView } from "./cart-page-contract";
import { createCartPageView, unavailableCartPageView } from "./cart-page-view";
import { GUEST_CART_COOKIE_NAME } from "./guest-cart-service";
import { getServerGuestCartService } from "@/lib/supabase/guest-cart-server";

export async function getServerCartPageView(): Promise<CartPageView> {
  const enabled = process.env.COMMERCE_GUEST_CART_ENABLED?.trim().toLowerCase() === "true";
  if (!enabled) return unavailableCartPageView;

  const cookieStore = await cookies();
  const guestToken = cookieStore.get(GUEST_CART_COOKIE_NAME)?.value;
  const service = getServerGuestCartService();
  return createCartPageView({
    enabled,
    guestToken,
    readCart: (token) => service.read(token),
    enrichCatalog: getCartCatalogPresentation,
  });
}
