import { localizePresentation } from "@/lib/i18n/presentation";

import { getTranslator, getLocale } from "@/lib/i18n/server";
import Link from "@/lib/i18n/link";
import type { CommissionPresentation } from "./commission-content";
import { CommissionInquiryForm } from "./commission-inquiry-form";
import { CommissionExamples } from "@/features/studio/studio-editorial";
import { getStudioCopy } from "@/features/studio/studio-copy";

type CommissionDiscoveryProps = Readonly<{
  content: CommissionPresentation;
  inquiryEnabled: boolean;
}>;

export async function CommissionDiscovery({ content: originalContent, inquiryEnabled }: CommissionDiscoveryProps) {
  const tr = await getTranslator();
  const content = localizePresentation(originalContent, await getLocale());
  const copy = getStudioCopy(await getLocale());
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
            <span className="status-badge">{inquiryEnabled ? tr("Commission inquiry đang mở") : content.availabilityLabel}</span>
            <p className="lede">
              {inquiryEnabled
                ? tr("Bạn có thể gửi context để studio review. Inquiry không tạo order, quote, payment hoặc giữ production slot.")
                : content.availabilityDescription}
            </p>
          </div>
        </div>
      </section>

      <section className="section section-surface" aria-labelledby="commission-categories-title">
        <div className="section-heading">
          <p className="eyebrow">{tr("Commission scope")}</p>
          <h2 id="commission-categories-title">{tr("Những hướng có thể bắt đầu một cuộc trao đổi.")}</h2>
          <p>{tr("Đây là phạm vi trình bày ban đầu, không phải cam kết về giá, vật liệu, MOQ hay thời gian thực hiện.")}</p>
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

      <CommissionExamples />
      <section className="section" aria-labelledby="commission-process-title">
        <div className="section-heading">
          <p className="eyebrow">{tr("Collaboration process")}</p>
          <h2 id="commission-process-title">{tr("Từ ý tưởng đến một scope có thể thực hiện.")}</h2>
          <p>{tr("Request chỉ mở đầu cho review. Nó không tự động tạo order hoặc production slot.")}</p>
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
          <p className="eyebrow">{tr("Prepare")}</p>
          <h2 id="commission-prepare-title">{tr("Những thông tin hữu ích trước khi gửi inquiry.")}</h2>
          <p>{copy.prepareIntro}</p>
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
          <p className="eyebrow">{tr("Expectations")}</p>
          <h2 id="commission-expectations-title">{tr("Rõ ràng trước khi bắt đầu.")}</h2>
          <p>{tr("Commission là một quy trình review và thỏa thuận riêng, không phải luồng mua hàng trực tiếp.")}</p>
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

      <CommissionInquiryForm enabled={inquiryEnabled} />

      <section className="section" aria-labelledby="commission-next-title">
        <div className="contact-panel">
          <p className="eyebrow">{tr("Explore further")}</p>
          <h2 id="commission-next-title">{tr("Xem thêm ngôn ngữ object của Luminal.")}</h2>
          <p>{tr("Archive lưu các object study theo hướng editorial, còn Shop trình bày các object discovery trực tiếp. Inquiry vẫn là một luồng review riêng.")}</p>
          <div className="actions">
            <Link className="button-link" href="/archive">{tr("Xem Archive")}</Link>
            <Link className="button-link button-secondary" href="/shop">{tr("Xem Shop")}</Link>
          </div>
        </div>
      </section>
    </>
  );
}
