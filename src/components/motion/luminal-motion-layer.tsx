"use client";

import { useEffect } from "react";

import "./luminal-bento.module.css";

const REVEAL_SELECTOR = "[data-luminal-reveal]";
const SPOTLIGHT_SELECTOR = "[data-luminal-spotlight]";
const BENTO_SELECTOR = ".made-at-luminal ol > li";
const BENTO_PROXIMITY_PX = 260;
const BENTO_AMBIENT_SCALE = 0.28;

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
    let pointerX = 0;
    let pointerY = 0;
    let bentoFrame: number | null = null;

    const resetBento = () => {
      document.querySelectorAll<HTMLElement>(BENTO_SELECTOR).forEach((card) => {
        card.style.setProperty("--luminal-bento-intensity", "0");
        delete card.dataset.luminalBentoActive;
      });
    };

    const renderBento = () => {
      bentoFrame = null;
      const activeCard = document.elementFromPoint(pointerX, pointerY)?.closest<HTMLElement>(BENTO_SELECTOR) ?? null;

      document.querySelectorAll<HTMLElement>(BENTO_SELECTOR).forEach((card) => {
        const rect = card.getBoundingClientRect();
        const dx = pointerX < rect.left ? rect.left - pointerX : pointerX > rect.right ? pointerX - rect.right : 0;
        const dy = pointerY < rect.top ? rect.top - pointerY : pointerY > rect.bottom ? pointerY - rect.bottom : 0;
        const distance = Math.hypot(dx, dy);
        const proximityIntensity = Math.max(0, 1 - distance / BENTO_PROXIMITY_PX);
        const isActive = card === activeCard;
        const intensity = activeCard ? (isActive ? 1 : 0) : proximityIntensity * BENTO_AMBIENT_SCALE;
        const localX = pointerX - rect.left;
        const localY = pointerY - rect.top;

        card.style.setProperty("--luminal-bento-x", `${localX}px`);
        card.style.setProperty("--luminal-bento-y", `${localY}px`);
        card.style.setProperty("--luminal-bento-intensity", intensity.toFixed(3));
        if (isActive) card.dataset.luminalBentoActive = "true";
        else delete card.dataset.luminalBentoActive;
      });
    };

    const scheduleBento = () => {
      if (bentoFrame !== null) return;
      bentoFrame = window.requestAnimationFrame(renderBento);
    };

    const handlePointerMove = (event: PointerEvent) => {
      pointerX = event.clientX;
      pointerY = event.clientY;
      scheduleBento();
      if (!(event.target instanceof Element)) return;
      const spotlight = event.target.closest<HTMLElement>(SPOTLIGHT_SELECTOR);
      if (!spotlight) return;
      const rect = spotlight.getBoundingClientRect();
      spotlight.style.setProperty("--luminal-spot-x", `${event.clientX - rect.left}px`);
      spotlight.style.setProperty("--luminal-spot-y", `${event.clientY - rect.top}px`);
    };

    if (finePointer.matches) {
      window.addEventListener("pointermove", handlePointerMove, { passive: true });
      window.addEventListener("pointerleave", resetBento);
    }

    return () => {
      root.classList.remove("luminal-motion-ready");
      revealObserver.disconnect();
      mutationObserver.disconnect();
      if (bentoFrame !== null) window.cancelAnimationFrame(bentoFrame);
      resetBento();
      window.removeEventListener("pointermove", handlePointerMove);
      window.removeEventListener("pointerleave", resetBento);
    };
  }, []);

  return null;
}
