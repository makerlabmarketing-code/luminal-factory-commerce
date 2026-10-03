import { localizePresentation } from "@/lib/i18n/presentation";

import { getTranslator, getLocale } from "@/lib/i18n/server";
import Link from "@/lib/i18n/link";
import type { RafflePresentation } from "./raffle-content";

type RaffleDiscoveryProps = Readonly<{
  content: RafflePresentation;
}>;

export async function RaffleDiscovery({ content: originalContent }: RaffleDiscoveryProps) {
  const tr = await getTranslator();
  const content = localizePresentation(originalContent, await getLocale());
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

      <section className="section" aria-labelledby="raffle-how-title">
        <div className="section-heading">
          <p className="eyebrow">{tr("How raffle works")}</p>
          <h2 id="raffle-how-title">{tr("Một entry và một order là hai việc khác nhau.")}</h2>
          <p>{tr("Đây là mô hình khái niệm. Chi tiết eligibility, duplicate rules, winner selection và payment deadline chưa được công bố trong slice này.")}</p>
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
          <p className="eyebrow">{tr("Trust boundary")}</p>
          <h2 id="raffle-trust-title">{tr("Rõ trạng thái trước, giao dịch sau.")}</h2>
          <p>{tr("Phiên bản này không mô phỏng raffle đang mở và không tạo bất kỳ nghĩa vụ mua hàng nào.")}</p>
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
          <p className="eyebrow">{tr("Discovery only")}</p>
          <h2 id="raffle-next-title">{tr("Raffle detail và entry flow sẽ mở ở một slice riêng.")}</h2>
          <p>{tr("Trong lúc chờ release thật, Archive là nơi xem lại các object và dấu mốc đã được trình bày trước đó.")}</p>
          <div className="actions">
            <Link className="button-link" href="/archive">{tr("Xem Archive")}</Link>
            <Link className="button-link button-secondary" href="/">{tr("Về trang chủ")}</Link>
          </div>
        </div>
      </section>
    </>
  );
}
