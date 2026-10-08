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
      <div className="archive-route-heading">
        <p className="eyebrow">{tr("Studio archive")}{entry.year ? ` · ${entry.year}` : ""}</p>
        <div>
          <h1 id="archive-detail-title">{entry.title}</h1>
          <p>{tr(entry.collection)}</p>
        </div>
        <p>{tr(entry.description)}</p>
      </div>

      <div className="archive-route-card archive-record-layout">
        <ArchiveMedia entry={entry} sizes="(max-width: 800px) calc(100vw - 2rem), 50vw" />
        <div className="archive-route-card-copy">
          <p className="eyebrow">{tr("Historical editorial record")}</p>
          <p>{tr(entry.story)}</p>
          <dl>
            <div><dt>{tr("Collection")}</dt><dd>{tr(entry.collection)}</dd></div>
            {entry.year ? <div><dt>{tr("Year")}</dt><dd>{entry.year}</dd></div> : null}
            <div><dt>{tr("Material memory")}</dt><dd>{tr(entry.materialNote)}</dd></div>
            <div><dt>{tr("Record status")}</dt><dd>{tr("Studio archive")}</dd></div>
          </dl>
        </div>
      </div>

      <section className="archive-route-section" aria-labelledby="archive-history-title">
        <div className="archive-route-heading">
          <p className="eyebrow">{tr("Historical notes")}</p>
          <h2 id="archive-history-title">{tr("From Lazy Factory to Luminal Factory")}</h2>
        </div>
        <ul className="process-list">
          {entry.historicalNotes.map((note, index) => (
            <li key={note}>
              <span>{String(index + 1).padStart(2, "0")}</span>
              <h3>{tr(note)}</h3>
            </li>
          ))}
        </ul>
      </section>

      <section className="archive-route-section" aria-labelledby="archive-facts-title">
        <div className="archive-route-heading">
          <p className="eyebrow">{tr("Record facts")}</p>
          <h2 id="archive-facts-title">{tr("Object details")}</h2>
          <p>{tr("Character, colorway and material.")}</p>
        </div>
        <dl className="archive-route-card-copy">
          {entry.facts.map((fact) => (
            <div key={tr(fact.label)}><dt>{tr(fact.label)}</dt><dd>{tr(fact.value)}</dd></div>
          ))}
        </dl>
      </section>

      <p><Link href="/archive">{tr("← Quay lại Archive")}</Link></p>
    </article>
  );
}
