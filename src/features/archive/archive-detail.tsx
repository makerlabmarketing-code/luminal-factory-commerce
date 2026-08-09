import Link from "next/link";
import { archivePlaceholderNotice, type ArchivePresentationEntry } from "./archive-content";

type ArchiveDetailProps = Readonly<{
  entry: ArchivePresentationEntry;
}>;

export function ArchiveDetail({ entry }: ArchiveDetailProps) {
  return (
    <article className="archive-route-section" aria-labelledby="archive-detail-title">
      <div className="archive-route-heading">
        <p className="eyebrow">Archive record · {entry.year}</p>
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
          <p className="eyebrow">Historical editorial record</p>
          <p>{entry.story}</p>
          <dl>
            <div><dt>Collection</dt><dd>{entry.collection}</dd></div>
            <div><dt>Year</dt><dd>{entry.year}</dd></div>
            <div><dt>Material memory</dt><dd>{entry.materialNote}</dd></div>
            <div><dt>Record status</dt><dd>{archivePlaceholderNotice}</dd></div>
          </dl>
        </div>
      </div>

      <section className="archive-route-section" aria-labelledby="archive-history-title">
        <div className="archive-route-heading">
          <p className="eyebrow">Historical notes</p>
          <h2 id="archive-history-title">What this record can truthfully say</h2>
          <p>Archive preserves creative context without turning historical presentation into a current-sale signal.</p>
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
          <p className="eyebrow">Record facts</p>
          <h2 id="archive-facts-title">Bounded presentation metadata</h2>
          <p>Only approved or explicitly placeholder facts appear here. Unknown historical claims stay omitted.</p>
        </div>
        <dl className="archive-route-card-copy">
          {entry.facts.map((fact) => (
            <div key={fact.label}><dt>{fact.label}</dt><dd>{fact.value}</dd></div>
          ))}
        </dl>
      </section>

      <p><Link href="/archive">← Quay lại Archive</Link></p>
    </article>
  );
}
