import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { Footer } from "@/components/layout/footer";
import { Header } from "@/components/layout/header";
import { Container } from "@/components/ui/container";
import { getCuratedShopEntries, getShopEntryBySlug } from "@/features/shop/shop-content";
import { ShopProductDetail } from "@/features/shop/shop-product-detail";

type ShopProductDetailPageProps = Readonly<{
  params: Promise<{ slug: string }>;
}>;

export function generateStaticParams() {
  return getCuratedShopEntries().map((entry) => ({ slug: entry.slug }));
}

export async function generateMetadata({ params }: ShopProductDetailPageProps): Promise<Metadata> {
  const { slug } = await params;
  const entry = getShopEntryBySlug(slug);

  if (!entry) {
    return {
      title: "Shop object not found | Luminal Factory",
      description: "The requested Luminal Factory shop presentation object was not found.",
    };
  }

  return {
    title: `${entry.title} | Luminal Factory Shop`,
    description: `${entry.description} Presentation-only object detail; no live price, stock, or checkout is implied.`,
  };
}

export default async function ShopProductDetailPage({ params }: ShopProductDetailPageProps) {
  const { slug } = await params;
  const entry = getShopEntryBySlug(slug);

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
