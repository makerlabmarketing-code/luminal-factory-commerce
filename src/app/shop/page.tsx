import type { Metadata } from "next";
import Link from "next/link";
import { Footer } from "@/components/layout/footer";
import { Header } from "@/components/layout/header";
import { Container } from "@/components/ui/container";
import { ShopCollection } from "@/features/shop/shop-collection";
import { getCuratedShopEntries } from "@/features/shop/shop-content";

export const metadata: Metadata = {
  title: "Shop | Luminal Factory",
  description: "Presentation-only shop discovery foundation for future directly available Luminal Factory collectibles.",
};

export default function ShopPage() {
  const entries = getCuratedShopEntries();

  return (
    <>
      <Header />
      <main id="main-content" className="shop-route">
        <Container>
          <section className="shop-route-hero" aria-labelledby="shop-title">
            <p className="eyebrow">Luminal shop</p>
            <h1 id="shop-title">A restrained shelf for future direct collectible discovery.</h1>
            <p>
              Shop là route foundation cho các object có thể mua trực tiếp trong tương lai. Hiện tại nội dung chỉ là presentation placeholder: chưa có giá, tồn kho, cart, checkout, payment, order hoặc Supabase catalog.
            </p>
            <Link href="/#raffle">Quay về raffle discovery</Link>
          </section>
          <ShopCollection entries={entries} />
        </Container>
      </main>
      <Footer />
    </>
  );
}
