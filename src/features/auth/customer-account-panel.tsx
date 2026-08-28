"use client";

import Script from "next/script";
import { useRouter } from "next/navigation";
import { useCallback, useEffect, useId, useRef, useState, type FormEvent } from "react";
import {
  submitCustomerAuthRequest,
  type CustomerAuthClientResponse,
} from "@/features/auth/customer-auth-client";

type TurnstileApi = Readonly<{
  render(container: HTMLElement, options: Readonly<Record<string, unknown>>): string;
  remove(widgetId: string): void;
  reset(widgetId: string): void;
}>;

function getTurnstile(): TurnstileApi | undefined {
  return (window as typeof window & { turnstile?: TurnstileApi }).turnstile;
}

function getFailureMessage(response: Extract<CustomerAuthClientResponse, { ok: false }>): string {
  if (response.code === "invalid_or_expired_otp") {
    return "Mã xác thực không đúng hoặc đã hết hạn. Hãy kiểm tra email và thử lại.";
  }
  if (response.code === "rate_limited") {
    return "Bạn đã thử quá nhiều lần. Vui lòng đợi một lúc trước khi tiếp tục.";
  }
  if (response.code === "invalid_request") {
    return "Yêu cầu chưa hợp lệ. Hãy kiểm tra thông tin và thử lại.";
  }
  return "Dịch vụ đăng nhập đang tạm thời không khả dụng. Vui lòng thử lại sau.";
}

type CustomerAccountPanelProps = Readonly<{
  siteKey: string;
  initialEmail: string | null;
}>;

