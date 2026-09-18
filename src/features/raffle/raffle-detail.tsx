import Link from "next/link";
import type { PublicRaffleDetail } from "./raffle-detail-service";
import { RaffleEntryForm } from "./raffle-entry-form";

const statusLabels: Record<PublicRaffleDetail["status"], string> = {
  DRAFT: "Draft",
  SCHEDULED: "Sắp mở",
  OPEN: "Đang mở",
  CLOSED: "Đã đóng",
  DRAWING: "Đang xử lý kết quả",
  DRAWN: "Đã có kết quả",
  PAYMENT_PENDING: "Đang chờ winner payment",
  FULFILLING: "Đang hoàn thiện",
  COMPLETED: "Đã hoàn tất",
  CANCELLED: "Đã huỷ",
};

function formatTime(value: string | null, timeZone: string): string {
  if (!value) return "Chưa công bố";
  return new Intl.DateTimeFormat("vi-VN", {
    dateStyle: "long",
    timeStyle: "short",
    timeZone,
  }).format(new Date(value));
}
type RaffleDetailViewProps = Readonly<{
  raffle: PublicRaffleDetail;
  entryEnabled: boolean;
  turnstileSiteKey: string;
}>;

export function RaffleDetailView({ raffle, entryEnabled, turnstileSiteKey }: RaffleDetailViewProps) {
  const canPresentEntry = raffle.status === "OPEN";

  return (
    <>
      <section className="section" aria-labelledby="raffle-detail-title">
        <div className="section-heading">
          <p className="eyebrow">Luminal raffle · {statusLabels[raffle.status]}</p>
          <div>
            <h1 id="raffle-detail-title">{raffle.title}</h1>
            {raffle.summary ? <p className="lede">{raffle.summary}</p> : null}
          </div>
          <Link className="button-link button-secondary" href="/raffle">Tất cả raffle</Link>
        </div>
      </section>

      <section className="section section-surface" aria-labelledby="raffle-timing-title">
        <div className="section-heading">
          <p className="eyebrow">Authoritative timing</p>
          <h2 id="raffle-timing-title">Trạng thái và thời gian raffle</h2>
          <p>Máy chủ và database quyết định entry có hợp lệ hay không; đồng hồ trên trình duyệt chỉ để hiển thị.</p>
        </div>
        <dl className="raffle-detail-facts">
          <div><dt>Trạng thái</dt><dd>{statusLabels[raffle.status]}</dd></div>
          <div><dt>Mở</dt><dd>{formatTime(raffle.opensAt, raffle.presentationTimeZone)}</dd></div>
          <div><dt>Đóng</dt><dd>{formatTime(raffle.closesAt, raffle.presentationTimeZone)}</dd></div>
          <div><dt>Múi giờ</dt><dd>{raffle.presentationTimeZone}</dd></div>
        </dl>
      </section>

      <section className="section" aria-labelledby="raffle-rules-title">
        <div className="contact-panel">
          <p className="eyebrow">Rules · {raffle.rulesVersion}</p>
          <h2 id="raffle-rules-title">Một entry hợp lệ cho mỗi email.</h2>
          <p>{raffle.rulesSummary ?? "Rules chi tiết đang được chuẩn bị cho release này."}</p>
          <p>Winner selection, payment và order là các bước tách biệt, không diễn ra khi gửi entry.</p>
        </div>
      </section>

      <section className="section" aria-label="Raffle entry">
        {canPresentEntry ? (
          <RaffleEntryForm
            enabled={entryEnabled}
            raffleId={raffle.id}
            rulesVersion={raffle.rulesVersion}
            siteKey={turnstileSiteKey}
          />
        ) : (
          <div className="feedback-state" role="status">
            <p>Raffle hiện không ở trạng thái nhận entry.</p>
          </div>
        )}
      </section>
    </>
  );
}
