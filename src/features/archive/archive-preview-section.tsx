
import { getTranslator } from "@/lib/i18n/server";
import Link from "@/lib/i18n/link";
import { ButtonLink } from "@/components/ui/button-link";
import { Container } from "@/components/ui/container";
import { archivePlaceholderNotice, type ArchivePresentationEntry } from "./archive-content";

type ArchivePreviewSectionProps = Readonly<{
  entries: readonly ArchivePresentationEntry[];
}>;

export async function ArchivePreviewSection({ entries }: ArchivePreviewSectionProps) {
  const tr = await getTranslator();
  return (
    <section id="archive-preview" className="archive-preview" aria-labelledby="archive-preview-title">
      <Container>
        <div className="archive-preview-heading">
          <div>
            <p className="eyebrow">{tr("Archive preview")}</p>
            <h2 id="archive-preview-title">{tr("Những dấu vết trước đây, giữ ở nhịp thấp hơn raffle.")}</h2>
          </div>
          <p>
            {tr("Một lát cắt lưu trữ tĩnh cho các collectible/release đã qua. Nội dung dưới đây là placeholder được curate, chưa phải dữ liệu sản xuất hay catalog bán hàng.")}</p>
        </div>
        {entries.length > 0 ? (
          <ul className="archive-preview-list" aria-label={tr("Curated archive placeholder entries")}>
            {entries.map((entry, index) => (
              <li key={entry.id} className="archive-preview-card" id={`preview-${entry.slug}`}>
                <Link href={entry.href} aria-label={`Mở archive entry ${entry.title}`}>
                  <span className={`archive-media archive-media-${entry.media.tone}`} role="img" aria-label={entry.media.alt}>
                    <span aria-hidden="true" />
                  </span>
                  <span className="archive-card-index" aria-hidden="true">{String(index + 1).padStart(2, "0")}</span>
                  <span className="archive-card-copy">
                    <span className="archive-card-kicker">{entry.collection} · {entry.year}</span>
                    <strong>{entry.title}</strong>
                    <span>{entry.materialNote}</span>
                    {entry.isPlaceholder ? <em>{tr(archivePlaceholderNotice)}</em> : null}
                  </span>
                </Link>
              </li>
            ))}
          </ul>
        ) : (
          <div className="feedback-state" role="status">
            <p>{tr("Archive preview đang chờ nội dung được phê duyệt.")}</p>
          </div>
        )}
        <div className="archive-preview-action">
          <ButtonLink href="/archive">{tr("Xem archive foundation")}</ButtonLink>
        </div>
      </Container>
    </section>
  );
}
