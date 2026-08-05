import Link from "next/link";
import { shopDetailAvailability, shopPlaceholderNotice, type ShopPresentationEntry } from "./shop-content";

type ShopCollectionProps = Readonly<{
  entries: readonly ShopPresentationEntry[];
}>;

export function ShopCollection({ entries }: ShopCollectionProps) {
  if (entries.length === 0) {
    return (
      <section className="shop-route-section" aria-labelledby="shop-empty-title">
        <div className="feedback-state" role="status">
          <h2 id="shop-empty-title">Shop đang chờ collectible được phê duyệt.</h2>
          <p>Route foundation vẫn sẵn sàng cho presentation data trong slice tương lai, không mở giao dịch.</p>
          <Link href="/#raffle">Quay về raffle discovery</Link>
        </div>
      </section>
    );
  }

  return (
    <section className="shop-route-section" aria-labelledby="shop-list-title">
      <div className="shop-route-heading">
        <p className="eyebrow">Curated object shelf</p>
        <h2 id="shop-list-title">Presentation-only shop entries</h2>
        <p>{shopPlaceholderNotice}. Shop foundation khác Archive: đây là discovery cho vật phẩm có thể mua trực tiếp trong tương lai, chưa phải release history hoặc hệ thống ecommerce.</p>
      </div>
      <ol className="shop-route-list">
        {entries.map((entry, index) => (
          <li key={entry.id} id={entry.presentationKey} className="shop-route-card">
            <div className={`shop-media shop-media-${entry.media.tone}`} role="img" aria-label={entry.media.alt}>
              <span aria-hidden="true" />
              <em>{entry.media.label}</em>
            </div>
            <div className="shop-route-copy">
              <span aria-hidden="true">{String(index + 1).padStart(2, "0")}</span>
              <p>{entry.collection} · {entry.type}</p>
              <h3>{entry.title}</h3>
              <p>{entry.description}</p>
              <dl>
                <div><dt>Material note</dt><dd>{entry.materialNote}</dd></div>
                <div><dt>Detail availability</dt><dd>{shopDetailAvailability}</dd></div>
                <div><dt>Placeholder marker</dt><dd>{entry.isPlaceholder ? shopPlaceholderNotice : entry.presentationStatus}</dd></div>
              </dl>
            </div>
          </li>
        ))}
      </ol>
    </section>
  );
}
