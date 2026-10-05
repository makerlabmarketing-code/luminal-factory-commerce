
import { getTranslator, getLocale } from "@/lib/i18n/server";
import Link from "@/lib/i18n/link";
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

function formatTime(value: string | null, timeZone: string, locale: string): string {
  if (!value) return "Chưa công bố";
  return new Intl.DateTimeFormat(locale === "vi" ? "vi-VN" : "en-US", {
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

export async function RaffleDetailView({ raffle, entryEnabled, turnstileSiteKey }: RaffleDetailViewProps) {
  const tr = await getTranslator();
  const locale = await getLocale();
  const canPresentEntry = raffle.status === "OPEN";

  return (
    <>
      <section className="section" aria-labelledby="raffle-detail-title">
        <div className="section-heading">
          <p className="eyebrow">{tr("Luminal raffle ·")}{" "}{tr(statusLabels[raffle.status])}</p>
          <div>
            <h1 id="raffle-detail-title">{raffle.title}</h1>
            {raffle.summary ? <p className="lede">{raffle.summary}</p> : null}
          </div>
          <Link className="button-link button-secondary" href="/raffle">{tr("Tất cả raffle")}</Link>
        </div>
      </section>

      <section className="section section-surface" aria-labelledby="raffle-timing-title">
        <div className="section-heading">
          <p className="eyebrow">{tr("Authoritative timing")}</p>
          <h2 id="raffle-timing-title">{tr("Trạng thái và thời gian raffle")}</h2>
          <p>{tr("Máy chủ và database quyết định entry có hợp lệ hay không; đồng hồ trên trình duyệt chỉ để hiển thị.")}</p>
        </div>
        <dl className="raffle-detail-facts">
          <div><dt>{tr("Trạng thái")}</dt><dd>{tr(statusLabels[raffle.status])}</dd></div>
          <div><dt>{tr("Mở")}</dt><dd>{tr(formatTime(raffle.opensAt, raffle.presentationTimeZone, locale))}</dd></div>
          <div><dt>{tr("Đóng")}</dt><dd>{tr(formatTime(raffle.closesAt, raffle.presentationTimeZone, locale))}</dd></div>
          <div><dt>{tr("Múi giờ")}</dt><dd>{raffle.presentationTimeZone}</dd></div>
        </dl>
      </section>

      <section className="section" aria-labelledby="raffle-rules-title">
        <div className="contact-panel">
          <p className="eyebrow">{tr("Rules ·")}{" "}{raffle.rulesVersion}</p>
          <h2 id="raffle-rules-title">{tr("Một entry hợp lệ cho mỗi email.")}</h2>
          <p>{raffle.rulesSummary ?? tr("Rules chi tiết đang được chuẩn bị cho release này.")}</p>
          <p>{tr("Winner selection, payment và order là các bước tách biệt, không diễn ra khi gửi entry.")}</p>
        </div>
      </section>

      <section className="section" aria-label={tr("Raffle entry")}>
        {canPresentEntry ? (
          <RaffleEntryForm
            enabled={entryEnabled}
            raffleId={raffle.id}
            rulesVersion={raffle.rulesVersion}
            siteKey={turnstileSiteKey}
          />
        ) : (
          <div className="feedback-state" role="status">
            <p>{tr("Raffle hiện không ở trạng thái nhận entry.")}</p>
          </div>
        )}
      </section>
    </>
  );
}
