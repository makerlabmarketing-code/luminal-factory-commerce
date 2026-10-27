"use client";

import { useEffect, useState } from "react";

export function RaffleCountdownDemo({ locale }: Readonly<{ locale: "vi" | "en" }>) {
  const [remaining, setRemaining] = useState(6 * 60 * 60);

  useEffect(() => {
    const end = Date.now() + 6 * 60 * 60 * 1000;
    const tick = () => setRemaining(Math.max(0, Math.ceil((end - Date.now()) / 1000)));
    const timer = window.setInterval(tick, 1000);
    return () => window.clearInterval(timer);
  }, []);

  const hours = String(Math.floor(remaining / 3600)).padStart(2, "0");
  const minutes = String(Math.floor((remaining % 3600) / 60)).padStart(2, "0");
  const seconds = String(remaining % 60).padStart(2, "0");

  return (
    <div className="raffle-demo" aria-label={locale === "vi" ? "Đồng hồ minh họa, không phải đợt raffle thật" : "Illustrative countdown, not a live raffle"}>
      <p>{locale === "vi" ? "BẢN XEM THỬ · KHÔNG MỞ ĐĂNG KÝ" : "PREVIEW · ENTRIES ARE NOT OPEN"}</p>
      <div className="raffle-demo-time" role="timer" aria-live="off"><span>{hours}<small>HRS</small></span><b>:</b><span>{minutes}<small>MIN</small></span><b>:</b><span>{seconds}<small>SEC</small></span></div>
      <p>{locale === "vi" ? "Đồng hồ mẫu bắt đầu lại khi tải trang. Các đợt thật và thời gian chính thức được công bố bên dưới." : "Sample timer restarts on each visit. Official release windows appear below when published."}</p>
    </div>
  );
}
