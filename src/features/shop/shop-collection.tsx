import Link from "next/link";
import { shopPlaceholderNotice, type ShopDataSource, type ShopPresentationEntry } from "./shop-content";

type ShopCollectionProps = Readonly<{
  entries: readonly ShopPresentationEntry[];
  source: ShopDataSource;
}>;

export function ShopCollection({ entries, source }: ShopCollectionProps) {
  if (entries.length === 0) {
    return (
      <section className="shop-route-section" aria-labelledby="shop-empty-title">
        <div className="feedback-state" role="status">
          <h2 id="shop-empty-title">Shop chưa có object published.</h2>
          <p>Commerce catalog đã phản hồi thành công nhưng hiện không có sản phẩm public để hiển thị.</p>
        </div>
      </section>
    );
  }

  const isLiveCatalog = source === "commerce-catalog";

  return (
    <section className="shop-route-section" aria-labelledby="shop-list-title">
      <div className="shop-route-heading">
        <p className="eyebrow">Curated object shelf</p>
        <h2 id="shop-list-title">{isLiveCatalog ? "Published Commerce catalog" : "Presentation fallback"}</h2>
        <p>
          {isLiveCatalog
            ? "Object và giá bên dưới đến từ public Commerce catalog. Purchase controls vẫn được giữ ngoài Phase 5."
            : `${shopPlaceholderNotice}. Fallback này chỉ giữ Shop hoạt động ổn định khi catalog configuration hoặc Data API chưa sẵn sàng.`}
        </p>
      </div>
      <ol className="shop-route-list">
        {entries.map((entry, index) => (
          <li key={entry.id} className="shop-route-card">
            <div className={`shop-media shop-media-${entry.media.tone}`} role="img" aria-label={entry.media.alt}>
              <span aria-hidden="true" />
              <em>{entry.media.label}</em>
            </div>
            <div className="shop-route-copy">
              <span aria-hidden="true">{String(index + 1).padStart(2, "0")}</span>
              <p>{entry.collection} · {entry.type}</p>
              <h3><Link href={entry.href}>{entry.title}</Link></h3>
              <p>{entry.description}</p>
              <dl>
                {entry.priceLabel ? <div><dt>Published price</dt><dd>{entry.priceLabel}</dd></div> : null}
                <div><dt>Availability</dt><dd>{entry.availabilityLabel}</dd></div>
                <div><dt>Detail</dt><dd><Link href={entry.href}>Xem object detail</Link></dd></div>
                <div><dt>Data source</dt><dd>{entry.isPlaceholder ? shopPlaceholderNotice : "Commerce catalog"}</dd></div>
              </dl>
            </div>
          </li>
        ))}
      </ol>
    </section>
  );
}
