"use client";

import { useEffect, useRef } from "react";

const WORD_DURATION_MS = 600;
const WORD_STAGGER_MS = 52;
const WORD_INITIAL_DELAY_MS = 120;

export function HeroTextMotionController() {
  const markerRef = useRef<HTMLSpanElement>(null);

  useEffect(() => {
    const root = markerRef.current?.parentElement;
    // First-paint copy and CTAs stay readable; only desktop headings move.
    if (!root || window.matchMedia("(prefers-reduced-motion: reduce)").matches
      || window.matchMedia("(max-width: 699px)").matches) return;

    const animations: Animation[] = [];
    const words = Array.from(root.querySelectorAll<HTMLElement>("[data-hero-word]"));

    words.forEach((word, index) => {
      animations.push(
        word.animate(
          [
            { transform: "translateY(0.4em)" },
            { transform: "translateY(0)" },
          ],
          {
            duration: WORD_DURATION_MS,
            delay: WORD_INITIAL_DELAY_MS + index * WORD_STAGGER_MS,
            easing: "cubic-bezier(.2,.7,.2,1)",
            fill: "both",
          },
        ),
      );
    });

    return () => animations.forEach((animation) => animation.cancel());
  }, []);

  return <span ref={markerRef} hidden data-hero-text-controller="native-waapi" />;
}
