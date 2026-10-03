"use client";
import { useTranslator } from "@/lib/i18n/client";


import { useState, type FormEvent } from "react";
import { commissionCategoryLabels, commissionCategories } from "./commission-inquiry-schema";

type SubmitState = "idle" | "submitting" | "success" | "error";

type CommissionInquiryFormProps = Readonly<{
  enabled: boolean;
}>;

const fieldClass =
  "w-full rounded-lg border border-white/10 bg-black/30 px-4 py-3 text-[0.95rem] text-white outline-none transition focus:border-[var(--ice)]";

export function CommissionInquiryForm({ enabled }: CommissionInquiryFormProps) {
  const tr = useTranslator();
  const [submitState, setSubmitState] = useState<SubmitState>("idle");
  const [message, setMessage] = useState("");

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!enabled || submitState === "submitting") return;

    const form = event.currentTarget;
    const data = new FormData(form);

    setSubmitState("submitting");
    setMessage("");

    const payload = {
      requestId: crypto.randomUUID(),
      name: String(data.get("name") ?? ""),
      email: String(data.get("email") ?? ""),
      category: String(data.get("category") ?? ""),
      projectSummary: String(data.get("projectSummary") ?? ""),
      referenceUrl: String(data.get("referenceUrl") ?? ""),
      timingContext: String(data.get("timingContext") ?? ""),
      budgetContext: String(data.get("budgetContext") ?? ""),
      privacyAccepted: data.get("privacyAccepted") === "on",
      website: String(data.get("website") ?? ""),
    };

    try {
      const response = await fetch("/api/commission-inquiry", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const result = (await response.json().catch(() => null)) as { code?: string } | null;

      if (!response.ok) {
        if (result?.code === "transport_unavailable") {
          setMessage("Inquiry đang tạm đóng vì kênh gửi chưa được cấu hình. Vui lòng thử lại sau.");
        } else if (result?.code === "invalid_input") {
          setMessage("Một số thông tin chưa hợp lệ. Hãy kiểm tra lại các trường và thử lại.");
        } else {
          setMessage("Không thể gửi inquiry lúc này. Hãy thử lại sau.");
        }
        setSubmitState("error");
        return;
      }

      form.reset();
      setSubmitState("success");
      setMessage("Luminal đã nhận inquiry để studio review. Đây chưa phải xác nhận nhận commission, báo giá hay production slot.");
    } catch {
      setSubmitState("error");
      setMessage("Không thể kết nối tới kênh gửi inquiry. Hãy thử lại sau.");
    }
  }

  return (
    <section className="section" aria-labelledby="commission-inquiry-title">
      <div className="contact-panel">
        <p className="eyebrow">{tr("Commission inquiry")}</p>
        <h2 id="commission-inquiry-title">
          {enabled ? tr("Gửi context để studio review.") : tr("Inquiry đang chờ cấu hình kênh gửi.")}
        </h2>
        <p>
          {tr("Việc gửi form chỉ tạo một inquiry để Luminal xem xét. Nó không tạo order, quote, invoice, payment obligation hay giữ production slot.")}</p>

        {!enabled ? (
          <div className="feedback-state" role="status">
            <p>{tr("Form chưa nhận submission thật cho tới khi email transport của production được cấu hình.")}</p>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="mt-8 grid w-full max-w-3xl gap-5" noValidate={false}>
            <div className="grid gap-2">
              <label htmlFor="commission-name">{tr("Tên *")}</label>
              <input className={fieldClass} id="commission-name" name="name" autoComplete="name" minLength={2} maxLength={120} required />
            </div>

            <div className="grid gap-2">
              <label htmlFor="commission-email">{tr("Email *")}</label>
              <input className={fieldClass} id="commission-email" name="email" type="email" autoComplete="email" maxLength={254} required />
            </div>

            <div className="grid gap-2">
              <label htmlFor="commission-category">{tr("Loại commission *")}</label>
              <select className={fieldClass} id="commission-category" name="category" defaultValue="" required>
                <option value="" disabled>{tr("Chọn một hướng")}</option>
                {commissionCategories.map((category) => (
                  <option key={category} value={category}>{commissionCategoryLabels[category]}</option>
                ))}
              </select>
            </div>

            <div className="grid gap-2">
              <label htmlFor="commission-summary">{tr("Project summary *")}</label>
              <textarea
                className={`${fieldClass} min-h-40 resize-y`}
                id="commission-summary"
                name="projectSummary"
                minLength={40}
                maxLength={2500}
                required
                aria-describedby="commission-summary-help"
              />
              <p id="commission-summary-help" className="text-sm text-[var(--muted-foreground)]">
                {tr("Mô tả object, mục đích, concept và những ràng buộc quan trọng. Tối thiểu 40 ký tự.")}</p>
            </div>

            <div className="grid gap-2">
              <label htmlFor="commission-reference">{tr("Reference URL")}</label>
              <input className={fieldClass} id="commission-reference" name="referenceUrl" type="url" maxLength={500} placeholder={tr("https://")} />
            </div>

            <div className="grid gap-2 md:grid-cols-2">
              <div className="grid gap-2">
                <label htmlFor="commission-timing">{tr("Timing context")}</label>
                <textarea className={`${fieldClass} min-h-28 resize-y`} id="commission-timing" name="timingContext" maxLength={500} />
              </div>
              <div className="grid gap-2">
                <label htmlFor="commission-budget">{tr("Budget context")}</label>
                <textarea className={`${fieldClass} min-h-28 resize-y`} id="commission-budget" name="budgetContext" maxLength={500} />
              </div>
            </div>

            <div className="sr-only" aria-hidden="true">
              <label htmlFor="commission-website">{tr("Website")}</label>
              <input id="commission-website" name="website" tabIndex={-1} autoComplete="off" />
            </div>

            <label className="flex items-start gap-3 text-sm leading-6 text-[var(--muted-foreground)]">
              <input className="mt-1" type="checkbox" name="privacyAccepted" required />
              <span>{tr("Tôi đồng ý gửi các thông tin trên cho Luminal Factory để review yêu cầu commission và liên hệ lại về inquiry này. *")}</span>
            </label>

            <div className="actions mt-1">
              <button className="button-link" type="submit" disabled={submitState === "submitting"}>
                {submitState === "submitting" ? tr("Đang gửi…") : tr("Gửi inquiry")}
              </button>
            </div>

            {message ? (
              <p role="status" aria-live="polite" className={submitState === "success" ? "text-sm text-[var(--ice)]" : "text-sm text-[var(--rose)]"}>
                {tr(message)}
              </p>
            ) : null}
          </form>
        )}
      </div>
    </section>
  );
}
