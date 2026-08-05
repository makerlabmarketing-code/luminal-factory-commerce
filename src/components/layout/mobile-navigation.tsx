"use client";
import Link from "next/link";
import { useState } from "react";
import { navigation } from "./navigation";

export function MobileNavigation() {
  const [isOpen, setIsOpen] = useState(false);
  return (
    <div className="mobile-nav">
      <button type="button" aria-expanded={isOpen} aria-controls="mobile-menu" onClick={() => setIsOpen((value) => !value)}><span>{isOpen ? "Đóng" : "Menu"}</span><span aria-hidden="true">{isOpen ? "×" : "＋"}</span></button>
      {isOpen && <nav id="mobile-menu" aria-label="Điều hướng di động">{navigation.map((item) => <Link key={`${item.label}-${item.href}`} href={item.href} onClick={() => setIsOpen(false)}>{item.label}{!item.isAvailable ? <span>Sắp mở</span> : null}</Link>)}</nav>}
    </div>
  );
}
