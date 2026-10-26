import { localeHref, languageAlternates } from "@/lib/i18n/locale";

import { getTranslator, getLocale } from "@/lib/i18n/server";
import type { Metadata } from "next";
import Link from "@/lib/i18n/link";
import { Footer } from "@/components/layout/footer";
import { Header } from "@/components/layout/header";
import { Container } from "@/components/ui/container";
import {
  getShopCatalog,
  getLatestPublishedMeowhe,
  normalizeShopCatalogQuery,
  SHOP_PRODUCT_TYPES,
  SHOP_RELEASE_TYPES,
  type ShopCatalogQuery,
} from "@/features/shop/catalog-adapter";
import { ShopCollection } from "@/features/shop/shop-collection";
import { CircusDiscoveryGate } from "@/components/discovery/circus-discovery-gate";
import { meowheDiscoveryStory } from "@/components/discovery/meowhe-story";
import { CircusProductBubble } from "@/components/discovery/circus-product-bubble";

type ShopPageProps = Readonly<{
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}>;

export async function generateMetadata({ searchParams }: ShopPageProps): Promise<Metadata> {
  const locale = await getLocale();
  const tr = await getTranslator();
  const query = normalizeShopCatalogQuery(await searchParams);
  const hasActiveQuery = Boolean(query.q || query.type || query.release || query.page > 1);

  return {
    title: hasActiveQuery ? tr("Kết quả tìm kiếm trong Shop") : "Shop",
    description: tr("Explore artisan keycaps and collectible objects by Luminal Factory."),
    alternates: languageAlternates("/shop", locale),
    robots: hasActiveQuery ? { index: false, follow: true } : undefined,
    openGraph: {
      title: "Luminal Factory Shop",
      description: tr("Explore artisan keycaps and collectible objects by Luminal Factory."),
      url: localeHref("/shop", locale),
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
  const tr = await getTranslator();
  const locale = await getLocale();
  const rawSearchParams = await searchParams;
  const [catalog, newestPublishedMeowhe] = await Promise.all([
    getShopCatalog(rawSearchParams, locale),
    getLatestPublishedMeowhe(locale),
  ]);
  const isLiveCatalog = catalog.source === "commerce-catalog";
  const hasActiveQuery = Boolean(catalog.query.q || catalog.query.type || catalog.query.release || catalog.query.page > 1);

  return (
    <>
      <Header />
      <main id="main-content" className="shop-route">
        <Container>
          <section className="shop-route-hero" aria-labelledby="shop-title">
            <p className="eyebrow">{tr("Luminal shop")}</p>
            <h1 id="shop-title">Shop</h1>
            <p>
              {isLiveCatalog
                ? tr("Shop đang đọc các object đã publish từ Commerce catalog. Search, filter và pagination đều chạy server-side; cart, checkout, payment và order creation vẫn chưa mở trong Phase 5.")
                : tr("Commerce catalog hiện chưa được cấu hình hoặc tạm thời không truy cập được trên deployment này, nên Shop đang dùng presentation fallback đã kiểm duyệt.")}
            </p>
          </section>

          <CircusDiscoveryGate
            stageId="meowhe-stage"
            id="shop-discovery-content"
            heading={locale === "vi" ? "Meowhe, dưới ánh đèn" : "Meowhe, in the spotlight"}
            invitation={locale === "vi" ? "Giữa bóng tối, đôi mắt lệch và nụ cười tinh nghịch của Meowhe dần hiện ra. Mỗi phiên bản giữ một mảnh chuyện riêng." : "Out of the dark emerge Meowhe's mismatched eyes and mischievous grin. Every colorway holds another piece of the story."}
            actionLabel={locale === "vi" ? "Xem thêm" : "Show more"}
            storyLabel={locale === "vi" ? "CÂU CHUYỆN / SẢN PHẨM" : "STORY / OBJECT"}
            storyHeading={newestPublishedMeowhe?.title ?? "Meowhe"}
            storyBody={meowheDiscoveryStory(newestPublishedMeowhe, locale, "shop")}
            initiallyOpen={hasActiveQuery}
            bubbles={newestPublishedMeowhe ? <CircusProductBubble entry={newestPublishedMeowhe} locale={locale} /> : undefined}
          >
          <section className="shop-route-section" aria-labelledby="shop-filter-title">
            <div className="shop-route-heading">
              <p className="eyebrow">{tr("Catalog controls")}</p>
              <h2 id="shop-filter-title">{tr("Tìm và lọc object")}</h2>
            </div>
            <form action={localeHref("/shop", locale)} method="get">
              <p>
                <label htmlFor="shop-query">{tr("Tìm kiếm")}</label><br />
                <input id="shop-query" name="q" type="search" maxLength={80} defaultValue={catalog.query.q} placeholder={tr("Tên hoặc mô tả object")} />
              </p>
              <p>
                <label htmlFor="shop-type">{tr("Loại object")}</label><br />
                <select id="shop-type" name="type" defaultValue={catalog.query.type ?? ""}>
                  <option value="">{tr("Tất cả")}</option>
                  {SHOP_PRODUCT_TYPES.map((value) => <option key={value} value={value}>{tr(productTypeLabels[value])}</option>)}
                </select>
              </p>
              <p>
                <label htmlFor="shop-release">{tr("Kiểu phát hành")}</label><br />
                <select id="shop-release" name="release" defaultValue={catalog.query.release ?? ""}>
                  <option value="">{tr("Tất cả")}</option>
                  {SHOP_RELEASE_TYPES.map((value) => <option key={value} value={value}>{tr(releaseTypeLabels[value])}</option>)}
                </select>
              </p>
              <p className="actions">
                <button type="submit" className="button-link">{tr("Áp dụng")}</button>
                {hasActiveQuery ? <Link href="/shop">{tr("Đặt lại")}</Link> : null}
              </p>
            </form>
          </section>

          <ShopCollection entries={isLiveCatalog ? catalog.entries : []} source={catalog.source} />

          {(catalog.query.page > 1 || catalog.hasNextPage) ? (
            <nav className="actions" aria-label={tr("Phân trang Shop")}>
              {catalog.query.page > 1 ? <Link href={pageHref(catalog.query, catalog.query.page - 1)}>{tr("← Trang trước")}</Link> : <span />}
              <span>{tr("Trang")}{" "}{catalog.query.page}</span>
              {catalog.hasNextPage ? <Link href={pageHref(catalog.query, catalog.query.page + 1)}>{tr("Trang sau →")}</Link> : null}
            </nav>
          ) : null}
          </CircusDiscoveryGate>
        </Container>
      </main>
      <Footer />
    </>
  );
}
