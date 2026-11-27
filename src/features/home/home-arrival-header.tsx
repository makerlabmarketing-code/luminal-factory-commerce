"use client";
import { useTranslator } from "@/lib/i18n/client";


import Image from "next/image";
import Link from "@/lib/i18n/link";
import { useEffect, useRef, useState } from "react";
import { publicNavigation } from "@/components/layout/navigation";
import styles from "./home-arrival-header.module.css";
import { RaffleHeaderNotice } from "@/features/raffle/raffle-header-notice";

type HeaderStage = "waiting" | "revealed";

export function HomeArrivalHeader({ stage = "revealed", rafflePreview = false, split = false }: Readonly<{ stage?: HeaderStage; rafflePreview?: boolean; split?: boolean }>) {
  const tr = useTranslator();
  const [menuOpen, setMenuOpen] = useState(false);
  const headerRef = useRef<HTMLElement>(null);
  const menuRef = useRef<HTMLElement>(null);
  const desktopNavRef = useRef<HTMLElement>(null);
  const triggerRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    if (!menuOpen) return;
    const header = headerRef.current;
    const panel = menuRef.current;
    const trigger = triggerRef.current;
    const desktopNav = desktopNavRef.current;
    if (!header || !panel || !trigger) return;
    const previousOverflow = document.body.style.overflow;
    const isolated = new Map<HTMLElement, boolean>();
    // Isolate siblings along both branches, leaving the close trigger usable.
    const isolateBranch = (element: HTMLElement, stop: HTMLElement) => {
      let current = element;
      while (current !== stop && current.parentElement) {
        for (const sibling of Array.from(current.parentElement.children)) {
          if (!(sibling instanceof HTMLElement) || sibling === current || sibling.contains(panel) || sibling.contains(trigger)) continue;
          if (!isolated.has(sibling)) isolated.set(sibling, sibling.inert);
          sibling.inert = true;
        }
        current = current.parentElement;
      }
    };
    isolateBranch(trigger, document.body);
    isolateBranch(panel, document.body);
    document.body.style.overflow = "hidden";
    const items = () => [trigger, ...Array.from(panel.querySelectorAll<HTMLElement>('a[href], button:not(:disabled), [tabindex="0"]'))]
      .filter((element) => element.getClientRects().length > 0);
    const desktop = window.matchMedia("(min-width: 900px)");
    let mobileHref: string | null = null;
    const rememberFocusedLink = (event: FocusEvent) => {
      mobileHref = event.target instanceof HTMLAnchorElement ? event.target.getAttribute("href") : null;
    };
    panel.addEventListener("focusin", rememberFocusedLink);
    // Wait for the panel to become visible before moving focus into it.
    const focusFirstLink = (retry: boolean) => {
      if (desktop.matches || panel.contains(document.activeElement)) return;
      items()[1]?.focus({ preventScroll: true });
      if (retry && !panel.contains(document.activeElement)) {
        focusFrame = window.requestAnimationFrame(() => focusFirstLink(false));
      }
    };
    let focusFrame = window.requestAnimationFrame(() => focusFirstLink(true));
    const closeOnDesktop = () => { if (desktop.matches) setMenuOpen(false); };
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") { event.preventDefault(); setMenuOpen(false); }
      if (event.key !== "Tab") return;
      const controls = items();
      const first = controls[0];
      const last = controls[controls.length - 1];
      if (!first) return;
      if (!controls.includes(document.activeElement as HTMLElement) || (event.shiftKey && document.activeElement === first)) {
        event.preventDefault(); (event.shiftKey ? last : first).focus();
      } else if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault(); first.focus();
      }
    };
    desktop.addEventListener("change", closeOnDesktop);
    window.addEventListener("keydown", handleKeyDown);
    return () => {
      window.cancelAnimationFrame(focusFrame);
      panel.removeEventListener("focusin", rememberFocusedLink);
      desktop.removeEventListener("change", closeOnDesktop);
      window.removeEventListener("keydown", handleKeyDown);
      for (const [element, inert] of isolated) element.inert = inert;
      document.body.style.overflow = previousOverflow;
      if (!trigger.isConnected) return;
      if (desktop.matches) {
        const links = Array.from(desktopNav?.querySelectorAll<HTMLAnchorElement>("a[href]") ?? []);
        (links.find((link) => link.getAttribute("href") === mobileHref) ?? links[0])?.focus({ preventScroll: true });
      } else {
        trigger.focus({ preventScroll: true });
      }
    };
  }, [menuOpen]);

  return (
    <header
      ref={headerRef}
      role={menuOpen ? "dialog" : undefined}
      aria-modal={menuOpen ? true : undefined}
      aria-label={menuOpen ? tr("Điều hướng chính trên di động") : undefined}
      className={styles.header}
      data-stage={stage}
      data-layout={split ? "split" : undefined}
      inert={stage === "waiting"}
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
            priority={stage === "waiting"}
          />
        </Link>

        <span className={styles.railLabel} aria-hidden="true">{tr("Luminal Factory")}</span>

        {stage === "revealed" && !menuOpen && <RaffleHeaderNotice preview={rafflePreview} />}

        <nav ref={desktopNavRef} className={styles.desktopNav} aria-label={tr("Điều hướng chính")}>
          {publicNavigation.map((item, index) => (
            <Link
              href={item.href}
              key={item.href}
              className={styles.navBubble}
              style={{ "--nav-index": index } as React.CSSProperties}
            >
              {tr(item.label)}
            </Link>
          ))}
        </nav>


        <button
          type="button"
          ref={triggerRef}
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
        ref={menuRef}
        id="home-arrival-mobile-menu"
        className={styles.mobilePanel}
        aria-label={tr("Điều hướng chính trên di động")}
        aria-hidden={!menuOpen}
        inert={!menuOpen}
      >
        <div className={styles.menuBackdrop} onClick={() => setMenuOpen(false)} aria-hidden="true" />
        <ul>
          {publicNavigation.map((item, index) => (
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
      </nav>
    </header>
  );
}
