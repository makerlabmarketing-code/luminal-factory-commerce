import Link from "next/link";
import type { AboutPresentation as AboutContent } from "./about-content";

type AboutPresentationProps = Readonly<{ content: AboutContent }>;

export function AboutPresentation({ content }: AboutPresentationProps) {
  return (
    <>
      <section className="section" aria-labelledby="about-page-title">
        <div className="section-heading">
          <p className="eyebrow">{content.eyebrow}</p>
          <div>
            <p className="release-status">{content.brandLine}</p>
            <h1 id="about-page-title">{content.title}</h1>
            <p className="lede">{content.summary}</p>
          </div>
        </div>
      </section>

      <section className="section section-surface" aria-labelledby="about-objects-title">
        <div className="section-heading">
          <p className="eyebrow">What we make</p>
          <h2 id="about-objects-title">Object trước, category sau.</h2>
          <p>Ba hướng public dưới đây mô tả phạm vi hiện tại mà không biến chúng thành lời hứa về stock, capacity hay timing.</p>
        </div>
        <div className="card-grid">
          {content.objectCategories.map((category) => (
            <article className="feedback-state" key={category.title}>
              <h3>{category.title}</h3>
              <p>{category.description}</p>
            </article>
          ))}
        </div>
      </section>

      <section className="section" aria-labelledby="about-process-title">
        <div className="section-heading">
          <p className="eyebrow">Studio process</p>
          <h2 id="about-process-title">Từ hình dung đến một vật thể có thật.</h2>
          <p>Đây là ngữ cảnh editorial về cách công việc có thể di chuyển trong studio, không phải production SLA.</p>
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

      <section className="section section-surface" aria-labelledby="about-principles-title">
        <div className="section-heading">
          <p className="eyebrow">Studio principles</p>
          <h2 id="about-principles-title">Ít lời hứa hơn, nhiều sự chú ý hơn vào object.</h2>
        </div>
        <ul className="process-list">
          {content.principles.map((principle, index) => (
            <li key={principle.title}>
              <span>{String(index + 1).padStart(2, "0")}</span>
              <div>
                <h3>{principle.title}</h3>
                <p>{principle.description}</p>
              </div>
            </li>
          ))}
        </ul>
      </section>

      <section className="section" aria-labelledby="about-explore-title">
        <div className="section-heading">
          <p className="eyebrow">Explore Luminal</p>
          <h2 id="about-explore-title">Mỗi surface có một vai trò riêng.</h2>
        </div>
        <div className="card-grid">
          {content.routeBridges.map((bridge) => (
            <article className="feedback-state" key={bridge.href}>
              <h3>{bridge.label}</h3>
              <p>{bridge.description}</p>
              <Link className="button-link button-secondary" href={bridge.href}>Mở {bridge.label}</Link>
            </article>
          ))}
        </div>
      </section>

      <section className="section" aria-labelledby="about-commission-title">
        <div className="contact-panel">
          <p className="eyebrow">Custom object</p>
          <h2 id="about-commission-title">Có một ý tưởng cần studio review?</h2>
          <p>About không tạo một contact form thứ hai. Commission giữ riêng inquiry context và các expectation liên quan.</p>
          <div className="actions">
            <Link className="button-link" href="/commission">Đi tới Commission</Link>
          </div>
        </div>
      </section>
    </>
  );
}
