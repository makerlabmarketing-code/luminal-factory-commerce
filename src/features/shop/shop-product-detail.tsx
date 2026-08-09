import Link from "next/link";
import type { ShopPresentationEntry } from "./shop-content";
import { shopPlaceholderNotice } from "./shop-content";

type ShopProductDetailProps = Readonly<{
  entry: ShopPresentationEntry;
}>;

export function ShopProductDetail({ entry }: ShopProductDetailProps) {
  return (
    <>
      <section className="shop-route-hero" aria-labelledby="shop-detail-title">
        <p className="eyebrow">{entry.collection} · {entry.type}</p>
        <h1 id="shop-detail-title">{entry.title}</h1>
        <p>{entry.description}</p>
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
            <p className="eyebrow">Object study</p>
            <h2 id="shop-object-title">Object story</h2>
            <p>{entry.story}</p>
            <dl>
              <div><dt>Material note</dt><dd>{entry.materialNote}</dd></div>
              <div><dt>Presentation status</dt><dd>{entry.presentationStatus}</dd></div>
              <div><dt>Media authority</dt><dd>{entry.media.productionApproved ? "Production approved" : shopPlaceholderNotice}</dd></div>
            </dl>
          </div>
        </div>
      </section>

      <section className="shop-route-section" aria-labelledby="shop-craft-title">
        <div className="shop-route-heading">
          <p className="eyebrow">Craft notes</p>
          <h2 id="shop-craft-title">What is known now</h2>
          <p>Only approved presentation information is shown. Unknown production facts are intentionally omitted.</p>
        </div>
        <ol className="steps-grid">
          {entry.craftNotes.map((note, index) => (
            <li key={note}>
              <span>{String(index + 1).padStart(2, "0")}</span>
              <h3>Study note</h3>
              <p>{note}</p>
            </li>
          ))}
        </ol>
      </section>

      <section className="shop-route-section" aria-labelledby="shop-facts-title">
        <div className="shop-route-heading">
          <p className="eyebrow">Object facts</p>
          <h2 id="shop-facts-title">Presentation facts</h2>
          <p>No price, stock, shipping promise, SKU, cart, checkout, payment, or order state is implied by this page.</p>
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
          <h2 id="shop-purchase-boundary-title">Direct purchase chưa được mở trong slice này.</h2>
          <p>Trang detail hiện chỉ dùng để khám phá object. Khi catalog, giá, tồn kho, checkout và order contract được duyệt, transaction controls sẽ được thiết kế ở một slice riêng.</p>
          <Link href="/shop">Khám phá các object study khác</Link>
        </div>
      </section>
    </>
  );
}
