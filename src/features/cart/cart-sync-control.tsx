"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";

const CART_REQUEST_HEADER = "x-luminal-cart-request";
const CART_REQUEST_HEADER_VALUE = "1";

type SyncState = "idle" | "syncing" | "error";

export function CartSyncControl() {
  const router = useRouter();
  const [state, setState] = useState<SyncState>("idle");
  const [message, setMessage] = useState("");
  const [isRefreshing, startRefresh] = useTransition();
  const isBusy = state === "syncing" || isRefreshing;

  async function retryMerge() {
    setState("syncing");
    setMessage("Đang đồng bộ lựa chọn vào tài khoản…");
    try {
      const response = await fetch("/api/cart", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          [CART_REQUEST_HEADER]: CART_REQUEST_HEADER_VALUE,
        },
        body: JSON.stringify({ action: "merge_guest" }),
        cache: "no-store",
      });
      if (!response.ok) {
        setState("error");
        setMessage(response.status === 429
          ? "Bạn thao tác hơi nhanh. Hãy thử lại sau một lát."
          : "Chưa thể đồng bộ giỏ hàng. Lựa chọn cũ vẫn được giữ an toàn.");
        return;
      }

      setState("idle");
      setMessage("Đã đồng bộ. Đang tải lại giỏ hàng…");
      startRefresh(() => router.refresh());
    } catch {
      setState("error");
      setMessage("Kết nối bị gián đoạn. Lựa chọn cũ vẫn được giữ an toàn.");
    }
  }

  return (
    <div className="cart-sync-control">
      <button type="button" disabled={isBusy} onClick={() => void retryMerge()}>
        {isBusy ? "Đang đồng bộ" : "Đồng bộ giỏ hàng"}
      </button>
      <p className={state === "error" ? "cart-line-status-error" : ""} aria-live="polite">
        {message}
      </p>
    </div>
  );
}
