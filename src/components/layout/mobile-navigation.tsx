"use client";
import { useTranslator } from "@/lib/i18n/client";

import Link from "@/lib/i18n/link";
import { useState } from "react";
import { navigation } from "./navigation";

export function MobileNavigation() {
  const tr = useTranslator();
  const [isOpen, setIsOpen] = useState(false);
  return (
    <div className="mobile-nav">
      <button type="button" aria-expanded={isOpen} aria-controls="mobile-menu" onClick={() => setIsOpen((value) => !value)}><span>{isOpen ? tr("Đóng") : tr("Menu")}</span><span aria-hidden="true">{isOpen ? "×" : "＋"}</span></button>
      {isOpen && <nav id="mobile-menu" aria-label={tr("Điều hướng di động")}>{navigation.map((item) => <Link key={`${tr(item.label)}-${item.href}`} href={item.href} onClick={() => setIsOpen(false)}>{tr(item.label)}{!item.isAvailable ? <span>{tr("Sắp mở")}</span> : null}</Link>)}</nav>}
    </div>
  );
}
