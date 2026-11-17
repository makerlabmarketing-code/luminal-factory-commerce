import { shopPublicEnabled } from "@/features/shop/shop-public-gate";

export const navigation = [
  { href: "/raffle", label: "Raffle", isAvailable: true },
  { href: "/archive", label: "Archive", isAvailable: true },
  { href: "/shop", label: "Shop", isAvailable: true },
  { href: "/commission", label: "Commission", isAvailable: true },
  { href: "/about", label: "About", isAvailable: true },
] as const;

// Preserve the future Shop entry while hiding it from all public menus.
export const publicNavigation = navigation.filter((item) => item.href !== "/shop" || shopPublicEnabled);
