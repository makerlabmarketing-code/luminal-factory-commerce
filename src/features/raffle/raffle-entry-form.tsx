"use client";

import Script from "next/script";
import { useCallback, useEffect, useId, useRef, useState, type FormEvent } from "react";
import { submitRaffleEntry, type RaffleEntryClientResponse } from "./raffle-entry-client";

type TurnstileApi = Readonly<{
  render(container: HTMLElement, options: Readonly<Record<string, unknown>>): string;
  remove(widgetId: string): void;
  reset(widgetId: string): void;
}>;

function getTurnstile(): TurnstileApi | undefined {
  return (window as typeof window & { turnstile?: TurnstileApi }).turnstile;
}

function getFailureMessage(response: Extract<RaffleEntryClientResponse, { ok: false }>): string {
  if (response.code === "rate_limited") return "Bạn đã thử quá nhiều lần. Vui lòng đợi một lúc rồi thử lại.";
  if (response.code === "raffle_not_open") return "Raffle này hiện không nhận entry.";
  if (response.code === "ineligible") return "Entry này chưa đáp ứng điều kiện của raffle.";
  if (response.code === "invalid_request") return "Thông tin chưa hợp lệ. Hãy kiểm tra lại và xác minh bảo mật.";
  return "Kênh nhận entry đang tạm thời không khả dụng. Vui lòng thử lại sau.";
}

type RaffleEntryFormProps = Readonly<{
  enabled: boolean;
  raffleId: string;
  rulesVersion: string;
  siteKey: string;
}>;

export function RaffleEntryForm({ enabled, raffleId, rulesVersion, siteKey }: RaffleEntryFormProps) {
  const emailId = useId();
  const nameId = useId();
  const turnstileContainerRef = useRef<HTMLDivElement>(null);
  const turnstileWidgetIdRef = useRef<string | null>(null);
  const requestIdRef = useRef<string | null>(null);
  const [captchaToken, setCaptchaToken] = useState("");
  const [isPending, setIsPending] = useState(false);
  const [isComplete, setIsComplete] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  const renderTurnstile = useCallback(() => {
    const turnstile = getTurnstile();
    const container = turnstileContainerRef.current;
    if (!enabled || !turnstile || !container || turnstileWidgetIdRef.current) return;

    turnstileWidgetIdRef.current = turnstile.render(container, {
      sitekey: siteKey,
      theme: "dark",
      language: "vi",
      size: "flexible",
      action: "raffle_entry",
      callback: (token: string) => {
        setCaptchaToken(token);
        setError("");
      },
      "expired-callback": () => setCaptchaToken(""),
      "timeout-callback": () => setCaptchaToken(""),
      "error-callback": () => {
        setCaptchaToken("");
        setError("Không thể hoàn tất bước bảo mật. Hãy tải lại trang và thử lại.");
        return true;
      },
    });
  }, [enabled, siteKey]);

  useEffect(() => {
    renderTurnstile();
    return () => {
      const turnstile = getTurnstile();
      if (turnstile && turnstileWidgetIdRef.current) {
        turnstile.remove(turnstileWidgetIdRef.current);
        turnstileWidgetIdRef.current = null;
      }
    };
  }, [renderTurnstile]);

  function removeTurnstile() {
    const turnstile = getTurnstile();
    if (turnstile && turnstileWidgetIdRef.current) {
      turnstile.remove(turnstileWidgetIdRef.current);
      turnstileWidgetIdRef.current = null;
    }
    setCaptchaToken("");
  }

  function resetTurnstile() {
    const turnstile = getTurnstile();
    if (turnstile && turnstileWidgetIdRef.current) turnstile.reset(turnstileWidgetIdRef.current);
    setCaptchaToken("");
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!enabled || isPending || isComplete) return;
    if (!captchaToken) {
      setError("Vui lòng hoàn tất bước xác minh bảo mật.");
      return;
    }

    const form = event.currentTarget;
    const formData = new FormData(form);
    const requestId = requestIdRef.current ?? crypto.randomUUID();
    requestIdRef.current = requestId;
    setIsPending(true);
    setError("");
    setMessage("");

    const response = await submitRaffleEntry({
      raffleId,
      requestId,
      email: String(formData.get("email") ?? ""),
      displayName: String(formData.get("displayName") ?? ""),
      rulesVersion,
      rulesAccepted: true,
      captchaToken,
    });
    setIsPending(false);

    if (!response.ok) {
      setError(getFailureMessage(response));
      resetTurnstile();
      return;
    }

    removeTurnstile();
    setIsComplete(true);
    if (response.state === "already_entered") {
      setMessage("Email này đã có một entry cho raffle. Không có entry mới được tạo thêm.");
      return;
    }
    setMessage(`Entry đã được ghi nhận. Mã tham chiếu: ${response.entryReference}`);
    form.reset();
  }

  if (!enabled) {
    return (
      <div className="feedback-state" role="status">
        <p>Entry đang tạm đóng. Trang này chỉ hiển thị thông tin raffle đã được công bố.</p>
      </div>
    );
  }

  return (
    <div className="raffle-entry-panel">
      <Script
        id="cloudflare-turnstile-raffle"
        src="https://challenges.cloudflare.com/turnstile/v0/api.js?render=explicit"
        strategy="afterInteractive"
        onReady={renderTurnstile}
      />
      <div>
        <p className="eyebrow">Guest entry</p>
        <h2>Gửi một entry cho raffle này.</h2>
        <p>Entry không phải order, không tạo nghĩa vụ thanh toán và không đảm bảo quyền mua.</p>
      </div>

      {!isComplete ? (
        <form className="account-form" onSubmit={handleSubmit}>
          <div className="account-field">
            <label htmlFor={nameId}>Tên hiển thị</label>
            <input id={nameId} name="displayName" autoComplete="name" minLength={2} maxLength={120} required />
          </div>
          <div className="account-field">
            <label htmlFor={emailId}>Email</label>
            <input id={emailId} name="email" type="email" inputMode="email" autoComplete="email" maxLength={254} required />
            <span>Chỉ dùng để quản lý entry và liên hệ theo quy định của raffle.</span>
          </div>
          <label className="raffle-entry-consent">
            <input type="checkbox" name="rulesAccepted" required />
            <span>Tôi đồng ý với rules phiên bản {rulesVersion} và xác nhận thông tin trên là chính xác.</span>
          </label>
          <div className="account-turnstile" ref={turnstileContainerRef} aria-label="Xác minh bảo mật" />
          <button className="button-link account-submit" type="submit" disabled={isPending || !captchaToken}>
            {isPending ? "Đang gửi entry…" : "Gửi entry"}
          </button>
        </form>
      ) : null}

      <div className="account-feedback" aria-live="polite" aria-atomic="true">
        {message ? <p className="account-message">{message}</p> : null}
        {error ? <p className="account-error" role="alert">{error}</p> : null}
      </div>
    </div>
  );
}
