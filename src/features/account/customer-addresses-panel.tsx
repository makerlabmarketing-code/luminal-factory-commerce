"use client";
import { useCallback, useEffect, useState, type FormEvent } from "react";
import type { CustomerAddress, CustomerAddressInput } from "@/features/account/customer-address-contract";

type AddressForm = Required<CustomerAddressInput>;
const MAX_SAVED_ADDRESSES = 10;
const emptyAddress: AddressForm = {
  label: "",
  recipient_name: "",
  phone: "",
  country_code: "VN",
  administrative_area: "",
  locality: "",
  address_line1: "",
  address_line2: "",
  postal_code: "",
  is_default: false,
};
const fields = [
  ["label", "Tên gợi nhớ", 40],
  ["recipient_name", "Người nhận", 120],
  ["phone", "Số điện thoại", 32],
  ["administrative_area", "Tỉnh / thành phố", 120],
  ["locality", "Phường / xã / địa phương", 120],
  ["address_line1", "Địa chỉ chi tiết", 200],
  ["address_line2", "Thông tin bổ sung", 200],
  ["postal_code", "Mã bưu chính", 32],
  ["country_code", "Mã quốc gia (ISO)", 2],
] as const;

export function CustomerAddressesPanel() {
  const [addresses, setAddresses] = useState<CustomerAddress[]>([]);
  const [form, setForm] = useState<AddressForm>(emptyAddress);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");

  const load = useCallback(async () => {
    const response = await fetch("/api/account/addresses", { cache: "no-store" });
    if (!response.ok) throw new Error("Không thể tải địa chỉ.");
    const result: { ok: boolean; addresses?: CustomerAddress[] } = await response.json();
    if (!result.ok || !Array.isArray(result.addresses)) throw new Error("Không thể tải địa chỉ.");
    setAddresses(result.addresses);
  }, []);

  useEffect(() => {
    void load().catch(() => setError("Không thể tải địa chỉ. Vui lòng thử lại."));
  }, [load]);

  async function mutate(payload: unknown, successMessage = "Đã cập nhật địa chỉ.") {
    setBusy(true);
    setError("");
    setMessage("");
    try {
      const response = await fetch("/api/account/addresses", {
        method: "POST",
        headers: { "Content-Type": "application/json", "x-luminal-address-request": "1" },
        body: JSON.stringify(payload),
      });
      if (!response.ok) throw new Error("Không thể lưu thay đổi. Vui lòng kiểm tra thông tin hoặc thử lại.");
      await load();
      setIsEditing(false);
      setEditingId(null);
      setForm(emptyAddress);
      setMessage(successMessage);
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Dịch vụ tạm thời không khả dụng.");
    } finally {
      setBusy(false);
    }
  }

  function edit(address?: CustomerAddress) {
    if (!address && addresses.length >= MAX_SAVED_ADDRESSES) {
      setError(`Bạn chỉ có thể lưu tối đa ${MAX_SAVED_ADDRESSES} địa chỉ.`);
      return;
    }
    setEditingId(address?.id ?? null);
    setForm(
      address
        ? {
            label: address.label,
            recipient_name: address.recipient_name,
            phone: address.phone,
            country_code: address.country_code,
            administrative_area: address.administrative_area,
            locality: address.locality,
            address_line1: address.address_line1,
            address_line2: address.address_line2 ?? "",
            postal_code: address.postal_code ?? "",
            is_default: address.is_default,
          }
        : emptyAddress,
    );
    setIsEditing(true);
    setError("");
    setMessage("");
  }

  function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    void mutate(editingId ? { action: "update", id: editingId, address: form } : { action: "create", address: form });
  }

  return (
    <section className="mt-8 rounded-3xl border border-white/10 bg-white/[0.03] p-5 md:p-8" aria-labelledby="saved-addresses-title">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <p className="eyebrow">Private account</p>
          <h2 id="saved-addresses-title" className="mt-3 text-2xl">Địa chỉ đã lưu</h2>
          <p className="mt-2 text-sm text-white/50">Chỉ bạn mới có thể quản lý địa chỉ của mình. Tối đa {MAX_SAVED_ADDRESSES} địa chỉ.</p>
        </div>
        {!isEditing && (
          <button type="button" className="button-link" onClick={() => edit()} disabled={busy || addresses.length >= MAX_SAVED_ADDRESSES}>
            Thêm địa chỉ
          </button>
        )}
      </div>

      <div className="mt-6 grid gap-3">
        {!isEditing && addresses.length === 0 && <p className="text-white/50">Bạn chưa lưu địa chỉ nào.</p>}
        {!isEditing && addresses.map((address) => (
          <article key={address.id} className="rounded-2xl border border-white/10 p-5">
            <div className="flex flex-wrap items-center gap-3">
              <h3 className="font-medium">{address.label}</h3>
              {address.is_default && <span className="rounded-full border border-white/20 px-2 py-1 text-xs">Mặc định</span>}
            </div>
            <p className="mt-3 text-sm">{address.recipient_name} · {address.phone}</p>
            <p className="mt-2 text-sm leading-6 text-white/60">
              {[address.address_line1, address.address_line2, address.locality, address.administrative_area, address.postal_code, address.country_code].filter(Boolean).join(", ")}
            </p>
            <div className="mt-4 flex flex-wrap gap-4">
              {!address.is_default && (
                <button type="button" className="account-text-button" disabled={busy} onClick={() => void mutate({ action: "set_default", id: address.id }, "Đã đặt địa chỉ mặc định.")}>
                  Đặt mặc định
                </button>
              )}
              <button type="button" className="account-text-button" disabled={busy} onClick={() => edit(address)}>Chỉnh sửa</button>
              <button type="button" className="account-text-button" disabled={busy} onClick={() => { if (window.confirm("Xóa địa chỉ này?")) void mutate({ action: "delete", id: address.id }, "Đã xóa địa chỉ."); }}>Xóa</button>
            </div>
          </article>
        ))}
      </div>

      {isEditing && (
        <form className="mt-6 grid gap-4 md:grid-cols-2" onSubmit={submit}>
          {fields.map(([name, label, max]) => (
            <label key={name} className="account-field">
              <span>{label}</span>
              <input
                name={name}
                value={form[name]}
                maxLength={max}
                required={name !== "address_line2" && name !== "postal_code"}
                onChange={(event) => setForm((current) => ({ ...current, [name]: event.target.value }))}
                autoComplete="off"
              />
            </label>
          ))}
          <label className="md:col-span-2 flex items-center gap-3 text-sm text-white/70">
            <input type="checkbox" checked={form.is_default} onChange={(event) => setForm((current) => ({ ...current, is_default: event.target.checked }))} />
            Dùng làm địa chỉ mặc định
          </label>
          <div className="md:col-span-2 flex flex-wrap gap-3">
            <button className="button-link" type="submit" disabled={busy}>{busy ? "Đang lưu…" : "Lưu địa chỉ"}</button>
            <button className="account-text-button" type="button" disabled={busy} onClick={() => setIsEditing(false)}>Hủy</button>
          </div>
        </form>
      )}

      <div className="mt-4" aria-live="polite">
        {error && <p className="text-sm text-red-300" role="alert">{error}</p>}
        {message && <p className="text-sm text-white/60" role="status">{message}</p>}
      </div>
    </section>
  );
}
