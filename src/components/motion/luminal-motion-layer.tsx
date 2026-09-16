"use client";

import { useEffect, useRef } from "react";

const REVEAL_SELECTOR = "[data-luminal-reveal]";
const SPOTLIGHT_SELECTOR = "[data-luminal-spotlight]";
const GLASS_TRAIL_LENGTH = 14;
const CURSOR_IDLE_TIMEOUT_MS = 700;
const CURSOR_HEAD_EASE = 0.34;
const CURSOR_SETTLE_PX = 0.35;

function clamp(value: number, min: number, max: number) {
  return Math.min(Math.max(value, min), max);
}

export function LuminalMotionLayer() {
  const cursorRef = useRef<HTMLDivElement>(null);
  const trailRefs = useRef<Array<HTMLSpanElement | null>>([]);

  useEffect(() => {
    const cursor = cursorRef.current;
    if (!cursor) return;

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
    let targetX = window.innerWidth * 0.58;
    let targetY = window.innerHeight * 0.38;
    let lastPointerX = targetX;
    let lastPointerY = targetY;
    let heading = 0;
    let stretch = 1;

    const points = Array.from({ length: GLASS_TRAIL_LENGTH }, () => ({
      x: targetX,
      y: targetY,
    }));

    const ensureCursorFrame = () => {
      if (frameId) return;
      frameId = window.requestAnimationFrame(renderGlassTrail);
    };

    const renderGlassTrail = () => {
      frameId = 0;
      let anchorX = targetX;
      let anchorY = targetY;
      let maxDistance = 0;
      stretch += (1 - stretch) * 0.12;

      for (let index = 0; index < points.length; index += 1) {
        const point = points[index];
        const ease = Math.max(0.11, CURSOR_HEAD_EASE - index * 0.014);
        point.x += (anchorX - point.x) * ease;
        point.y += (anchorY - point.y) * ease;

        const distance = Math.abs(anchorX - point.x) + Math.abs(anchorY - point.y);
        maxDistance = Math.max(maxDistance, distance);

        const node = trailRefs.current[index];
        if (node) {
          const progress = index / Math.max(points.length - 1, 1);
          const size = 26 - progress * 16;
          const opacity = 0.94 - progress * 0.72;
          const localStretch = 1 + (stretch - 1) * (1 - progress * 0.76);
          const crossScale = 1 / Math.sqrt(localStretch);

          node.style.width = `${size}px`;
          node.style.height = `${size}px`;
          node.style.opacity = `${opacity}`;
          node.style.transform = `translate3d(${point.x}px, ${point.y}px, 0) translate(-50%, -50%) rotate(${heading}rad) scale(${localStretch}, ${crossScale})`;
        }

        anchorX = point.x;
        anchorY = point.y;
      }

      if (active || maxDistance > CURSOR_SETTLE_PX || stretch > 1.01) ensureCursorFrame();
    };

    const deactivateCursor = () => {
      active = false;
      cursor.style.opacity = "0";
      ensureCursorFrame();
    };

    const scheduleIdleFade = () => {
      if (idleTimer !== null) window.clearTimeout(idleTimer);
      idleTimer = window.setTimeout(deactivateCursor, CURSOR_IDLE_TIMEOUT_MS);
    };

    const handlePointerMove = (event: PointerEvent) => {
      const dx = event.clientX - lastPointerX;
      const dy = event.clientY - lastPointerY;
      const speed = Math.hypot(dx, dy);

      if (speed > 0.5) heading = Math.atan2(dy, dx);
      stretch = clamp(1 + speed * 0.018, 1, 1.55);
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
        transition: "opacity 480ms ease",
      }}
    >
      {Array.from({ length: GLASS_TRAIL_LENGTH }, (_, index) => (
        <span
          key={index}
          ref={(node) => {
            trailRefs.current[index] = node;
          }}
          style={{
            position: "absolute",
            left: 0,
            top: 0,
            width: 26,
            height: 26,
            borderRadius: 999,
            border: "1px solid rgba(255,255,255,.28)",
            background: "radial-gradient(circle at 32% 24%, rgba(255,255,255,.42) 0%, rgba(243,230,195,.16) 24%, rgba(214,179,90,.08) 48%, rgba(114,89,184,.055) 72%, rgba(255,255,255,.02) 100%)",
            backdropFilter: "blur(5px) saturate(1.35)",
            WebkitBackdropFilter: "blur(5px) saturate(1.35)",
            boxShadow: "inset 0 1px 1px rgba(255,255,255,.38), inset -4px -5px 10px rgba(114,89,184,.08), 0 5px 16px rgba(0,0,0,.18), 0 0 18px rgba(214,179,90,.08)",
            mixBlendMode: "screen",
            opacity: 0,
            pointerEvents: "none",
            transform: "translate3d(-100px,-100px,0)",
            transformOrigin: "center",
            willChange: "transform, opacity",
            contain: "strict",
          }}
        />
      ))}
    </div>
  );
}
