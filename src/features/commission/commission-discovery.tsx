import Link from "next/link";
import type { CommissionPresentation } from "./commission-content";

type CommissionDiscoveryProps = Readonly<{
  content: CommissionPresentation;
}>;

export function CommissionDiscovery({ content }: CommissionDiscoveryProps) {
  return (
    <>
      <section className="section" aria-labelledby="commission-title">
        <div className="section-heading">
          <p className="eyebrow">{content.eyebrow}</p>
          <div>
            <h1 id="commission-title">{content.title}</h1>
            <p className="lede">{content.summary}</p>
          </div>
          <div>
            <span className="status-badge">{content.availabilityLabel}</span>
            <p className="lede">{content.availabilityDescription}</p>
          </div>
        </div>
      </section>

      <section className="section section-surface" aria-labelledby="commission-categories-title">
        <div className="section-heading">
          <p className="eyebrow">Commission scope</p>
          <h2 id="commission-categories-title">Những hướng có thể bắt đầu một cuộc trao đổi.</h2>
          <p>Đây là phạm vi trình bày ban đầu, không phải cam kết về giá, vật liệu, MOQ hay thời gian thực hiện.</p>
        </div>
        <div className="card-grid">
          {content.categories.map((category) => (
            <article className="feedback-state" key={category.title}>
              <h3>{category.title}</h3>
              <p>{category.description}</p>
            </article>
          ))}
        </div>
      </section>

      <section className="section" aria-labelledby="commission-process-title">
        <div className="section-heading">
          <p className="eyebrow">Collaboration process</p>
          <h2 id="commission-process-title">Từ ý tưởng đến một scope có thể thực hiện.</h2>
          <p>Request chỉ mở đầu cho review. Nó không tự động tạo order hoặc production slot.</p>
        </div>
        <ol className="steps-grid">
          {content.processSteps.map((step) => (
            <li key={step.number}>
              <span>{step.number}</span>
              <h3>{step.title}</h3>
              <p>{step.description}</p>
            </li>
          ))}
        </ol>
      </section>

      <section className="section section-surface" aria-labelledby="commission-prepare-title">
        <div className="section-heading">
          <p className="eyebrow">Prepare</p>
          <h2 id="commission-prepare-title">Những thông tin hữu ích trước khi inquiry mở.</h2>
          <p>Không có upload hoặc submit ở slice này. Danh sách dưới đây chỉ giúp chuẩn bị context cho một trao đổi tương lai.</p>
        </div>
        <ol className="process-list">
          {content.preparationItems.map((item, index) => (
            <li key={item}>
              <span>{String(index + 1).padStart(2, "0")}</span>
              <h3>{item}</h3>
            </li>
          ))}
        </ol>
      </section>

      <section className="section" aria-labelledby="commission-expectations-title">
        <div className="section-heading">
          <p className="eyebrow">Expectations</p>
          <h2 id="commission-expectations-title">Rõ ràng trước khi bắt đầu.</h2>
          <p>Commission là một quy trình review và thỏa thuận riêng, không phải luồng mua hàng trực tiếp.</p>
        </div>
        <ul className="process-list">
          {content.expectationItems.map((item, index) => (
            <li key={item}>
              <span>{String(index + 1).padStart(2, "0")}</span>
              <h3>{item}</h3>
            </li>
          ))}
        </ul>
      </section>

      <section className="section" aria-labelledby="commission-next-title">
        <div className="contact-panel">
          <p className="eyebrow">Discovery only</p>
          <h2 id="commission-next-title">Inquiry form chưa mở trong phiên bản này.</h2>
          <p>
            Bạn có thể xem Archive để hiểu thêm về ngôn ngữ object của Luminal. Form commission, upload, availability và dữ liệu khách hàng sẽ được thiết kế trong một slice riêng.
          </p>
          <div className="actions">
            <Link className="button-link" href="/archive">Xem Archive</Link>
            <Link className="button-link button-secondary" href="/#raffle">Quay về Raffle</Link>
          </div>
        </div>
      </section>
    </>
  );
}