export function CustomerAccountPanel({ siteKey, initialEmail }: CustomerAccountPanelProps) {
  const router = useRouter();
  const emailId = useId();
  const otpId = useId();
  const otpInputRef = useRef<HTMLInputElement>(null);
  const turnstileContainerRef = useRef<HTMLDivElement>(null);
  const turnstileWidgetIdRef = useRef<string | null>(null);
  const [stage, setStage] = useState<"email" | "otp" | "authenticated">(
    initialEmail ? "authenticated" : "email",
  );
  const [email, setEmail] = useState(initialEmail ?? "");
  const [otp, setOtp] = useState("");
  const [captchaToken, setCaptchaToken] = useState("");
  const [isPending, setIsPending] = useState(false);
  const [message, setMessage] = useState(initialEmail ? "Phiên đăng nhập đang hoạt động." : "");
  const [error, setError] = useState("");

  const renderTurnstile = useCallback(() => {
    const turnstile = getTurnstile();
    const container = turnstileContainerRef.current;
    if (!turnstile || !container || stage !== "email" || turnstileWidgetIdRef.current) return;

    turnstileWidgetIdRef.current = turnstile.render(container, {
      sitekey: siteKey,
      theme: "dark",
      language: "vi",
      size: "flexible",
      action: "request_otp",
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
  }, [siteKey, stage]);

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

  useEffect(() => {
    if (stage === "otp") otpInputRef.current?.focus();
  }, [stage]);

  function resetTurnstile() {
    const turnstile = getTurnstile();
    if (turnstile && turnstileWidgetIdRef.current) turnstile.reset(turnstileWidgetIdRef.current);
    setCaptchaToken("");
  }

  async function handleRequestOtp(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!captchaToken) {
      setError("Vui lòng hoàn tất bước xác minh bảo mật.");
      return;
    }

    setIsPending(true);
    setError("");
    setMessage("");
    const response = await submitCustomerAuthRequest({ action: "request_otp", email, captchaToken });
    setIsPending(false);
    if (!response.ok) {
      setError(getFailureMessage(response));
      resetTurnstile();
      return;
    }

    setStage("otp");
    setMessage("Mã đăng nhập gồm 6 chữ số đã được gửi tới email của bạn.");
  }

  async function handleVerifyOtp(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setIsPending(true);
    setError("");
    const response = await submitCustomerAuthRequest({ action: "verify_otp", email, token: otp });
    setIsPending(false);
    if (!response.ok) {
      setError(getFailureMessage(response));
      return;
    }

    setStage("authenticated");
    setOtp("");
    setMessage("Đăng nhập thành công.");
    router.refresh();
  }

  async function handleSignOut() {
    setIsPending(true);
    setError("");
    const response = await submitCustomerAuthRequest({ action: "sign_out" });
    setIsPending(false);
    if (!response.ok) {
      setError(getFailureMessage(response));
      return;
    }

    setStage("email");
    setEmail("");
    setMessage("Bạn đã đăng xuất an toàn.");
    router.refresh();
  }

  function changeEmail() {
    setStage("email");
    setOtp("");
    setError("");
    setMessage("");
  }

  return (
    <section className="account-panel" aria-labelledby="account-panel-title">
      <Script
        id="cloudflare-turnstile"
        src="https://challenges.cloudflare.com/turnstile/v0/api.js?render=explicit"
        strategy="afterInteractive"
        onReady={renderTurnstile}
      />

      <div className="account-panel-heading">
        <p className="eyebrow">Secure customer access</p>
        <h2 id="account-panel-title">
          {stage === "authenticated" ? "Phiên của bạn đã sẵn sàng." : "Đăng nhập không cần mật khẩu."}
        </h2>
        <p>
          {stage === "authenticated"
            ? "Account hiện chỉ xác nhận danh tính. Đơn hàng, địa chỉ đã lưu và cart merge chưa được mở trong slice này."
            : "Nhận mã dùng một lần qua email. Luminal Factory không yêu cầu bạn tạo hoặc ghi nhớ mật khẩu."}
        </p>
      </div>

      {stage === "email" ? (
        <form className="account-form" onSubmit={handleRequestOtp}>
          <div className="account-field">
            <label htmlFor={emailId}>Email</label>
            <input
              id={emailId}
              type="email"
              inputMode="email"
              autoComplete="email"
              maxLength={254}
              required
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              aria-describedby={`${emailId}-hint`}
            />
            <span id={`${emailId}-hint`}>Chúng tôi sẽ gửi một mã gồm 6 chữ số tới địa chỉ này.</span>
          </div>
          <div className="account-turnstile" ref={turnstileContainerRef} aria-label="Xác minh bảo mật" />
          <button className="button-link account-submit" type="submit" disabled={isPending || !captchaToken}>
            {isPending ? "Đang gửi mã…" : "Gửi mã đăng nhập"}
          </button>
        </form>
      ) : null}

      {stage === "otp" ? (
        <form className="account-form" onSubmit={handleVerifyOtp}>
          <div className="account-field">
            <label htmlFor={otpId}>Mã đăng nhập</label>
            <input
              ref={otpInputRef}
              id={otpId}
              type="text"
              inputMode="numeric"
              autoComplete="one-time-code"
              pattern="[0-9]{6}"
              minLength={6}
              maxLength={6}
              required
              value={otp}
              onChange={(event) => setOtp(event.target.value.replace(/\D/g, "").slice(0, 6))}
              aria-describedby={`${otpId}-hint`}
            />
            <span id={`${otpId}-hint`}>Mã được gửi tới {email}. Mã chỉ có hiệu lực trong thời gian giới hạn.</span>
          </div>
          <div className="account-form-actions">
            <button className="button-link account-submit" type="submit" disabled={isPending || otp.length !== 6}>
              {isPending ? "Đang xác thực…" : "Xác thực mã"}
            </button>
            <button className="account-text-button" type="button" onClick={changeEmail} disabled={isPending}>
              Dùng email khác
            </button>
          </div>
        </form>
      ) : null}

      {stage === "authenticated" ? (
        <div className="account-session">
          <dl>
            <div><dt>Trạng thái</dt><dd>Đã xác thực</dd></div>
            <div><dt>Email</dt><dd>{email}</dd></div>
          </dl>
          <button className="button-link button-secondary account-submit" type="button" onClick={handleSignOut} disabled={isPending}>
            {isPending ? "Đang đăng xuất…" : "Đăng xuất"}
          </button>
        </div>
      ) : null}

      <div className="account-feedback" aria-live="polite" aria-atomic="true">
        {message ? <p className="account-message">{message}</p> : null}
        {error ? <p className="account-error" role="alert">{error}</p> : null}
      </div>
    </section>
  );
}
