"use client";

import Image from "next/image";
import Link from "next/link";
import { useEffect, useState } from "react";
import { navigation } from "@/components/layout/navigation";
import styles from "./home-arrival-header.module.css";

type HeaderStage = "waiting" | "revealed";

const INTRO_SESSION_KEY = "luminal-home-intro-v1";

export function HomeArrivalHeader({ immersive }: Readonly<{ immersive: boolean }>) {
  const [stage, setStage] = useState<HeaderStage>(immersive ? "waiting" : "revealed");
  const [menuOpen, setMenuOpen] = useState(false);

  useEffect(() => {
    if (!immersive) {
      setStage("revealed");
      return;
    }

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
      setStage("revealed");
      return;
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
      data-stage={stage}
      data-menu-open={menuOpen ? "true" : "false"}
    >
      <a className="skip-link" href="#main-content">Bỏ qua đến nội dung chính</a>

      <div className={styles.shell}>
        <span className={styles.rail} aria-hidden="true" />

        <Link
          href="/"
          className={styles.logoDock}
          aria-label="Luminal Factory"
          data-home-logo-dock="true"
        >
          <Image
            src="/brand/luminal-factory-logo-primary.png"
            alt=""
            width={4000}
            height={4000}
            sizes="56px"
            priority
          />
        </Link>

        <span className={styles.railLabel} aria-hidden="true">Luminal Factory</span>

        <nav className={styles.desktopNav} aria-label="Điều hướng chính">
          {navigation.map((item, index) => (
            <Link
              href={item.href}
              key={item.href}
              className={styles.navBubble}
              style={{ "--nav-index": index } as React.CSSProperties}
            >
              {item.label}
            </Link>
          ))}
        </nav>

        <button
          type="button"
          className={styles.menuButton}
          onClick={() => setMenuOpen((value) => !value)}
          aria-label={menuOpen ? "Đóng menu" : "Mở menu"}
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
        aria-label="Điều hướng chính trên di động"
        aria-hidden={!menuOpen}
      >
        <div className={styles.menuBackdrop} onClick={() => setMenuOpen(false)} aria-hidden="true" />
        <ul>
          {navigation.map((item, index) => (
            <li
              key={item.href}
              style={{ "--nav-index": index } as React.CSSProperties}
            >
              <Link href={item.href} onClick={() => setMenuOpen(false)}>
                <span>{item.label}</span>
                <i aria-hidden="true">↗</i>
              </Link>
            </li>
          ))}
        </ul>
      </nav>
    </header>
  );
}
