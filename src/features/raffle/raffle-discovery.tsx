import Link from "next/link";
import type { RafflePresentation } from "./raffle-content";

type RaffleDiscoveryProps = Readonly<{
  content: RafflePresentation;
}>;

export function RaffleDiscovery({ content }: RaffleDiscoveryProps) {
  return (
    <>
      <section className="section" aria-labelledby="raffle-title">
        <div className="section-heading">
          <p className="eyebrow">{content.eyebrow}</p>
          <div>
            <h1 id="raffle-title">{content.title}</h1>
            <p className="lede">{content.summary}</p>
          </div>
          <div>
            <span className="status-badge">{content.statusLabel}</span>
            <p className="lede">{content.statusDescription}</p>
          </div>
        </div>
      </section>

      <section className="section section-surface" aria-labelledby="raffle-release-title">
        <div className="section-heading">
          <p className="eyebrow">Featured release study</p>
          <div>
            <h2 id="raffle-release-title">{content.releaseTitle}</h2>
            <p className="lede">{content.releaseStory}</p>
          </div>
          <p>{content.materialNote}</p>
        </div>
        <figure className="hero-object" aria-label="Internal raffle release placeholder">
          <div className="object-plinth" aria-hidden="true" />
          <div className="orb" aria-hidden="true" />
          <div className="facet facet-one" aria-hidden="true" />
          <div className="facet facet-two" aria-hidden="true" />
          <figcaption>
            <strong>Internal presentation placeholder</strong>
            <span>{content.presentationState} · {content.timeZone}</span>
          </figcaption>
        </figure>
      </section>

      <section className="section" aria-labelledby="raffle-how-title">
        <div className="section-heading">
          <p className="eyebrow">How raffle works</p>
          <h2 id="raffle-how-title">Một entry và một order là hai việc khác nhau.</h2>
          <p>Đây là mô hình khái niệm. Chi tiết eligibility, duplicate rules, winner selection và payment deadline chưa được công bố trong slice này.</p>
        </div>
        <ol className="steps-grid">
          {content.howItWorks.map((step) => (
            <li key={step.number}>
              <span>{step.number}</span>
              <h3>{step.title}</h3>
              <p>{step.description}</p>
            </li>
          ))}
        </ol>
      </section>

      <section className="section section-surface" aria-labelledby="raffle-trust-title">
        <div className="section-heading">
          <p className="eyebrow">Trust boundary</p>
          <h2 id="raffle-trust-title">Rõ trạng thái trước, giao dịch sau.</h2>
          <p>Phiên bản này không mô phỏng raffle đang mở và không tạo bất kỳ nghĩa vụ mua hàng nào.</p>
        </div>
        <ul className="process-list">
          {content.trustNotes.map((note, index) => (
            <li key={note}>
              <span>{String(index + 1).padStart(2, "0")}</span>
              <h3>{note}</h3>
            </li>
          ))}
        </ul>
      </section>

      <section className="section" aria-labelledby="raffle-next-title">
        <div className="contact-panel">
          <p className="eyebrow">Discovery only</p>
          <h2 id="raffle-next-title">Raffle detail và entry flow sẽ mở ở một slice riêng.</h2>
          <p>Trong lúc chờ release thật, Archive là nơi xem lại các object và dấu mốc đã được trình bày trước đó.</p>
          <div className="actions">
            <Link className="button-link" href="/archive">Xem Archive</Link>
            <Link className="button-link button-secondary" href="/">Về trang chủ</Link>
          </div>
        </div>
      </section>
    </>
  );
}
