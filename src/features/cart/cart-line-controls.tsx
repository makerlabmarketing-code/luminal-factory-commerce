"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";

// Keep the browser request marker literal aligned with the server-only request contract
// without importing its Node crypto/network dependencies into the client bundle.
const GUEST_CART_REQUEST_HEADER = "x-luminal-cart-request";
const GUEST_CART_REQUEST_HEADER_VALUE = "1";

type CartLineControlsProps = Readonly<{
  productId: string;
  variantId: string | null;
  productName: string;
  requestedQuantity: number;
}>;

type RequestState = "idle" | "saving" | "removing" | "error";

function mutationMessage(status: number): string {
  if (status === 409) return "Object này không còn khả dụng. Hãy tải lại giỏ hàng.";
  if (status === 429) return "Bạn thao tác hơi nhanh. Hãy thử lại sau một lát.";
  return "Chưa thể cập nhật giỏ hàng. Hãy thử lại.";
}

export function CartLineControls({ productId, variantId, productName, requestedQuantity }: CartLineControlsProps) {
  const router = useRouter();
  const [quantity, setQuantity] = useState(requestedQuantity);
  const [requestState, setRequestState] = useState<RequestState>("idle");
  const [message, setMessage] = useState("");
  const [isRefreshing, startRefresh] = useTransition();
  const isBusy = requestState === "saving" || requestState === "removing" || isRefreshing;

  async function mutateCart(body: Readonly<Record<string, unknown>>, activeState: "saving" | "removing") {
    setRequestState(activeState);
    setMessage(activeState === "saving" ? "Đang cập nhật số lượng…" : "Đang xóa object…");
    try {
      const response = await fetch("/api/cart", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          [GUEST_CART_REQUEST_HEADER]: GUEST_CART_REQUEST_HEADER_VALUE,
        },
        body: JSON.stringify(body),
        cache: "no-store",
      });
      if (!response.ok) {
        setRequestState("error");
        setMessage(mutationMessage(response.status));
        return;
      }

      setRequestState("idle");
      setMessage(activeState === "saving" ? "Đã cập nhật số lượng." : "Đã xóa object khỏi giỏ hàng.");
      startRefresh(() => router.refresh());
    } catch {
      setRequestState("error");
      setMessage("Kết nối bị gián đoạn. Hãy thử lại.");
    }
  }

  return (
    <div className="cart-line-controls">
      <div className="cart-quantity-field">
        <label htmlFor={`quantity-${productId}-${variantId ?? "base"}`}>Số lượng</label>
        <div>
          <input
            id={`quantity-${productId}-${variantId ?? "base"}`}
            type="number"
            inputMode="numeric"
            min={1}
            max={99}
            step={1}
            value={quantity}
            disabled={isBusy}
            aria-describedby={`cart-status-${productId}-${variantId ?? "base"}`}
            onChange={(event) => setQuantity(Math.min(99, Math.max(1, Number.parseInt(event.target.value, 10) || 1)))}
          />
          <button
            type="button"
            disabled={isBusy || quantity === requestedQuantity}
            onClick={() => void mutateCart({ action: "set_line", productId, variantId, requestedQuantity: quantity }, "saving")}
          >
            {requestState === "saving" ? "Đang lưu" : "Cập nhật"}
          </button>
        </div>
      </div>
      <button
        className="cart-remove-button"
        type="button"
        disabled={isBusy}
        aria-label={`Xóa ${productName} khỏi giỏ hàng`}
        onClick={() => void mutateCart({ action: "remove_line", productId, variantId }, "removing")}
      >
        {requestState === "removing" ? "Đang xóa" : "Xóa khỏi giỏ"}
      </button>
      <p
        id={`cart-status-${productId}-${variantId ?? "base"}`}
        className={requestState === "error" ? "cart-line-status cart-line-status-error" : "cart-line-status"}
        aria-live="polite"
      >
        {message}
      </p>
    </div>
  );
}
