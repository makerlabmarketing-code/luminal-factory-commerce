import type { Metadata } from "next";
import { Footer } from "@/components/layout/footer";
import { Header } from "@/components/layout/header";
import { Container } from "@/components/ui/container";
import { CartPage } from "@/features/cart/cart-page";
import { getServerCartPageView } from "@/features/cart/cart-page-service";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const metadata: Metadata = {
  title: "Giỏ hàng",
  description: "Xem lại lựa chọn direct-shop tại Luminal Factory.",
  robots: { index: false, follow: false },
};

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
