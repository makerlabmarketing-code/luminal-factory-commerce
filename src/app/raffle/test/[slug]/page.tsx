import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { Footer } from "@/components/layout/footer";
import { Header } from "@/components/layout/header";
import { Container } from "@/components/ui/container";
import { RaffleDetailView } from "@/features/raffle/raffle-detail";
import { isRaffleEntryPresentationEnabled } from "@/features/raffle/raffle-detail-service";
import {
  getPublishedTestRaffleBySlug,
  isRaffleTestAccessAuthorized,
} from "@/features/raffle/raffle-test-service";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Private Raffle Test | Luminal Factory",
  robots: { index: false, follow: false, noarchive: true, nocache: true },
};

type TestRafflePageProps = Readonly<{
  params: Promise<{ slug: string }>;
  searchParams: Promise<{ access?: string | string[] }>;
}>;

export default async function PrivateRaffleTestPage({ params, searchParams }: TestRafflePageProps) {
  const [{ slug }, query] = await Promise.all([params, searchParams]);
  const access = Array.isArray(query.access) ? query.access[0] : query.access;

  if (!isRaffleTestAccessAuthorized(access)) notFound();

  const raffle = await getPublishedTestRaffleBySlug(slug);
  if (!raffle) notFound();

  const siteKey = process.env.NEXT_PUBLIC_CLOUDFLARE_TURNSTILE_SITE_KEY?.trim() ?? "";
  const entryEnabled = isRaffleEntryPresentationEnabled();

  return (
    <>
      <Header />
      <main id="main-content">
        <Container>
          <div className="feedback-state" role="status">
            <p>Private test raffle · không xuất hiện trong public discovery, menu hoặc sitemap.</p>
          </div>
          <RaffleDetailView raffle={raffle} entryEnabled={entryEnabled} turnstileSiteKey={siteKey} />
        </Container>
      </main>
      <Footer />
    </>
  );
}
