"use client";

import { useEffect } from "react";

const REVEAL_SELECTOR = "[data-luminal-reveal]";
const SPOTLIGHT_SELECTOR = "[data-luminal-spotlight], [data-luminal-bento-card]";
export function LuminalMotionLayer() {
  useEffect(() => {
    const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)");
    if (reducedMotion.matches) return;

    const root = document.documentElement;
    const observed = new WeakSet<Element>();
    const revealObserver = new IntersectionObserver((entries) => {
      for (const entry of entries) {
        if (!entry.isIntersecting) continue;
        (entry.target as HTMLElement).dataset.luminalVisible = "true";
        revealObserver.unobserve(entry.target);
      }
    }, { threshold: 0.18, rootMargin: "0px 0px -12% 0px" });

    const observeRevealTargets = (scope: ParentNode) => {
      const targets: HTMLElement[] = [];
      if (scope instanceof HTMLElement && scope.matches(REVEAL_SELECTOR)) targets.push(scope);
      scope.querySelectorAll<HTMLElement>(REVEAL_SELECTOR).forEach((target) => targets.push(target));
      for (const target of targets) {
        if (observed.has(target)) continue;
        observed.add(target);
        revealObserver.observe(target);
      }
    };

    observeRevealTargets(document);
    const mutationObserver = new MutationObserver((records) => {
      for (const record of records) {
        for (const node of record.addedNodes) {
          if (node instanceof HTMLElement) observeRevealTargets(node);
        }
      }
    });
    mutationObserver.observe(document.body, { childList: true, subtree: true });
    root.classList.add("luminal-motion-ready");

    const finePointer = window.matchMedia("(pointer: fine)");
    const handlePointerMove = (event: PointerEvent) => {
      if (!(event.target instanceof Element)) return;
      const spotlight = event.target.closest<HTMLElement>(SPOTLIGHT_SELECTOR);
      if (!spotlight) return;
      const rect = spotlight.getBoundingClientRect();
      spotlight.style.setProperty("--luminal-spot-x", `${event.clientX - rect.left}px`);
      spotlight.style.setProperty("--luminal-spot-y", `${event.clientY - rect.top}px`);
    };

    if (finePointer.matches) {
      window.addEventListener("pointermove", handlePointerMove, { passive: true });
    }

    return () => {
      root.classList.remove("luminal-motion-ready");
      revealObserver.disconnect();
      mutationObserver.disconnect();
      window.removeEventListener("pointermove", handlePointerMove);
    };
  }, []);

  return null;
}
