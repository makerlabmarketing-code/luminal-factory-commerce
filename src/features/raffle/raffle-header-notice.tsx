"use client";

import { useEffect, useState } from "react";
import { usePathname } from "next/navigation";
import Link from "@/lib/i18n/link";
import { useLocale } from "@/lib/i18n/client";
import styles from "./raffle-header-notice.module.css";

type Notice = Readonly<{ slug: string; closesAt: string }>;

export function RaffleHeaderNotice({ preview }: Readonly<{ preview: boolean }>) {
  const pathname = usePathname();
  const locale = useLocale();
  const onRaffle = /^\/(?:en\/|vi\/)?raffle(?:\/|$)/.test(pathname);
  const [notice, setNotice] = useState<Notice | null>(null);

  useEffect(() => {
    if (preview || onRaffle) return;

    const controller = new AbortController();
    let expires: ReturnType<typeof setTimeout> | undefined;
    async function load() {
      try {
        const response = await fetch("/api/raffle-notice", { signal: controller.signal });
        if (!response.ok) return;
        const { raffle } = await response.json() as { raffle: Notice | null };
        if (controller.signal.aborted) return;
        const delay = raffle ? Date.parse(raffle.closesAt) - Date.now() : 0;
        if (expires !== undefined) clearTimeout(expires);
        if (!raffle || !/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(raffle.slug) || !(delay > 0)) {
          setNotice(null);
          return;
        }
        setNotice(raffle);
        if (delay <= 2147483647) expires = setTimeout(() => setNotice(null), delay);
      } catch {
        // Navigation stays usable when a notice is unavailable.
      }
    }
    function onVisible() {
      if (document.visibilityState === "visible") void load();
    }
    void load();
    document.addEventListener("visibilitychange", onVisible);
    return () => {
      controller.abort();
      if (expires !== undefined) clearTimeout(expires);
      document.removeEventListener("visibilitychange", onVisible);
    };
  }, [onRaffle, preview]);

  const href = preview ? "#raffle-entry" : !onRaffle && notice ? `/raffle/${notice.slug}` : null;
  if (!href) return null;
  return (
    <Link className={styles.notice} href={href} prefetch={false}>
      <span className={styles.resin} aria-hidden="true" />
      <span className={styles.label}>{preview ? "Raffle preview" : locale === "vi" ? "Raffle đang mở" : "Raffle open"}</span>
    </Link>
  );
}
