import { getTranslator } from "@/lib/i18n/server";
import { localeHref } from "@/lib/i18n/locale";
import Link from "@/lib/i18n/link";
import styles from "./raffle-discovery.module.css";
import type { RaffleListEntry, RaffleListResult } from "./raffle-list-service";
import { RaffleCover } from "./raffle-cover";
import { ShopMedia } from "@/features/shop/shop-media";
import { meowheDiscoveryStory } from "@/components/discovery/meowhe-story";
import { getCuratedArchiveEntries } from "@/features/archive/archive-content";
import Image from "next/image";
import { RaffleCountdownDemo } from "./raffle-countdown-demo";
import { isRaffleEntryPresentationEnabled } from "./raffle-detail-service";
import type { ShopPresentationEntry } from "@/features/shop/shop-content";

const statusCopy: Record<RaffleListEntry["state"], string> = {
  open: "Entry window open", upcoming: "Upcoming", closed: "Entry window closed",
  completed: "Completed", cancelled: "Cancelled",
};

export async function RaffleDiscovery({ releases, featuredMeowhe, locale }: Readonly<{
  releases: RaffleListResult;
  featuredMeowhe?: ShopPresentationEntry;
  locale: "vi" | "en";
}>) {
  const tr = await getTranslator();
  const canEnter = isRaffleEntryPresentationEnabled();
  const formatDate = new Intl.DateTimeFormat(locale, {
    dateStyle: "medium", timeStyle: "short", timeZone: "Asia/Ho_Chi_Minh",
  });
  const archivePortrait = getCuratedArchiveEntries().find(entry => entry.media.productionApproved);
  const featuredPhoto = featuredMeowhe?.media.type === "image" && featuredMeowhe.media.productionApproved
    ? featuredMeowhe.media
    : undefined;
  return (
    <section className="section" aria-labelledby="raffle-title">
      <div className={`section-heading ${styles.heading}`}>
        <h1 id="raffle-title" className="luminal-masked-heading">{tr("Raffle releases")}</h1>
      </div>
      <div className={`${styles.program} luminal-side-rays`}>
        <div className={styles.programTitle}>
          <h2>{featuredMeowhe?.title ?? "Meowhe"}</h2>
        </div>
        <div className={styles.programVisual}>
          {featuredPhoto ? (
            <div className={styles.programObject}>
              <ShopMedia media={featuredPhoto} sizes="(max-width: 700px) 80vw, 368px" />
            </div>
          ) : archivePortrait ? (
            <div className={styles.archivePortrait}>
              <Image src={archivePortrait.media.src} alt={tr(archivePortrait.media.alt)} fill sizes="(max-width: 700px) 80vw, 368px" fetchPriority="high" style={{ objectFit: "cover", objectPosition: archivePortrait.media.objectPosition ?? "center" }} />
              <span>{locale === "vi" ? "Ảnh từ bộ sưu tập" : "From the archive"}</span>
            </div>
          ) : (
            <span className={styles.programMark} aria-hidden="true" />
          )}
        </div>
        <div className={styles.programCopy}>
          <p>{meowheDiscoveryStory(featuredMeowhe, locale, "raffle")}</p>
          <RaffleCountdownDemo locale={locale} />
        </div>
      </div>
      <div className={styles.programAfter}>
        <h2>{locale === "vi" ? "Những đợt đã công bố" : "Announced releases"}</h2>
      </div>
      {releases.state === "ready" ? (
        <ul className={styles.list}>
          {releases.entries.map(release => (
            <li className={styles.card} key={release.slug} data-luminal-bento-card>
              {release.media && <RaffleCover key={release.media.src} src={release.media.src} alt={release.media.alt || release.title} className={styles.cover} />}
              <span className="status-badge">{tr(statusCopy[release.state])}</span>
              <h2>{release.title}</h2>
              {release.summary && <p>{release.summary}</p>}
              {(release.opensAt || release.closesAt) && <dl>
                {release.opensAt && <><dt>{tr("Opens")}</dt><dd><time dateTime={release.opensAt}>{formatDate.format(new Date(release.opensAt))}</time></dd></>}
                {release.closesAt && <><dt>{tr("Closes")}</dt><dd><time dateTime={release.closesAt}>{formatDate.format(new Date(release.closesAt))}</time></dd></>}
                <dt>{tr("Time zone")}</dt><dd>Asia/Ho_Chi_Minh (UTC+7)</dd>
              </dl>}
              <Link className="button-link button-secondary" href={`/raffle/${release.slug}${release.state === "open" && canEnter ? "#raffle-entry" : ""}`} aria-label={`${tr(release.state === "open" && canEnter ? "Enter Raffle" : "View release")}: ${release.title}`}>{tr(release.state === "open" && canEnter ? "Enter Raffle" : "View release")}</Link>
            </li>
          ))}
        </ul>
      ) : (
        <div className="contact-panel">
          <h2>{tr(releases.state === "empty" ? "No announced releases" : "Release information is unavailable")}</h2>
          <p>{tr(releases.state === "empty" ? "No raffle releases are announced yet. Explore the Meowhe archive in the meantime." : "Raffle release information is unavailable right now. You can still explore the Meowhe archive.")}</p>
          {releases.state === "unavailable" && <a className="button-link button-secondary" href={localeHref("/raffle", locale)}>{tr("Reload release information")}</a>}
        </div>
      )}
      <div className={`actions ${styles.navigation}`}>
        <Link className="button-link button-secondary" href="/archive">{tr("Explore Archive")}</Link>
      </div>
    </section>
  );
}
