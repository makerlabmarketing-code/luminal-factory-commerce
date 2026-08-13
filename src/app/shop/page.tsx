import type { Metadata } from "next";
import Link from "next/link";
import { Footer } from "@/components/layout/footer";
import { Header } from "@/components/layout/header";
import { Container } from "@/components/ui/container";
import {
  getShopCatalog,
  normalizeShopCatalogQuery,
  SHOP_PRODUCT_TYPES,
  SHOP_RELEASE_TYPES,
  type ShopCatalogQuery,
} from "@/features/shop/catalog-adapter";
import { ShopCollection } from "@/features/shop/shop-collection";

type ShopPageProps = Readonly<{
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}>;

export async function generateMetadata({ searchParams }: ShopPageProps): Promise<Metadata> {
  const query = normalizeShopCatalogQuery(await searchParams);
  const hasActiveQuery = Boolean(query.q || query.type || query.release || query.page > 1);

  return {
    title: hasActiveQuery ? "Kết quả tìm kiếm trong Shop" : "Shop",
    description: "Published Luminal Factory object catalog with server-side search, filters and safe pagination.",
    alternates: { canonical: "/shop" },
    robots: hasActiveQuery ? { index: false, follow: true } : undefined,
    openGraph: {
      title: "Luminal Factory Shop",
      description: "Published artisan keycaps and collectible objects from the Luminal Factory catalog.",
      url: "/shop",
    },
  };
}

const productTypeLabels: Record<(typeof SHOP_PRODUCT_TYPES)[number], string> = {
  artisan_keycap: "Artisan keycap",
  collectible_object: "Collectible object",
  custom_object: "Custom object",
  other: "Other",
};

const releaseTypeLabels: Record<(typeof SHOP_RELEASE_TYPES)[number], string> = {
  direct: "Direct",
  preorder: "Preorder",
  informational: "Informational",
};

function pageHref(query: ShopCatalogQuery, page: number) {
  const params = new URLSearchParams();
  if (query.q) params.set("q", query.q);
  if (query.type) params.set("type", query.type);
  if (query.release) params.set("release", query.release);
  if (page > 1) params.set("page", String(page));
  const suffix = params.toString();
  return suffix ? `/shop?${suffix}` : "/shop";
}

export default async function ShopPage({ searchParams }: ShopPageProps) {
  const rawSearchParams = await searchParams;
  const catalog = await getShopCatalog(rawSearchParams);
  const isLiveCatalog = catalog.source === "commerce-catalog";
  const hasActiveQuery = Boolean(catalog.query.q || catalog.query.type || catalog.query.release || catalog.query.page > 1);

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
                ? "Shop đang đọc các object đã publish từ Commerce catalog. Search, filter và pagination đều chạy server-side; cart, checkout, payment và order creation vẫn chưa mở trong Phase 5."
                : "Commerce catalog hiện chưa được cấu hình hoặc tạm thời không truy cập được trên deployment này, nên Shop đang dùng presentation fallback đã kiểm duyệt."}
            </p>
          </section>

          <section className="shop-route-section" aria-labelledby="shop-filter-title">
            <div className="shop-route-heading">
              <p className="eyebrow">Catalog controls</p>
              <h2 id="shop-filter-title">Tìm và lọc object</h2>
            </div>
            <form action="/shop" method="get">
              <p>
                <label htmlFor="shop-query">Tìm kiếm</label><br />
                <input id="shop-query" name="q" type="search" maxLength={80} defaultValue={catalog.query.q} placeholder="Tên hoặc mô tả object" />
              </p>
              <p>
                <label htmlFor="shop-type">Loại object</label><br />
                <select id="shop-type" name="type" defaultValue={catalog.query.type ?? ""}>
                  <option value="">Tất cả</option>
                  {SHOP_PRODUCT_TYPES.map((value) => <option key={value} value={value}>{productTypeLabels[value]}</option>)}
                </select>
              </p>
              <p>
                <label htmlFor="shop-release">Kiểu phát hành</label><br />
                <select id="shop-release" name="release" defaultValue={catalog.query.release ?? ""}>
                  <option value="">Tất cả</option>
                  {SHOP_RELEASE_TYPES.map((value) => <option key={value} value={value}>{releaseTypeLabels[value]}</option>)}
                </select>
              </p>
              <p className="actions">
                <button type="submit" className="button-link">Áp dụng</button>
                {hasActiveQuery ? <Link href="/shop">Đặt lại</Link> : null}
              </p>
            </form>
          </section>

          <ShopCollection entries={catalog.entries} source={catalog.source} />

          {(catalog.query.page > 1 || catalog.hasNextPage) ? (
            <nav className="actions" aria-label="Phân trang Shop">
              {catalog.query.page > 1 ? <Link href={pageHref(catalog.query, catalog.query.page - 1)}>← Trang trước</Link> : <span />}
              <span>Trang {catalog.query.page}</span>
              {catalog.hasNextPage ? <Link href={pageHref(catalog.query, catalog.query.page + 1)}>Trang sau →</Link> : null}
            </nav>
          ) : null}
        </Container>
      </main>
      <Footer />
    </>
  );
}
