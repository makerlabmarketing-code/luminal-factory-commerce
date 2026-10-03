import { languageAlternates } from "@/lib/i18n/locale";
import { getLocale } from "@/lib/i18n/server";
import type { Metadata } from "next";
import { Footer } from "@/components/layout/footer";
import { Header } from "@/components/layout/header";
import { Container } from "@/components/ui/container";
import { RaffleDiscovery } from "@/features/raffle/raffle-discovery";
import { getRafflePresentation } from "@/features/raffle/raffle-content";

export async function generateMetadata(): Promise<Metadata> {
  const locale = await getLocale();
  return { title: locale === "vi" ? "Raffle" : "Raffle", description: locale === "vi" ? "Kh\u00e1m ph\u00e1 c\u00e1c \u0111\u1ee3t raffle, l\u1ecbch m\u1edf v\u00e0 th\u00f4ng tin \u0111\u0103ng k\u00fd c\u1ee7a Luminal Factory." : "Discover Luminal Factory raffle releases, timing and entry information.", alternates: languageAlternates("/raffle", locale) };
}

export default function RafflePage() {
  const content = getRafflePresentation();

  return (
    <>
      <Header />
      <main id="main-content">
        <Container>
          <RaffleDiscovery content={content} />
        </Container>
      </main>
      <Footer />
    </>
  );
}
