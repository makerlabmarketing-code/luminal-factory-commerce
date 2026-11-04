"use client";

import { useEffect, useRef } from "react";
import styles from "./home-light-passage.module.css";

export function HomeLightPassage() {
  const hostRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const host = hostRef.current;
    const group = host?.parentElement;
    const passage = group?.querySelector<HTMLElement>(".brand-revival");
    const surface = group?.querySelector<HTMLElement>("[data-process-collapsed]");
    if (!host || !group || !passage || !surface) return;

    const desktop = matchMedia("(min-width: 1000px) and (hover: hover) and (pointer: fine)");
    const reduced = matchMedia("(prefers-reduced-motion: reduce)");
    const connection = (navigator as Navigator & {
      connection?: EventTarget & { saveData?: boolean };
    }).connection;
    let near = false;
    let disposed = false;
    let version = 0;
    let release: (() => void) | undefined;

    const update = () => {
      const current = ++version;
      release?.();
      release = undefined;
      if (!near || !desktop.matches || reduced.matches || connection?.saveData) return;
      void import("./home-light-renderer").then(({ mountHomeLight }) => {
        if (disposed || current !== version) return;
        release = mountHomeLight(host, passage, surface);
      }).catch(() => {
        // Optional enhancement: retain the server-rendered Home on chunk failure.
        host.dataset.lightState = "unavailable";
      });
    };

    const observer = new IntersectionObserver((entries) => {
      if (near || !entries.some(entry => entry.isIntersecting)) return;
      near = true;
      observer.disconnect();
      update();
    }, { rootMargin: "300px" });
    observer.observe(passage);
    desktop.addEventListener("change", update);
    reduced.addEventListener("change", update);
    connection?.addEventListener("change", update);
    return () => {
      disposed = true;
      version++;
      release?.();
      observer.disconnect();
      desktop.removeEventListener("change", update);
      reduced.removeEventListener("change", update);
      connection?.removeEventListener("change", update);
    };
  }, []);

  return <div ref={hostRef} className={styles.light} data-home-light-passage aria-hidden="true" />;
}
