import { languageAlternates } from "@/lib/i18n/locale";

import { getTranslator, getLocale } from "@/lib/i18n/server";
import type { Metadata } from "next";
import Link from "@/lib/i18n/link";
import { Footer } from "@/components/layout/footer";
import { Header } from "@/components/layout/header";
import { Container } from "@/components/ui/container";
import { ArchiveCollection } from "@/features/archive/archive-collection";
import { getCuratedArchiveEntries } from "@/features/archive/archive-content";

export async function generateMetadata(): Promise<Metadata> {
  const locale = await getLocale();
  return { title: locale === "vi" ? "Archive" : "Archive", description: locale === "vi" ? "Kh\u00e1m ph\u00e1 c\u00e2u chuy\u1ec7n c\u1ee7a c\u00e1c v\u1eadt th\u1ec3 v\u00e0 \u0111\u1ee3t ph\u00e1t h\u00e0nh tr\u01b0\u1edbc \u0111\u00e2y t\u1ea1i Luminal Factory." : "Explore the stories behind Luminal Factory objects and past releases.", alternates: languageAlternates("/archive", locale) };
}

export default async function ArchivePage() {
  const tr = await getTranslator();
  const entries = getCuratedArchiveEntries().filter((entry) => entry.media.productionApproved);

  return (
    <>
      <Header />
      <main id="main-content" className="archive-route">
        <Container>
          <section className="archive-route-hero" aria-labelledby="archive-title">
            <p className="eyebrow">{tr("Luminal archive")}</p>
            <h1 id="archive-title">{tr("A quiet foundation for collectible memory.")}</h1>
            <p>
              {tr("Archive là historical showcase cho các collectible và release trước đây. Slice này chỉ dùng curated placeholder presentation data, chưa kết nối Supabase hoặc production content.")}</p>
            <Link href="/#raffle">{tr("Quay về raffle discovery")}</Link>
          </section>
          <ArchiveCollection entries={entries} />
        </Container>
      </main>
      <Footer />
    </>
  );
}
