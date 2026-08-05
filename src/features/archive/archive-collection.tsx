import Link from "next/link";
import { archivePlaceholderNotice, type ArchivePresentationEntry } from "./archive-content";

type ArchiveCollectionProps = Readonly<{
  entries: readonly ArchivePresentationEntry[];
}>;

export function ArchiveCollection({ entries }: ArchiveCollectionProps) {
  if (entries.length === 0) {
    return (
      <section className="archive-route-section" aria-labelledby="archive-empty-title">
        <div className="feedback-state" role="status">
          <h2 id="archive-empty-title">Archive đang chờ nội dung được phê duyệt.</h2>
          <p>Route foundation vẫn tồn tại để nhận dữ liệu server-provided trong slice tương lai.</p>
          <Link href="/#raffle">Quay về raffle discovery</Link>
        </div>
      </section>
    );
  }

  return (
    <section className="archive-route-section" aria-labelledby="archive-list-title">
      <div className="archive-route-heading">
        <p className="eyebrow">Curated records</p>
        <h2 id="archive-list-title">Presentation-only archive entries</h2>
        <p>{archivePlaceholderNotice}. Không có giá, tồn kho, trạng thái sold out, entry raffle, cart hoặc checkout trong foundation này.</p>
      </div>
      <ol className="archive-route-grid">
        {entries.map((entry) => (
          <li key={entry.id} id={entry.slug} className="archive-route-card">
            <div className={`archive-media archive-media-${entry.media.tone}`} role="img" aria-label={entry.media.alt}>
              <span aria-hidden="true" />
            </div>
            <div className="archive-route-card-copy">
              <p>{entry.collection} · {entry.year}</p>
              <h3>{entry.title}</h3>
              <p>{entry.description}</p>
              <dl>
                <div><dt>Material note</dt><dd>{entry.materialNote}</dd></div>
                <div><dt>Status</dt><dd>{entry.isPlaceholder ? archivePlaceholderNotice : entry.status}</dd></div>
              </dl>
            </div>
          </li>
        ))}
      </ol>
    </section>
  );
}
