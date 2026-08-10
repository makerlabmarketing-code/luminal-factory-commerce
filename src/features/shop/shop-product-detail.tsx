import Link from "next/link";
import type { ShopPresentationEntry } from "./shop-content";
import { shopPlaceholderNotice } from "./shop-content";

type ShopProductDetailProps = Readonly<{
  entry: ShopPresentationEntry;
}>;

export function ShopProductDetail({ entry }: ShopProductDetailProps) {
  const isCatalogEntry = entry.dataSource === "commerce-catalog";

  return (
    <>
      <section className="shop-route-hero" aria-labelledby="shop-detail-title">
        <p className="eyebrow">{entry.collection} · {entry.type}</p>
        <h1 id="shop-detail-title">{entry.title}</h1>
        <p>{entry.description}</p>
        {entry.priceLabel ? <p className="quiet-label">Published price · {entry.priceLabel}</p> : null}
        <p className="quiet-label">{entry.availabilityLabel}</p>
        <Link href="/shop">← Quay lại Shop</Link>
      </section>

      <section className="shop-route-section" aria-labelledby="shop-object-title">
        <div className="shop-route-card">
          <div className={`shop-media shop-media-${entry.media.tone}`} role="img" aria-label={entry.media.alt}>
            <span aria-hidden="true" />
            <em>{entry.media.label}</em>
          </div>
          <div className="shop-route-copy">
            <p className="eyebrow">Object</p>
            <h2 id="shop-object-title">Object story</h2>
            <p>{entry.story}</p>
            <dl>
              <div><dt>Material note</dt><dd>{entry.materialNote}</dd></div>
              <div><dt>Presentation status</dt><dd>{entry.presentationStatus}</dd></div>
              <div><dt>Data authority</dt><dd>{isCatalogEntry ? "Luminal Factory Commerce catalog" : shopPlaceholderNotice}</dd></div>
            </dl>
          </div>
        </div>
      </section>

      <section className="shop-route-section" aria-labelledby="shop-craft-title">
        <div className="shop-route-heading">
          <p className="eyebrow">Craft notes</p>
          <h2 id="shop-craft-title">What is known now</h2>
          <p>Only information present in the active source is shown. Unknown production facts are intentionally omitted.</p>
        </div>
        <ol className="steps-grid">
          {entry.craftNotes.map((note, index) => (
            <li key={note}>
              <span>{String(index + 1).padStart(2, "0")}</span>
              <h3>Object note</h3>
              <p>{note}</p>
            </li>
          ))}
        </ol>
      </section>

      <section className="shop-route-section" aria-labelledby="shop-facts-title">
        <div className="shop-route-heading">
          <p className="eyebrow">Object facts</p>
          <h2 id="shop-facts-title">Published facts</h2>
          <p>{isCatalogEntry ? "Catalog facts may include a published price, but no stock quantity or purchase state is exposed." : "Fallback facts are presentation-only and do not imply price, stock or purchase state."}</p>
        </div>
        <dl className="process-list">
          {entry.facts.map((fact, index) => (
            <div key={fact.label}>
              <dt><span>{String(index + 1).padStart(2, "0")}</span> {fact.label}</dt>
              <dd>{fact.value}</dd>
            </div>
          ))}
        </dl>
      </section>

      <section className="shop-route-section" aria-labelledby="shop-purchase-boundary-title">
        <div className="feedback-state" role="status">
          <h2 id="shop-purchase-boundary-title">Purchase flow chưa được mở trong Phase 5.</h2>
          <p>Shop hiện chỉ đọc catalog public. Cart, checkout, payment capture và order creation sẽ được thiết kế ở các phase riêng sau khi identity và payment contracts sẵn sàng.</p>
          <Link href="/shop">Khám phá các object khác</Link>
        </div>
      </section>
    </>
  );
}
