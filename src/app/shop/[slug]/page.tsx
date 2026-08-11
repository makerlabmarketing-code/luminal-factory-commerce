import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { Footer } from "@/components/layout/footer";
import { Header } from "@/components/layout/header";
import { Container } from "@/components/ui/container";
import { getShopCatalogEntryBySlug } from "@/features/shop/catalog-adapter";
import { getCuratedShopEntries } from "@/features/shop/shop-content";
import { ShopProductDetail } from "@/features/shop/shop-product-detail";

type ShopProductDetailPageProps = Readonly<{
  params: Promise<{ slug: string }>;
}>;

export function generateStaticParams() {
  return getCuratedShopEntries().map((entry) => ({ slug: entry.slug }));
}

export async function generateMetadata({ params }: ShopProductDetailPageProps): Promise<Metadata> {
  const { slug } = await params;
  const entry = await getShopCatalogEntryBySlug(slug);

  if (!entry) {
    return {
      title: "Không tìm thấy object",
      description: "The requested Luminal Factory shop object was not found.",
      robots: { index: false, follow: false },
    };
  }

  const canonicalPath = `/shop/${entry.slug}`;
  const catalogImage = entry.media.source === "commerce-catalog" && entry.media.productionApproved && entry.media.type === "image"
    ? [{ url: entry.media.src, alt: entry.media.alt, width: entry.media.width, height: entry.media.height }]
    : undefined;

  return {
    title: entry.title,
    description: `${entry.description} Public catalog presentation; checkout is not implied.`,
    alternates: { canonical: canonicalPath },
    openGraph: {
      type: "website",
      title: entry.title,
      description: entry.description,
      url: canonicalPath,
      images: catalogImage,
    },
  };
}

export default async function ShopProductDetailPage({ params }: ShopProductDetailPageProps) {
  const { slug } = await params;
  const entry = await getShopCatalogEntryBySlug(slug);

  if (!entry) {
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
