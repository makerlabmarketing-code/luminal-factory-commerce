"use client";
import { useTranslator } from "@/lib/i18n/client";


import Image from "next/image";
import Link from "@/lib/i18n/link";
import { useEffect, useState } from "react";
import { navigation } from "@/components/layout/navigation";
import { LanguageSwitcher } from "@/components/layout/language-switcher";
import styles from "./home-arrival-header.module.css";

type HeaderStage = "waiting" | "revealed";

const INTRO_SESSION_KEY = "luminal-home-intro-v1";

export function HomeArrivalHeader({ immersive }: Readonly<{ immersive: boolean }>) {
  const tr = useTranslator();
  const [stage, setStage] = useState<HeaderStage>(immersive ? "waiting" : "revealed");
  const [menuOpen, setMenuOpen] = useState(false);

  useEffect(() => {
    if (!immersive) return;

    const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    let seenIntro = false;
    try {
      seenIntro = window.sessionStorage.getItem(INTRO_SESSION_KEY) === "1";
    } catch {
      seenIntro = false;
    }

    if (
      reducedMotion
      || seenIntro
      || document.documentElement.dataset.luminalBrandDocked === "true"
    ) {
      const revealFrame = window.requestAnimationFrame(() => setStage("revealed"));
      return () => window.cancelAnimationFrame(revealFrame);
    }

    const reveal = () => setStage("revealed");
    window.addEventListener("luminal:brand-docked", reveal);
    return () => window.removeEventListener("luminal:brand-docked", reveal);
  }, [immersive]);

  useEffect(() => {
    if (!menuOpen) return;
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") setMenuOpen(false);
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [menuOpen]);

  return (
    <header
      className={styles.header}
      data-stage={immersive ? stage : "revealed"}
      data-menu-open={menuOpen ? "true" : "false"}
    >
      <a className="skip-link" href="#main-content">{tr("Bỏ qua đến nội dung chính")}</a>

      <div className={styles.shell}>
        <span className={styles.rail} aria-hidden="true" />

        <Link
          href="/"
          className={styles.logoDock}
          aria-label={tr("Luminal Factory")}
          data-home-logo-dock="true"
        >
          <Image
            src="/brand/luminal-factory-logo-primary.png?v=gold-20261007"
            alt=""
            width={1024}
            height={1024}
            sizes="56px"
            priority={immersive}
          />
        </Link>

        <span className={styles.railLabel} aria-hidden="true">{tr("Luminal Factory")}</span>

        <nav className={styles.desktopNav} aria-label={tr("Điều hướng chính")}>
          {navigation.map((item, index) => (
            <Link
              href={item.href}
              key={item.href}
              className={styles.navBubble}
              style={{ "--nav-index": index } as React.CSSProperties}
            >
              {tr(item.label)}
            </Link>
          ))}
          <div className={styles.languageDock}><LanguageSwitcher /></div>
        </nav>


        <button
          type="button"
          className={styles.menuButton}
          onClick={() => setMenuOpen((value) => !value)}
          aria-label={menuOpen ? tr("Đóng menu") : tr("Mở menu")}
          aria-expanded={menuOpen}
          aria-controls="home-arrival-mobile-menu"
        >
          <span />
          <span />
        </button>
      </div>

      <nav
        id="home-arrival-mobile-menu"
        className={styles.mobilePanel}
        aria-label={tr("Điều hướng chính trên di động")}
        aria-hidden={!menuOpen}
        inert={!menuOpen}
      >
        <div className={styles.menuBackdrop} onClick={() => setMenuOpen(false)} aria-hidden="true" />
        <ul>
          {navigation.map((item, index) => (
            <li
              key={item.href}
              style={{ "--nav-index": index } as React.CSSProperties}
            >
              <Link href={item.href} onClick={() => setMenuOpen(false)}>
                <span>{tr(item.label)}</span>
                <i aria-hidden="true">↗</i>
              </Link>
            </li>
          ))}
        </ul>
        <div className="mobile-language-switch"><LanguageSwitcher onSelect={() => setMenuOpen(false)} /></div>
      </nav>
    </header>
  );
}
