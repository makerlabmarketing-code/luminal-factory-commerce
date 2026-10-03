
import { getTranslator } from "@/lib/i18n/server";
import Link from "@/lib/i18n/link";
import { shopPlaceholderNotice, type ShopDataSource, type ShopPresentationEntry } from "./shop-content";
import { ShopMedia } from "./shop-media";

type ShopCollectionProps = Readonly<{
  entries: readonly ShopPresentationEntry[];
  source: ShopDataSource;
}>;

export async function ShopCollection({ entries, source }: ShopCollectionProps) {
  const tr = await getTranslator();
  if (entries.length === 0) {
    return (
      <section className="shop-route-section" aria-labelledby="shop-empty-title">
        <div className="feedback-state" role="status">
          <h2 id="shop-empty-title">{tr(source === "commerce-catalog" ? "Shop chưa có object published." : "The collection is temporarily unavailable.")}</h2>
          <p>{tr(source === "commerce-catalog" ? "Commerce catalog đã phản hồi thành công nhưng hiện không có sản phẩm public để hiển thị." : "Please check back soon to explore our objects.")}</p>
        </div>
      </section>
    );
  }

  const isLiveCatalog = source === "commerce-catalog";

  return (
    <section className="shop-route-section" aria-labelledby="shop-list-title">
      <div className="shop-route-heading">
        <p className="eyebrow">{tr("Curated object shelf")}</p>
        <h2 id="shop-list-title">{isLiveCatalog ? tr("Published Commerce catalog") : tr("Presentation fallback")}</h2>
        <p>
          {isLiveCatalog
            ? tr("Object và giá bên dưới đến từ public Commerce catalog. Purchase controls vẫn được giữ ngoài Phase 5.")
            : `${tr(shopPlaceholderNotice)}. Fallback này chỉ giữ Shop hoạt động ổn định khi catalog configuration hoặc Data API chưa sẵn sàng.`}
        </p>
      </div>
      <ol className="shop-route-list">
        {entries.map((entry, index) => (
          <li key={entry.id} className="shop-route-card">
            <ShopMedia media={entry.media} />
            <div className="shop-route-copy">
              <span aria-hidden="true">{String(index + 1).padStart(2, "0")}</span>
              <p>{tr(entry.collection)} · {tr(entry.type)}</p>
              <h3><Link href={entry.href}>{entry.title}</Link></h3>
              <p>{entry.description}</p>
              <dl>
                {entry.priceLabel ? <div><dt>{tr("Published price")}</dt><dd>{entry.priceLabel}</dd></div> : null}
                <div><dt>{tr("Availability")}</dt><dd>{tr(entry.availabilityLabel)}</dd></div>
                <div><dt>{tr("Detail")}</dt><dd><Link href={entry.href}>{tr("Xem object detail")}</Link></dd></div>
                <div><dt>{tr("Data source")}</dt><dd>{entry.isPlaceholder ? shopPlaceholderNotice : tr("Commerce catalog")}</dd></div>
              </dl>
            </div>
          </li>
        ))}
      </ol>
    </section>
  );
}
