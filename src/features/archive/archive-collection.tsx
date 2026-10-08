import { ArchiveMedia } from "./archive-media";

import { getTranslator } from "@/lib/i18n/server";
import Link from "@/lib/i18n/link";
import { type ArchivePresentationEntry } from "./archive-content";

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
          <Link href="/raffle">{tr("Quay về raffle discovery")}</Link>
        </div>
      </section>
    );
  }

  return (
    <section className="archive-route-section" aria-labelledby="archive-list-title">
      <div className="archive-route-heading">
        <p className="eyebrow">{tr("Curated records")}</p>
        <h2 id="archive-list-title">{tr("Meowhe colorways")}</h2>
        <p>{tr("Explore the character through three colorways from our studio archive.")}</p>
      </div>
      <ol className="archive-route-grid">
        {entries.map((entry) => (
          <li key={entry.id} className="archive-route-card">
            <Link href={entry.href} aria-label={`${tr("View object record")}: ${entry.title}`}>
              <ArchiveMedia entry={entry} sizes="(max-width: 800px) calc(100vw - 2rem), 33vw" />
              <div className="archive-route-card-copy">
                <p>{tr(entry.collection)}{entry.year ? ` · ${entry.year}` : ""}</p>
                <h3>{entry.title}</h3>
                <p>{tr(entry.description)}</p>
                <dl>
                  <div><dt>{tr("Material note")}</dt><dd>{tr(entry.materialNote)}</dd></div>
                  <div><dt>{tr("Status")}</dt><dd>{tr("Studio archive")}</dd></div>
                </dl>
              </div>
            </Link>
          </li>
        ))}
      </ol>
    </section>
  );
}
