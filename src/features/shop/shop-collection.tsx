
import { getLocale, getTranslator } from "@/lib/i18n/server";
import Link from "@/lib/i18n/link";
import { type ShopDataSource, type ShopPresentationEntry } from "./shop-content";
import { ShopMedia } from "./shop-media";

type ShopCollectionProps = Readonly<{
  entries: readonly ShopPresentationEntry[];
  source: ShopDataSource;
}>;

export async function ShopCollection({ entries, source }: ShopCollectionProps) {
  const tr = await getTranslator();
  const locale = await getLocale();
  const featured = entries.length === 1;
  if (entries.length === 0) {
    return (
      <section className="shop-route-section" aria-labelledby="shop-empty-title">
        <div className="feedback-state" role="status">
          <h2 id="shop-empty-title">{tr(source === "commerce-catalog" ? "Shop chưa có object published." : "The collection is temporarily unavailable.")}</h2>
          <p>{tr("Please check back soon to explore our objects.")}</p>
        </div>
      </section>
    );
  }

  return (
    <section className={`shop-route-section${featured ? " shop-route-section--featured" : ""}`} aria-labelledby="shop-list-title">
      <div className="shop-route-heading">
        <p className="eyebrow">{locale === "vi" ? "BỘ SƯU TẬP" : "COLLECTION"}</p>
        <h2 id="shop-list-title">{featured
          ? (locale === "vi" ? "Sản phẩm nổi bật" : "Featured object")
          : (locale === "vi" ? "Sản phẩm" : "Products")}</h2>
        <p>{locale === "vi" ? `${entries.length} sản phẩm` : `${entries.length} ${entries.length === 1 ? "product" : "products"}`}</p>
      </div>
      <ol className={`shop-route-list${featured ? " shop-route-list--featured" : ""}`}>
        {entries.map((entry, index) => (
          <li key={entry.id} className={`shop-route-card${featured ? " shop-route-card--featured" : ""}`}>
            <Link href={entry.href} className="shop-route-image" aria-label={`${tr("Xem object detail")}: ${entry.title}`}><ShopMedia media={entry.media} priority={featured && index === 0} sizes={featured ? "(max-width: 900px) 90vw, 46vw" : "(max-width: 700px) 25vw, 160px"} /></Link>
            <div className="shop-route-copy">
              <span aria-hidden="true">{String(index + 1).padStart(2, "0")}</span>
              <p>{tr(entry.collection)} · {tr(entry.type)}</p>
              <h3><Link href={entry.href}>{entry.title}</Link></h3>
            </div>
            <p className="shop-route-status">{tr(entry.availabilityLabel)}</p>
            <p className="shop-route-price">{entry.priceLabel ?? "—"}</p>
            <Link className="shop-route-action" href={entry.href}>{tr("Xem object detail")} ↗</Link>
          </li>
        ))}
      </ol>
    </section>
  );
}
