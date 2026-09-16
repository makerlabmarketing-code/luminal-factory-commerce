"use client";

import { useEffect, useRef } from "react";

const REVEAL_SELECTOR = "[data-luminal-reveal]";
const SPOTLIGHT_SELECTOR = "[data-luminal-spotlight]";
const CURSOR_IDLE_TIMEOUT_MS = 700;
const CURSOR_HEAD_EASE = 0.34;
const CURSOR_TAIL_EASE = 0.14;
const CURSOR_SETTLE_PX = 0.35;

function clamp(value: number, min: number, max: number) {
  return Math.min(Math.max(value, min), max);
}

export function LuminalMotionLayer() {
  const cursorRef = useRef<HTMLDivElement>(null);
  const glassHeadRef = useRef<HTMLSpanElement>(null);
  const glassRibbonRef = useRef<HTMLSpanElement>(null);
  const glassHaloRef = useRef<HTMLSpanElement>(null);

  useEffect(() => {
    const cursor = cursorRef.current;
    const glassHead = glassHeadRef.current;
    const glassRibbon = glassRibbonRef.current;
    const glassHalo = glassHaloRef.current;
    if (!cursor || !glassHead || !glassRibbon || !glassHalo) return;

    const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)");
    if (reducedMotion.matches) {
      cursor.style.display = "none";
      return;
    }

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
    if (!finePointer.matches) cursor.style.display = "none";

    let frameId = 0;
    let idleTimer: number | null = null;
    let active = false;
    let hasPointerSample = false;
    let targetX = window.innerWidth * 0.58;
    let targetY = window.innerHeight * 0.38;
    let lastPointerX = targetX;
    let lastPointerY = targetY;
    let velocityStretch = 1;

    const headPoint = { x: targetX, y: targetY };
    const tailPoint = { x: targetX, y: targetY };

    const ensureCursorFrame = () => {
      if (frameId) return;
      frameId = window.requestAnimationFrame(renderGlassTrail);
    };

    const renderGlassTrail = () => {
      frameId = 0;

      headPoint.x += (targetX - headPoint.x) * CURSOR_HEAD_EASE;
      headPoint.y += (targetY - headPoint.y) * CURSOR_HEAD_EASE;
      tailPoint.x += (headPoint.x - tailPoint.x) * CURSOR_TAIL_EASE;
      tailPoint.y += (headPoint.y - tailPoint.y) * CURSOR_TAIL_EASE;
      velocityStretch += (1 - velocityStretch) * 0.14;

      const ribbonDx = headPoint.x - tailPoint.x;
      const ribbonDy = headPoint.y - tailPoint.y;
      const ribbonDistance = Math.hypot(ribbonDx, ribbonDy);
      const heading = ribbonDistance > 0.01 ? Math.atan2(ribbonDy, ribbonDx) : 0;
      const midpointX = tailPoint.x + ribbonDx * 0.5;
      const midpointY = tailPoint.y + ribbonDy * 0.5;
      const ribbonLength = clamp(ribbonDistance * 1.12 + 12, 12, 104);
      const ribbonThickness = clamp(8 + (velocityStretch - 1) * 14, 8, 12);
      const ribbonOpacity = clamp(ribbonDistance / 110, 0.08, 0.34);
      const headCrossScale = 1 / Math.sqrt(velocityStretch);

      glassRibbon.style.width = `${ribbonLength}px`;
      glassRibbon.style.height = `${ribbonThickness}px`;
      glassRibbon.style.opacity = `${ribbonOpacity}`;
      glassRibbon.style.transform = `translate3d(${midpointX}px, ${midpointY}px, 0) translate(-50%, -50%) rotate(${heading}rad)`;

      glassHalo.style.opacity = `${clamp(0.12 + (velocityStretch - 1) * 0.28, 0.12, 0.22)}`;
      glassHalo.style.transform = `translate3d(${headPoint.x}px, ${headPoint.y}px, 0) translate(-50%, -50%) scale(${1 + (velocityStretch - 1) * 0.32})`;

      glassHead.style.transform = `translate3d(${headPoint.x}px, ${headPoint.y}px, 0) translate(-50%, -50%) rotate(${heading}rad) scale(${velocityStretch}, ${headCrossScale})`;

      const settleDistance = Math.hypot(targetX - headPoint.x, targetY - headPoint.y) + ribbonDistance;
      if (active || settleDistance > CURSOR_SETTLE_PX || velocityStretch > 1.01) ensureCursorFrame();
    };

    const deactivateCursor = () => {
      active = false;
      hasPointerSample = false;
      cursor.style.opacity = "0";
      ensureCursorFrame();
    };

    const scheduleIdleFade = () => {
      if (idleTimer !== null) window.clearTimeout(idleTimer);
      idleTimer = window.setTimeout(deactivateCursor, CURSOR_IDLE_TIMEOUT_MS);
    };

    const handlePointerMove = (event: PointerEvent) => {
      if (!hasPointerSample) {
        lastPointerX = event.clientX;
        lastPointerY = event.clientY;
        hasPointerSample = true;
      }

      const dx = event.clientX - lastPointerX;
      const dy = event.clientY - lastPointerY;
      const speed = Math.hypot(dx, dy);

      velocityStretch = clamp(1 + speed * 0.012, 1, 1.32);
      lastPointerX = event.clientX;
      lastPointerY = event.clientY;
      targetX = event.clientX;
      targetY = event.clientY;
      active = true;
      cursor.style.opacity = "1";
      ensureCursorFrame();
      scheduleIdleFade();

      if (!(event.target instanceof Element)) return;
      const spotlight = event.target.closest<HTMLElement>(SPOTLIGHT_SELECTOR);
      if (!spotlight) return;

      const rect = spotlight.getBoundingClientRect();
      spotlight.style.setProperty("--luminal-spot-x", `${event.clientX - rect.left}px`);
      spotlight.style.setProperty("--luminal-spot-y", `${event.clientY - rect.top}px`);
    };

    if (finePointer.matches) {
      window.addEventListener("pointermove", handlePointerMove, { passive: true });
      document.addEventListener("mouseleave", deactivateCursor);
      window.addEventListener("blur", deactivateCursor);
    }

    return () => {
      root.classList.remove("luminal-motion-ready");
      revealObserver.disconnect();
      mutationObserver.disconnect();
      window.cancelAnimationFrame(frameId);
      if (idleTimer !== null) window.clearTimeout(idleTimer);
      window.removeEventListener("pointermove", handlePointerMove);
      document.removeEventListener("mouseleave", deactivateCursor);
      window.removeEventListener("blur", deactivateCursor);
    };
  }, []);

  return (
    <div
      ref={cursorRef}
      className="luminal-glass-cursor"
      data-cursor="glass-trail"
      aria-hidden="true"
      style={{
        position: "fixed",
        left: 0,
        top: 0,
        zIndex: 60,
        width: 1,
        height: 1,
        pointerEvents: "none",
        opacity: 0,
        transition: "opacity 420ms ease",
      }}
    >
      <span
        ref={glassRibbonRef}
        data-cursor-part="ribbon"
        style={{
          position: "absolute",
          left: 0,
          top: 0,
          width: 12,
          height: 8,
          borderRadius: 999,
          border: "none",
          background: "linear-gradient(90deg, rgba(114,89,184,0) 0%, rgba(114,89,184,.035) 24%, rgba(214,179,90,.075) 58%, rgba(255,255,255,.14) 100%)",
          backdropFilter: "blur(2px) saturate(1.16)",
          WebkitBackdropFilter: "blur(2px) saturate(1.16)",
          boxShadow: "0 0 14px rgba(214,179,90,.045)",
          opacity: 0,
          pointerEvents: "none",
          transform: "translate3d(-100px,-100px,0)",
          transformOrigin: "center",
          willChange: "width, height, transform, opacity",
          contain: "strict",
        }}
      />
      <span
        ref={glassHaloRef}
        data-cursor-part="halo"
        style={{
          position: "absolute",
          left: 0,
          top: 0,
          width: 40,
          height: 40,
          borderRadius: 999,
          background: "radial-gradient(circle, rgba(214,179,90,.12) 0%, rgba(114,89,184,.055) 42%, transparent 72%)",
          filter: "blur(8px)",
          mixBlendMode: "screen",
          opacity: 0,
          pointerEvents: "none",
          transform: "translate3d(-100px,-100px,0)",
          transformOrigin: "center",
          willChange: "transform, opacity",
        }}
      />
      <span
        ref={glassHeadRef}
        data-cursor-part="head"
        style={{
          position: "absolute",
          left: 0,
          top: 0,
          width: 22,
          height: 22,
          borderRadius: "47% 53% 50% 50% / 52% 46% 54% 48%",
          border: "1px solid rgba(255,255,255,.18)",
          background: "radial-gradient(circle at 34% 27%, rgba(255,255,255,.34) 0%, rgba(255,255,255,.09) 28%, rgba(214,179,90,.065) 52%, rgba(114,89,184,.04) 72%, rgba(10,10,12,.035) 100%)",
          backdropFilter: "blur(5px) saturate(1.35)",
          WebkitBackdropFilter: "blur(5px) saturate(1.35)",
          boxShadow: "inset 0 1px 1px rgba(255,255,255,.28), inset -3px -4px 8px rgba(114,89,184,.055), 0 3px 12px rgba(0,0,0,.16)",
          opacity: 0.92,
          pointerEvents: "none",
          transform: "translate3d(-100px,-100px,0)",
          transformOrigin: "center",
          willChange: "transform",
          contain: "strict",
        }}
      />
    </div>
  );
}
