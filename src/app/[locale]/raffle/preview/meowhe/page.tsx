import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";

import { Footer } from "@/components/layout/footer";
import { Header } from "@/components/layout/header";
import { Container } from "@/components/ui/container";
import { RaffleEntryForm } from "@/features/raffle/raffle-entry-form";
import { formatShippingUsd } from "@/features/raffle/raffle-shipping";
import styles from "@/features/raffle/raffle-discovery.module.css";

export const metadata: Metadata = {
  title: "Meowhe Raffle Preview | Luminal Factory",
  robots: { index: false, follow: false },
};

const shippingRates = { US: 800 };
const schedule = {
  opens: "2026-12-01T12:00:00Z",
  closes: "2026-12-08T12:00:00Z",
};
const formatTime = new Intl.DateTimeFormat("en-US", {
  dateStyle: "medium",
  timeStyle: "short",
  timeZone: "Asia/Ho_Chi_Minh",
});

export default async function MeowhePreviewPage({ params }: Readonly<{ params: Promise<{ locale: string }> }>) {
  if ((await params).locale !== "en") notFound();

  return (
    <>
      <Header rafflePreview />
      <main id="main-content">
        <Container>
          <section className="section" aria-labelledby="raffle-preview-title">
            <div className={styles.program}>
              <div className={styles.programTitle}>
                <p className="eyebrow">Raffle preview</p>
                <h1 className={`${styles.previewTitle} luminal-masked-heading`} id="raffle-preview-title">Meowhe Archive</h1>
              </div>
              <div className={styles.programVisual}>
                <div className={styles.archivePortrait}>
                  <Image src="/images/home/archive-meowhe.webp" alt="Meowhe artisan keycap from the Luminal Factory archive" fill sizes="(max-width: 700px) 80vw, 368px" style={{ objectFit: "cover" }} preload />
                </div>
              </div>
              <div className={styles.programCopy}>
                <p>Try the raffle experience with Meowhe. The dates and shipping rates are examples.</p>
                <dl className={styles.previewFacts}>
                  <div><dt>Item price</dt><dd>{formatShippingUsd(8000)} USD</dd></div>
                  <div><dt>Sample opening</dt><dd><time dateTime={schedule.opens}>{formatTime.format(new Date(schedule.opens))}</time></dd></div>
                  <div><dt>Sample closing</dt><dd><time dateTime={schedule.closes}>{formatTime.format(new Date(schedule.closes))}</time></dd></div>
                  <div><dt>Time zone</dt><dd>Vietnam (UTC+7)</dd></div>
                </dl>
              </div>
            </div>
            <div id="raffle-entry" style={{ scrollMarginTop: "6rem" }}>
              <RaffleEntryForm enabled raffleId="" rulesVersion="preview" siteKey="" shippingRates={shippingRates} preview />
            </div>
            <div className={styles.navigation}>
              <Link className="button-link button-secondary" href="/en/raffle">Back to raffle releases</Link>
            </div>
          </section>
        </Container>
      </main>
      <Footer />
    </>
  );
}
