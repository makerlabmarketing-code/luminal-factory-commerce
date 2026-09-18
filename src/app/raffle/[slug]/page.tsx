import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { Footer } from "@/components/layout/footer";
import { Header } from "@/components/layout/header";
import { Container } from "@/components/ui/container";
import { RaffleDetailView } from "@/features/raffle/raffle-detail";
import {
  getPublishedRaffleBySlug,
  isRaffleEntryPresentationEnabled,
} from "@/features/raffle/raffle-detail-service";

export const dynamic = "force-dynamic";

type RaffleDetailPageProps = Readonly<{ params: Promise<{ slug: string }> }>;

export async function generateMetadata({ params }: RaffleDetailPageProps): Promise<Metadata> {
  const { slug } = await params;
  const raffle = await getPublishedRaffleBySlug(slug);
  if (!raffle) return { title: "Raffle unavailable | Luminal Factory", robots: { index: false, follow: true } };
  return {
    title: `${raffle.title} | Luminal Factory`,
    description: raffle.summary ?? "Thông tin raffle release của Luminal Factory.",
  };
}
export default async function RaffleDetailPage({ params }: RaffleDetailPageProps) {
  const { slug } = await params;
  const raffle = await getPublishedRaffleBySlug(slug);
  if (!raffle) notFound();

  const siteKey = process.env.NEXT_PUBLIC_CLOUDFLARE_TURNSTILE_SITE_KEY?.trim() ?? "";
  const entryEnabled = isRaffleEntryPresentationEnabled();

  return (
    <>
      <Header />
      <main id="main-content">
        <Container>
          <RaffleDetailView raffle={raffle} entryEnabled={entryEnabled} turnstileSiteKey={siteKey} />
        </Container>
      </main>
      <Footer />
    </>
  );
}
