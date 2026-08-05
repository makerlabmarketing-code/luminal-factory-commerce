import type { Metadata } from "next";
import Link from "next/link";
import { Footer } from "@/components/layout/footer";
import { Header } from "@/components/layout/header";
import { Container } from "@/components/ui/container";
import { ArchiveCollection } from "@/features/archive/archive-collection";
import { getCuratedArchiveEntries } from "@/features/archive/archive-content";

export const metadata: Metadata = {
  title: "Archive | Luminal Factory",
  description: "Curated presentation foundation for Luminal Factory collectible and release history.",
};

export default function ArchivePage() {
  const entries = getCuratedArchiveEntries();

  return (
    <>
      <Header />
      <main id="main-content" className="archive-route">
        <Container>
          <section className="archive-route-hero" aria-labelledby="archive-title">
            <p className="eyebrow">Luminal archive</p>
            <h1 id="archive-title">A quiet foundation for collectible memory.</h1>
            <p>
              Archive là historical showcase cho các collectible và release trước đây. Slice này chỉ dùng curated placeholder presentation data, chưa kết nối Supabase hoặc production content.
            </p>
            <Link href="/#raffle">Quay về raffle discovery</Link>
          </section>
          <ArchiveCollection entries={entries} />
        </Container>
      </main>
      <Footer />
    </>
  );
}
