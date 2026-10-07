import { getTranslator, getLocale } from "@/lib/i18n/server";
import { localeHref } from "@/lib/i18n/locale";
import Link from "@/lib/i18n/link";
import styles from "./raffle-discovery.module.css";
import type { RaffleListEntry, RaffleListResult } from "./raffle-list-service";
import { RaffleCover } from "./raffle-cover";

const statusCopy: Record<RaffleListEntry["state"], string> = {
  open: "Entry window open", upcoming: "Upcoming", closed: "Entry window closed",
  completed: "Completed", cancelled: "Cancelled",
};

export async function RaffleDiscovery({ releases }: Readonly<{ releases: RaffleListResult }>) {
  const locale = await getLocale();
  const tr = await getTranslator();
  const formatDate = new Intl.DateTimeFormat(locale, {
    dateStyle: "medium", timeStyle: "short", timeZone: "Asia/Ho_Chi_Minh",
  });
  return (
    <section className="section" aria-labelledby="raffle-title">
      <div className="section-heading">
        <p className="eyebrow">Luminal Factory / Raffle</p>
        <div>
          <h1 id="raffle-title">{tr("Raffle releases")}</h1>
          <p className="lede">{tr("Explore announced releases and their participation windows.")}</p>
        </div>
        <p>{tr("View each release for its published information. Viewing a release does not submit an entry.")}</p>
      </div>
      {releases.state === "ready" ? (
        <ul className={styles.list}>
          {releases.entries.map(release => (
            <li className={styles.card} key={release.slug}>
              {release.media && <RaffleCover key={release.media.src} src={release.media.src} alt={release.media.alt || release.title} className={styles.cover} />}
              <span className="status-badge">{tr(statusCopy[release.state])}</span>
              <h2>{release.title}</h2>
              {release.summary && <p>{release.summary}</p>}
              {(release.opensAt || release.closesAt) && <dl>
                {release.opensAt && <><dt>{tr("Opens")}</dt><dd><time dateTime={release.opensAt}>{formatDate.format(new Date(release.opensAt))}</time></dd></>}
                {release.closesAt && <><dt>{tr("Closes")}</dt><dd><time dateTime={release.closesAt}>{formatDate.format(new Date(release.closesAt))}</time></dd></>}
                <dt>{tr("Time zone")}</dt><dd>Asia/Ho_Chi_Minh (UTC+7)</dd>
              </dl>}
              <Link className="button-link button-secondary" href={`/raffle/${release.slug}`} aria-label={`${tr("View release")}: ${release.title}`}>{tr("View release")}</Link>
            </li>
          ))}
        </ul>
      ) : (
        <div className="contact-panel">
          <h2>{tr(releases.state === "empty" ? "No announced releases" : "Release information is unavailable")}</h2>
          <p>{tr(releases.state === "empty" ? "Explore the Archive or browse the Shop while there are no announced releases to show." : "We cannot display release information right now. Explore the Archive or Shop, or check back later.")}</p>
          {releases.state === "unavailable" && <a className="button-link button-secondary" href={localeHref("/raffle", locale)}>{tr("Reload release information")}</a>}
        </div>
      )}
      <div className={`actions ${styles.navigation}`}>
        <Link className="button-link button-secondary" href="/archive">{tr("Explore Archive")}</Link>
        <Link className="button-link button-secondary" href="/shop">{tr("Browse Shop")}</Link>
      </div>
    </section>
  );
}
