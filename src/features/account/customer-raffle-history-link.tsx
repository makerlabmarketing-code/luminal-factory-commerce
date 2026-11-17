"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

/** Links only entries owned by the session's verified email. */
export function CustomerRaffleHistoryLink() {
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState("");

  async function linkHistory() {
    if (busy) return;
    setBusy(true);
    setMessage("");
    try {
      const response = await fetch("/api/account/raffle-history/link", {
        method: "POST",
        headers: { "x-luminal-history-link": "1" },
        credentials: "same-origin",
        cache: "no-store",
      });
      const payload: unknown = await response.json();
      if (!response.ok || !payload || typeof payload !== "object" ||
        !("ok" in payload) || payload.ok !== true) {
        setMessage("Could not sync your entries. Please try again later.");
        return;
      }
      setMessage("Your raffle entries are linked to this account.");
      router.refresh();
    } catch {
      setMessage("Could not sync your entries. Please try again later.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="account-form-actions">
      <button className="button-link button-secondary" type="button"
        disabled={busy} onClick={linkHistory}>
        {busy ? "Syncing entries…" : "Sync my raffle entries"}
      </button>
      <p role="status" aria-live="polite">{message}</p>
    </div>
  );
}
