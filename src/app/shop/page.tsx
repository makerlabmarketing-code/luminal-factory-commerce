import type { Metadata } from "next";
import { Footer } from "@/components/layout/footer";
import { Header } from "@/components/layout/header";
import { Container } from "@/components/ui/container";
import { getShopCatalog } from "@/features/shop/catalog-adapter";
import { ShopCollection } from "@/features/shop/shop-collection";

export const metadata: Metadata = {
  title: "Shop | Luminal Factory",
  description: "Published Luminal Factory object catalog with a safe presentation fallback when Commerce data is unavailable.",
};

export default async function ShopPage() {
  const catalog = await getShopCatalog();
  const isLiveCatalog = catalog.source === "commerce-catalog";

  return (
    <>
      <Header />
      <main id="main-content" className="shop-route">
        <Container>
          <section className="shop-route-hero" aria-labelledby="shop-title">
            <p className="eyebrow">Luminal shop</p>
            <h1 id="shop-title">Object catalog, presented without pretending checkout is already open.</h1>
            <p>
              {isLiveCatalog
                ? "Shop đang đọc các object đã publish từ Commerce catalog. Giá có thể được hiển thị khi catalog có giá active, nhưng cart, checkout, payment và order creation vẫn chưa mở trong Phase 5."
                : "Commerce catalog hiện chưa được cấu hình hoặc tạm thời không truy cập được trên deployment này, nên Shop đang dùng presentation fallback đã kiểm duyệt. Không có cart, checkout, payment hoặc order creation."}
            </p>
          </section>
          <ShopCollection entries={catalog.entries} source={catalog.source} />
        </Container>
      </main>
      <Footer />
    </>
  );
}
