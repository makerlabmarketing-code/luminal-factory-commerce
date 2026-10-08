import styles from "./archive-detail.module.css";
import { ArchiveMedia } from "./archive-media";

import { getTranslator } from "@/lib/i18n/server";
import Link from "@/lib/i18n/link";
import { type ArchivePresentationEntry } from "./archive-content";

type ArchiveDetailProps = Readonly<{
  entry: ArchivePresentationEntry;
}>;

export async function ArchiveDetail({ entry }: ArchiveDetailProps) {
  const tr = await getTranslator();
  return (
    <article className="archive-route-section" aria-labelledby="archive-detail-title">
      <div className={`archive-route-heading ${styles.heading}`}>
        <p className="eyebrow">{tr("Studio archive")}{entry.year ? ` · ${entry.year}` : ""}</p>
        <div>
          <h1 className={styles.title} id="archive-detail-title">{entry.title}</h1>
          <p>{tr(entry.collection)}</p>
        </div>
      </div>

      <div className={`archive-route-card ${styles.record}`}>
        <ArchiveMedia entry={entry} sizes="(max-width: 800px) calc(100vw - 2rem), 50vw" />
        <div className={styles.copy}>
          <p className="eyebrow">{tr("Historical editorial record")}</p>
          <h2>{tr("Object details")}</h2>
          <p className={styles.story}>{tr(entry.story)}</p>
          <dl className={styles.facts}>
            {entry.facts.map((fact) => (
              <div key={fact.label}><dt>{tr(fact.label)}</dt><dd>{tr(fact.value)}</dd></div>
            ))}
            <div><dt>{tr("Collection")}</dt><dd>{tr(entry.collection)}</dd></div>
            {entry.year ? <div><dt>{tr("Year")}</dt><dd>{entry.year}</dd></div> : null}
            <div><dt>{tr("Material memory")}</dt><dd>{tr(entry.materialNote)}</dd></div>
          </dl>
        </div>
      </div>

      <section className={styles.history} aria-labelledby="archive-history-title">
          <h2 id="archive-history-title">{tr("From Lazy Factory to Luminal Factory")}</h2>
        <ul>
          {entry.historicalNotes.map((note) => (
            <li key={note}>{tr(note)}</li>
          ))}
        </ul>
      </section>
      <p><Link className={styles.back} href="/archive">{tr("← Quay lại Archive")}</Link></p>
    </article>
  );
}
