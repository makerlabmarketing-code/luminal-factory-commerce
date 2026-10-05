import { getLocale, getTranslator } from "@/lib/i18n/server";
import { languageAlternates, localeHref } from "@/lib/i18n/locale";
import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { Footer } from "@/components/layout/footer";
import { Header } from "@/components/layout/header";
import { Container } from "@/components/ui/container";
import { getShopCatalogEntryBySlug } from "@/features/shop/catalog-adapter";
import { ShopProductDetail } from "@/features/shop/shop-product-detail";

type ShopProductDetailPageProps = Readonly<{
  params: Promise<{ slug: string }>;
}>;

// Catalog configuration can differ between build and runtime. Always resolve live slugs at request time.
export const dynamic = "force-dynamic";

export async function generateMetadata({ params }: ShopProductDetailPageProps): Promise<Metadata> {
  const locale = await getLocale();
  const tr = await getTranslator();
  const { slug } = await params;
  const entry = await getShopCatalogEntryBySlug(slug, locale);

  if (!entry || entry.dataSource !== "commerce-catalog") {
    return {
      title: tr("Không tìm thấy object"),
      description: "The requested Luminal Factory shop object was not found.",
      robots: { index: false, follow: false },
    };
  }

  const canonicalPath = `/shop/${entry.slug}`;
  const catalogImage = entry.media.source === "commerce-catalog" && entry.media.productionApproved && entry.media.type === "image"
    ? [{ url: entry.media.src, alt: entry.media.alt, width: entry.media.width, height: entry.media.height }]
    : undefined;

  return {
    title: entry.seoTitle || entry.title,
    description: entry.seoDescription || entry.description,
    alternates: languageAlternates(canonicalPath, locale),
    openGraph: {
      type: "website",
      title: entry.seoTitle || entry.title,
      description: entry.seoDescription || entry.description,
      url: localeHref(canonicalPath, locale),
      images: catalogImage,
    },
  };
}

export default async function ShopProductDetailPage({ params }: ShopProductDetailPageProps) {
  const locale = await getLocale();
  const { slug } = await params;
  const entry = await getShopCatalogEntryBySlug(slug, locale);

  if (!entry || entry.dataSource !== "commerce-catalog") {
    notFound();
  }

  return (
    <>
      <Header />
      <main id="main-content" className="shop-route">
        <Container>
          <ShopProductDetail entry={entry} />
        </Container>
      </main>
      <Footer />
    </>
  );
}
