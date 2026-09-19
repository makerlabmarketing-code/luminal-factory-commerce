import Link from "next/link";
import type { CartPageView } from "./cart-page-contract";
import { CartLineControls } from "./cart-line-controls";
import { CartMedia } from "./cart-media";
import { CartSyncControl } from "./cart-sync-control";

function CartEmpty() {
  return (
    <section className="cart-feedback-panel" aria-labelledby="cart-empty-title">
      <p className="eyebrow">No selections</p>
      <h2 id="cart-empty-title">Giỏ hàng đang trống.</h2>
      <p>Những object direct-shop bạn chọn sẽ được giữ ở đây dưới dạng ý định mua, không phải đặt trước hàng.</p>
      <div className="actions">
        <Link className="button-link" href="/shop">Xem Shop <span aria-hidden="true">↗</span></Link>
        <Link className="button-link button-secondary" href="/archive">Xem Archive <span aria-hidden="true">↗</span></Link>
      </div>
    </section>
  );
}

function CartUnavailable() {
  return (
    <section className="cart-feedback-panel" aria-labelledby="cart-unavailable-title">
      <p className="eyebrow">Private runtime gate</p>
      <h2 id="cart-unavailable-title">Giỏ hàng chưa được mở trên môi trường này.</h2>
      <p>Trang giữ trạng thái an toàn cho đến khi runtime Cart được bật và kiểm tra bằng một quy trình riêng.</p>
      <Link className="text-link" href="/shop">Tiếp tục xem Shop <span aria-hidden="true">↗</span></Link>
    </section>
  );
}

function CartSyncRequired() {
  return (
    <section className="cart-feedback-panel" aria-labelledby="cart-sync-title">
      <p className="eyebrow">Verified account · pending sync</p>
      <h2 id="cart-sync-title">Hoàn tất đồng bộ giỏ hàng.</h2>
      <p>
        Tài khoản đã được xác minh nhưng lựa chọn trên thiết bị này chưa gắn xong.
        Hệ thống sẽ giữ nguyên dữ liệu cũ nếu đồng bộ chưa thành công.
      </p>
      <CartSyncControl />
    </section>
  );
}

export function CartPage({ view }: Readonly<{ view: CartPageView }>) {
  return (
    <div className="cart-page-grid">
      <header className="cart-page-heading">
        <p className="eyebrow">Luminal selection desk · Phase 6</p>
        <h1>Giỏ hàng</h1>
        <p>
          Một nơi yên tĩnh để xem lại object direct-shop. Giá và khả dụng luôn được đọc lại từ catalog;
          giỏ hàng không khóa giá hoặc giữ hàng.
        </p>
      </header>

      {view.state === "empty" ? <CartEmpty /> : null}
      {view.state === "unavailable" ? <CartUnavailable /> : null}
      {view.state === "sync_required" ? <CartSyncRequired /> : null}
      {view.state === "ready" ? (
        <>
          <section className="cart-lines" aria-labelledby="cart-lines-title">
            <div className="cart-section-heading">
              <div>
                <p className="eyebrow">Current selections</p>
                <h2 id="cart-lines-title">{view.lines.length} object đang khả dụng</h2>
              </div>
              <p>Requested quantity · chưa giữ hàng</p>
            </div>

            {view.unavailableLineCount > 0 ? (
              <div className="cart-stale-notice" role="status">
                <strong>{view.unavailableLineCount} lựa chọn không còn khả dụng.</strong>
                <span>Chúng đã được bỏ khỏi phần ước tính và không hiển thị bằng dữ liệu cũ.</span>
              </div>
            ) : null}

            {view.lines.length > 0 ? (
              <ol className="cart-line-list">
                {view.lines.map((line) => (
                  <li className="cart-line" key={`${line.productId}:${line.variantId ?? "base"}`}>
                    <CartMedia media={line.media} />
                    <div className="cart-line-copy">
                      <p className="cart-line-kicker">{line.variantLabel ?? "Base object"}</p>
                      <h3><Link href={`/shop/${line.slug}`}>{line.title}</Link></h3>
                      <dl>
                        <div><dt>Giá hiện tại</dt><dd>{line.unitPriceLabel ?? "Chưa công bố"}</dd></div>
                        <div><dt>Tạm tính dòng</dt><dd>{line.lineEstimateLabel ?? "Chưa thể tính"}</dd></div>
                      </dl>
                      <CartLineControls
                        key={line.requestedQuantity}
                        productId={line.productId}
                        variantId={line.variantId}
                        productName={line.title}
                        requestedQuantity={line.requestedQuantity}
                      />
                    </div>
                  </li>
                ))}
              </ol>
            ) : (
              <div className="cart-lines-empty">
                <p>Không còn object khả dụng để hiển thị.</p>
                <Link className="text-link" href="/shop">Quay lại Shop <span aria-hidden="true">↗</span></Link>
              </div>
            )}
          </section>

          <aside className="cart-summary" aria-labelledby="cart-summary-title">
            <p className="eyebrow">Current estimate</p>
            <h2 id="cart-summary-title">Ước tính hiện tại</h2>
            <div className="cart-summary-total">
              <span>Tạm tính</span>
              <strong>{view.estimateStatus === "complete" ? view.subtotalLabel : "Chưa thể tính"}</strong>
            </div>
            {view.estimateStatus === "incomplete" ? (
              <p role="status">Ít nhất một object chưa có giá VND rõ ràng, nên hệ thống không cộng tạm tính một phần.</p>
            ) : null}
            <p>Checkout sau này sẽ xác nhận lại giá và khả dụng. Phí vận chuyển, thuế và giảm giá chưa được tính.</p>
            <div className="cart-checkout-boundary">
              <strong>Thanh toán đang được chuẩn bị</strong>
              <span>Chưa có order hoặc payment nào được tạo từ trang này.</span>
            </div>
            <Link className="button-link button-secondary" href="/shop">Tiếp tục xem Shop <span aria-hidden="true">↗</span></Link>
          </aside>
        </>
      ) : null}
    </div>
  );
}
