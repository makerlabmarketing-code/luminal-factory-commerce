import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { Footer } from "@/components/layout/footer";
import { Header } from "@/components/layout/header";
import { Container } from "@/components/ui/container";
import { ArchiveDetail } from "@/features/archive/archive-detail";
import { getArchiveEntryBySlug, getCuratedArchiveEntries } from "@/features/archive/archive-content";

type ArchiveDetailPageProps = Readonly<{
  params: Promise<{ slug: string }>;
}>;

export function generateStaticParams() {
  return getCuratedArchiveEntries().map((entry) => ({ slug: entry.slug }));
}

export async function generateMetadata({ params }: ArchiveDetailPageProps): Promise<Metadata> {
  const { slug } = await params;
  const entry = getArchiveEntryBySlug(slug);

  if (!entry) {
    return { title: "Archive record not found | Luminal Factory" };
  }

  return {
    title: `${entry.title} | Archive | Luminal Factory`,
    description: `${entry.description} ${entry.collection}, ${entry.year}.`,
  };
}

export default async function ArchiveDetailPage({ params }: ArchiveDetailPageProps) {
  const { slug } = await params;
  const entry = getArchiveEntryBySlug(slug);

  if (!entry) {
    notFound();
  }

  return (
    <>
      <Header />
      <main id="main-content" className="archive-route">
        <Container>
          <ArchiveDetail entry={entry} />
        </Container>
      </main>
      <Footer />
    </>
  );
}
