
import { getTranslator } from "@/lib/i18n/server";
import Link from "@/lib/i18n/link";
import { archivePlaceholderNotice, type ArchivePresentationEntry } from "./archive-content";

type ArchiveCollectionProps = Readonly<{
  entries: readonly ArchivePresentationEntry[];
}>;

export async function ArchiveCollection({ entries }: ArchiveCollectionProps) {
  const tr = await getTranslator();
  if (entries.length === 0) {
    return (
      <section className="archive-route-section" aria-labelledby="archive-empty-title">
        <div className="feedback-state" role="status">
          <h2 id="archive-empty-title">{tr("Archive đang chờ nội dung được phê duyệt.")}</h2>
          <p>{tr("Route foundation vẫn tồn tại để nhận dữ liệu server-provided trong slice tương lai.")}</p>
          <Link href="/#raffle">{tr("Quay về raffle discovery")}</Link>
        </div>
      </section>
    );
  }

  return (
    <section className="archive-route-section" aria-labelledby="archive-list-title">
      <div className="archive-route-heading">
        <p className="eyebrow">{tr("Curated records")}</p>
        <h2 id="archive-list-title">{tr("Presentation-only archive entries")}</h2>
        <p>{tr(archivePlaceholderNotice)}{tr(". Không có giá, tồn kho, trạng thái sold out, entry raffle, cart hoặc checkout trong foundation này.")}</p>
      </div>
      <ol className="archive-route-grid">
        {entries.map((entry) => (
          <li key={entry.id} className="archive-route-card">
            <Link href={entry.href} aria-label={`Xem archive detail: ${entry.title}`}>
              <div className={`archive-media archive-media-${entry.media.tone}`} role="img" aria-label={entry.media.alt}>
                <span aria-hidden="true" />
              </div>
              <div className="archive-route-card-copy">
                <p>{entry.collection} · {entry.year}</p>
                <h3>{entry.title}</h3>
                <p>{entry.description}</p>
                <dl>
                  <div><dt>{tr("Material note")}</dt><dd>{entry.materialNote}</dd></div>
                  <div><dt>{tr("Status")}</dt><dd>{entry.isPlaceholder ? archivePlaceholderNotice : entry.status}</dd></div>
                </dl>
              </div>
            </Link>
          </li>
        ))}
      </ol>
    </section>
  );
}
