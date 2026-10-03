
import { getTranslator } from "@/lib/i18n/server";
import { ButtonLink } from "@/components/ui/button-link";
import { Container } from "@/components/ui/container";
import { shopDetailAvailability, shopPlaceholderNotice, type ShopPresentationEntry } from "./shop-content";

type ShopPreviewSectionProps = Readonly<{
  entries: readonly ShopPresentationEntry[];
}>;

export async function ShopPreviewSection({ entries }: ShopPreviewSectionProps) {
  const tr = await getTranslator();
  const previewEntries = entries.slice(0, 3);

  return (
    <section id="shop-preview" className="shop-preview" aria-labelledby="shop-preview-title">
      <Container>
        <div className="shop-preview-heading">
          <p className="eyebrow">{tr("Shop discovery")}</p>
          <h2 id="shop-preview-title">{tr("Collectible studies cho shop tương lai, đặt sau raffle và archive.")}</h2>
          <p>
            {tr("Một preview tĩnh cho các vật thể có thể trở thành catalog mua trực tiếp sau này. Slice này không có giá, tồn kho, cart, checkout hoặc giao dịch.")}</p>
        </div>
        {previewEntries.length > 0 ? (
          <ol className="shop-preview-list" aria-label={tr("Curated shop presentation entries")}>
            {previewEntries.map((entry, index) => (
              <li key={entry.id} className="shop-preview-card" id={`preview-${entry.presentationKey}`}>
                <div className={`shop-media shop-media-${entry.media.tone}`} role="img" aria-label={entry.media.alt}>
                  <span aria-hidden="true" />
                  <em>{entry.media.label}</em>
                </div>
                <div className="shop-preview-copy">
                  <span className="shop-card-index" aria-hidden="true">{String(index + 1).padStart(2, "0")}</span>
                  <p>{entry.collection} · {entry.type}</p>
                  <h3>{entry.title}</h3>
                  <p>{entry.description}</p>
                  <dl>
                    <div><dt>{tr("Material note")}</dt><dd>{entry.materialNote}</dd></div>
                    <div><dt>{tr("Detail")}</dt><dd>{tr(shopDetailAvailability)}</dd></div>
                    <div><dt>{tr("Status")}</dt><dd>{entry.isPlaceholder ? shopPlaceholderNotice : entry.presentationStatus}</dd></div>
                  </dl>
                </div>
              </li>
            ))}
          </ol>
        ) : (
          <div className="feedback-state" role="status">
            <p>{tr("Shop preview đang chờ nội dung collectible được phê duyệt.")}</p>
          </div>
        )}
        <div className="shop-preview-action">
          <ButtonLink href="/shop" variant="secondary">{tr("Mở shop foundation")}</ButtonLink>
        </div>
      </Container>
    </section>
  );
}
