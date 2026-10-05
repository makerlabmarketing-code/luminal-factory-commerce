import { languageAlternates } from "@/lib/i18n/locale";
import { getLocale } from "@/lib/i18n/server";
import type { Metadata } from "next";
import { Footer } from "@/components/layout/footer";
import { Header } from "@/components/layout/header";
import { Container } from "@/components/ui/container";
import { CartPage } from "@/features/cart/cart-page";
import { getServerCartPageView } from "@/features/cart/cart-page-service";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export async function generateMetadata(): Promise<Metadata> {
  const locale = await getLocale();
  return { title: locale === "vi" ? "L\u1ef1a ch\u1ecdn c\u1ee7a b\u1ea1n" : "Your selection", description: locale === "vi" ? "Xem l\u1ea1i nh\u1eefng v\u1eadt th\u1ec3 b\u1ea1n \u0111\u00e3 ch\u1ecdn t\u1ea1i Luminal Factory." : "Review your Luminal Factory selection.", alternates: languageAlternates("/cart", locale), robots: { index: false, follow: false } };
}

export default async function CartRoute() {
  const view = await getServerCartPageView();
  return (
    <>
      <Header />
      <main id="main-content" className="cart-route">
        <Container><CartPage view={view} /></Container>
      </main>
      <Footer />
    </>
  );
}
