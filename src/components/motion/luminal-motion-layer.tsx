"use client";

import { useEffect, useRef } from "react";

const REVEAL_SELECTOR = "[data-luminal-reveal]";
const SPOTLIGHT_SELECTOR = "[data-luminal-spotlight]";
const LEAD_EASE = 0.11;
const TRAIL_EASE = 0.055;
const FLOW_SETTLE_PX = 0.15;

export function LuminalMotionLayer() {
  const lightRef = useRef<HTMLDivElement>(null);
  const goldRef = useRef<HTMLSpanElement>(null);
  const violetRef = useRef<HTMLSpanElement>(null);

  useEffect(() => {
    const light = lightRef.current;
    const gold = goldRef.current;
    const violet = violetRef.current;
    if (!light || !gold || !violet) return;

    const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)");
    if (reducedMotion.matches) return;

    const root = document.documentElement;
    const observed = new WeakSet<Element>();
    const revealObserver = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (!entry.isIntersecting) continue;
          (entry.target as HTMLElement).dataset.luminalVisible = "true";
          revealObserver.unobserve(entry.target);
        }
      },
      { threshold: 0.18, rootMargin: "0px 0px -12% 0px" },
    );

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
    let frameId = 0;
    let active = false;
    let targetX = window.innerWidth * 0.58;
    let targetY = window.innerHeight * 0.38;
    let leadX = targetX;
    let leadY = targetY;
    let trailX = targetX;
    let trailY = targetY;

    const ensureFlowFrame = () => {
      if (frameId) return;
      frameId = window.requestAnimationFrame(renderFlow);
    };

    const renderFlow = (now: number) => {
      frameId = 0;

      leadX += (targetX - leadX) * LEAD_EASE;
      leadY += (targetY - leadY) * LEAD_EASE;
      trailX += (leadX - trailX) * TRAIL_EASE;
      trailY += (leadY - trailY) * TRAIL_EASE;

      const driftX = Math.sin(now * 0.00145) * 11;
      const driftY = Math.cos(now * 0.00115) * 8;
      const counterDriftX = Math.cos(now * 0.00105) * 16;
      const counterDriftY = Math.sin(now * 0.00135) * 12;

      gold.style.transform = `translate3d(${leadX + driftX}px, ${leadY + driftY}px, 0) translate(-50%, -50%)`;
      violet.style.setProperty(
        "transform",
        `translate3d(${trailX - counterDriftX}px, ${trailY + counterDriftY}px, 0) translate(-50%, -50%)`,
        "important",
      );

      const leadDistance = Math.abs(targetX - leadX) + Math.abs(targetY - leadY);
      const trailDistance = Math.abs(leadX - trailX) + Math.abs(leadY - trailY);
      if (active || leadDistance > FLOW_SETTLE_PX || trailDistance > FLOW_SETTLE_PX) ensureFlowFrame();
    };

    const deactivateLight = () => {
      active = false;
      light.dataset.active = "false";
      ensureFlowFrame();
    };

    const handlePointerMove = (event: PointerEvent) => {
      targetX = event.clientX;
      targetY = event.clientY;
      active = true;
      light.dataset.active = "true";
      ensureFlowFrame();

      if (!(event.target instanceof Element)) return;
      const spotlight = event.target.closest<HTMLElement>(SPOTLIGHT_SELECTOR);
      if (!spotlight) return;

      const rect = spotlight.getBoundingClientRect();
      spotlight.style.setProperty("--luminal-spot-x", `${event.clientX - rect.left}px`);
      spotlight.style.setProperty("--luminal-spot-y", `${event.clientY - rect.top}px`);
    };

    if (finePointer.matches) {
      window.addEventListener("pointermove", handlePointerMove, { passive: true });
      document.addEventListener("mouseleave", deactivateLight);
      window.addEventListener("blur", deactivateLight);
    }

    return () => {
      root.classList.remove("luminal-motion-ready");
      revealObserver.disconnect();
      mutationObserver.disconnect();
      window.cancelAnimationFrame(frameId);
      window.removeEventListener("pointermove", handlePointerMove);
      document.removeEventListener("mouseleave", deactivateLight);
      window.removeEventListener("blur", deactivateLight);
    };
  }, []);

  return (
    <div ref={lightRef} className="luminal-cursor-light" data-active="false" data-flow="dual-follower" aria-hidden="true">
      <span ref={goldRef} className="luminal-cursor-light-gold" />
      <span ref={violetRef} className="luminal-cursor-light-violet" />
    </div>
  );
}
