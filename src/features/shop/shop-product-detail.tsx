
import { getTranslator } from "@/lib/i18n/server";
import Link from "@/lib/i18n/link";
import type { ShopPresentationEntry } from "./shop-content";
import { shopPlaceholderNotice } from "./shop-content";
import { ShopMedia } from "./shop-media";

type ShopProductDetailProps = Readonly<{
  entry: ShopPresentationEntry;
}>;

export async function ShopProductDetail({ entry }: ShopProductDetailProps) {
  const tr = await getTranslator();
  const isCatalogEntry = entry.dataSource === "commerce-catalog";

  return (
    <>
      <section className="shop-route-hero" aria-labelledby="shop-detail-title">
        <p className="eyebrow">{entry.collection} · {entry.type}</p>
        <h1 id="shop-detail-title">{entry.title}</h1>
        <p>{entry.description}</p>
        {entry.priceLabel ? <p className="quiet-label">{tr("Published price ·")}{" "}{entry.priceLabel}</p> : null}
        <p className="quiet-label">{tr(entry.availabilityLabel)}</p>
        <Link href="/shop">{tr("← Quay lại Shop")}</Link>
      </section>

      <section className="shop-route-section" aria-labelledby="shop-object-title">
        <div className="shop-route-card">
          <ShopMedia media={entry.media} priority />
          <div className="shop-route-copy">
            <p className="eyebrow">{tr("Object")}</p>
            <h2 id="shop-object-title">{tr("Object story")}</h2>
            <p>{entry.story}</p>
            <dl>
              <div><dt>{tr("Material note")}</dt><dd>{entry.materialNote}</dd></div>
              <div><dt>{tr("Presentation status")}</dt><dd>{tr(entry.presentationStatus)}</dd></div>
              <div><dt>{tr("Data authority")}</dt><dd>{isCatalogEntry ? tr("Luminal Factory Commerce catalog") : shopPlaceholderNotice}</dd></div>
            </dl>
          </div>
        </div>
      </section>

      <section className="shop-route-section" aria-labelledby="shop-craft-title">
        <div className="shop-route-heading">
          <p className="eyebrow">{tr("Craft notes")}</p>
          <h2 id="shop-craft-title">{tr("What is known now")}</h2>
          <p>{tr("Only information present in the active source is shown. Unknown production facts are intentionally omitted.")}</p>
        </div>
        <ol className="steps-grid">
          {entry.craftNotes.map((note, index) => (
            <li key={note}>
              <span>{String(index + 1).padStart(2, "0")}</span>
              <h3>{tr("Object note")}</h3>
              <p>{note}</p>
            </li>
          ))}
        </ol>
      </section>

      <section className="shop-route-section" aria-labelledby="shop-facts-title">
        <div className="shop-route-heading">
          <p className="eyebrow">{tr("Object facts")}</p>
          <h2 id="shop-facts-title">{tr("Published facts")}</h2>
          <p>{isCatalogEntry ? tr("Catalog facts may include a published price, but no stock quantity or purchase state is exposed.") : tr("Fallback facts are presentation-only and do not imply price, stock or purchase state.")}</p>
        </div>
        <dl className="process-list">
          {entry.facts.map((fact, index) => (
            <div key={tr(fact.label)}>
              <dt><span>{String(index + 1).padStart(2, "0")}</span> {tr(fact.label)}</dt>
              <dd>{fact.value}</dd>
            </div>
          ))}
        </dl>
      </section>

      <section className="shop-route-section" aria-labelledby="shop-purchase-boundary-title">
        <div className="feedback-state" role="status">
          <h2 id="shop-purchase-boundary-title">{tr("Purchase flow chưa được mở trong Phase 5.")}</h2>
          <p>{tr("Shop hiện chỉ đọc catalog public. Cart, checkout, payment capture và order creation sẽ được thiết kế ở các phase riêng sau khi identity và payment contracts sẵn sàng.")}</p>
          <Link href="/shop">{tr("Khám phá các object khác")}</Link>
        </div>
      </section>
    </>
  );
}
