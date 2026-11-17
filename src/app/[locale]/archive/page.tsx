import { languageAlternates } from "@/lib/i18n/locale";

import { getTranslator, getLocale } from "@/lib/i18n/server";
import type { Metadata } from "next";
import Image from "next/image";
import Link from "@/lib/i18n/link";
import { Footer } from "@/components/layout/footer";
import { Header } from "@/components/layout/header";
import { Container } from "@/components/ui/container";
import { ArchiveCollection } from "@/features/archive/archive-collection";
import { getCuratedArchiveEntries } from "@/features/archive/archive-content";
import styles from "./archive-stage.module.css";

export async function generateMetadata(): Promise<Metadata> {
  const locale = await getLocale();
  return { title: locale === "vi" ? "Archive" : "Archive", description: locale === "vi" ? "Kh\u00e1m ph\u00e1 c\u00e2u chuy\u1ec7n c\u1ee7a c\u00e1c v\u1eadt th\u1ec3 v\u00e0 \u0111\u1ee3t ph\u00e1t h\u00e0nh tr\u01b0\u1edbc \u0111\u00e2y t\u1ea1i Luminal Factory." : "Explore the stories behind Luminal Factory objects and past releases.", alternates: languageAlternates("/archive", locale) };
}

export default async function ArchivePage() {
  const tr = await getTranslator();
  const locale = await getLocale();
  const entries = getCuratedArchiveEntries().filter((entry) => entry.media.productionApproved);

  return (
    <>
      <Header />
      <main id="main-content" className="archive-route">
        <Container>
          <section id="meowhe-stage" className={styles.stage} aria-labelledby="archive-title">
            <div className={styles.stageLight} aria-hidden="true" />
            <div className={styles.intro}>
              <p className="eyebrow">{tr("Luminal archive")} / MEOWHE</p>
              <h1 id="archive-title">{locale === "vi" ? "Bộ sưu tập Meowhe" : "The Meowhe Archive"}</h1>
              <p>{locale === "vi" ? "Ba phối màu. Một nhân vật. Khám phá từng phiên bản." : "Three colorways. One character. Explore each colorway."}</p>
              <Link className={styles.allRecords} href="#archive-records">{locale === "vi" ? "Xem các phối màu" : "View colorways"} <span aria-hidden="true">↘</span></Link>
            </div>
            <div className={styles.colorways} aria-label={locale === "vi" ? "Ba phối màu Meowhe trong kho lưu trữ" : "Three Meowhe colorways in the archive"}>
              {entries.slice(0, 3).map((entry, index) => (
                <Link key={entry.id} href={entry.href} className={styles.colorway} aria-label={`${locale === "vi" ? "Xem hồ sơ" : "View record"}: ${entry.title}`}>
                  <span className={styles.portrait}><Image src={entry.media.src} alt={tr(entry.media.alt)} fill sizes="(max-width: 700px) 96px, (max-width: 900px) 112px, (max-width: 1400px) 8vw, 136px" style={{ objectFit: "cover", objectPosition: entry.media.objectPosition ?? "center" }} /></span>
                  <span className={styles.colorwayLabel}><small>0{index + 1} / MEOWHE</small><strong>{entry.title.replace(/^Meowhe\s+/i, "")}</strong></span>
                </Link>
              ))}
            </div>
          </section>
          <ArchiveCollection entries={entries} />
        </Container>
      </main>
      <Footer />
    </>
  );
}
