
import { getTranslator } from "@/lib/i18n/server";
import Link from "@/lib/i18n/link";
import { archivePlaceholderNotice, type ArchivePresentationEntry } from "./archive-content";

type ArchiveDetailProps = Readonly<{
  entry: ArchivePresentationEntry;
}>;

export async function ArchiveDetail({ entry }: ArchiveDetailProps) {
  const tr = await getTranslator();
  return (
    <article className="archive-route-section" aria-labelledby="archive-detail-title">
      <div className="archive-route-heading">
        <p className="eyebrow">{tr("Archive record ·")}{" "}{entry.year}</p>
        <div>
          <h1 id="archive-detail-title">{entry.title}</h1>
          <p>{entry.collection}</p>
        </div>
        <p>{entry.description}</p>
      </div>

      <div className="archive-route-card">
        <div className={`archive-media archive-media-${entry.media.tone}`} role="img" aria-label={entry.media.alt}>
          <span aria-hidden="true" />
        </div>
        <div className="archive-route-card-copy">
          <p className="eyebrow">{tr("Historical editorial record")}</p>
          <p>{entry.story}</p>
          <dl>
            <div><dt>{tr("Collection")}</dt><dd>{entry.collection}</dd></div>
            <div><dt>{tr("Year")}</dt><dd>{entry.year}</dd></div>
            <div><dt>{tr("Material memory")}</dt><dd>{entry.materialNote}</dd></div>
            <div><dt>{tr("Record status")}</dt><dd>{tr(archivePlaceholderNotice)}</dd></div>
          </dl>
        </div>
      </div>

      <section className="archive-route-section" aria-labelledby="archive-history-title">
        <div className="archive-route-heading">
          <p className="eyebrow">{tr("Historical notes")}</p>
          <h2 id="archive-history-title">{tr("What this record can truthfully say")}</h2>
          <p>{tr("Archive preserves creative context without turning historical presentation into a current-sale signal.")}</p>
        </div>
        <ul className="process-list">
          {entry.historicalNotes.map((note, index) => (
            <li key={note}>
              <span>{String(index + 1).padStart(2, "0")}</span>
              <h3>{note}</h3>
            </li>
          ))}
        </ul>
      </section>

      <section className="archive-route-section" aria-labelledby="archive-facts-title">
        <div className="archive-route-heading">
          <p className="eyebrow">{tr("Record facts")}</p>
          <h2 id="archive-facts-title">{tr("Bounded presentation metadata")}</h2>
          <p>{tr("Only approved or explicitly placeholder facts appear here. Unknown historical claims stay omitted.")}</p>
        </div>
        <dl className="archive-route-card-copy">
          {entry.facts.map((fact) => (
            <div key={tr(fact.label)}><dt>{tr(fact.label)}</dt><dd>{fact.value}</dd></div>
          ))}
        </dl>
      </section>

      <p><Link href="/archive">{tr("← Quay lại Archive")}</Link></p>
    </article>
  );
}
