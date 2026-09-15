"use client";

import { useEffect, useRef } from "react";

const WORD_DURATION_MS = 600;
const WORD_STAGGER_MS = 52;
const WORD_INITIAL_DELAY_MS = 120;

export function HeroTextMotionController() {
  const markerRef = useRef<HTMLSpanElement>(null);

  useEffect(() => {
    const root = markerRef.current?.parentElement;
    if (!root || window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;

    const animations: Animation[] = [];
    const words = Array.from(root.querySelectorAll<HTMLElement>("[data-hero-word]"));
    const supporting = Array.from(root.querySelectorAll<HTMLElement>("[data-hero-copy-support]"));

    words.forEach((word, index) => {
      animations.push(
        word.animate(
          [
            { transform: "translateY(0.4em)", filter: "blur(2.5px)" },
            { transform: "translateY(0)", filter: "blur(0)" },
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

    const supportingStart = WORD_INITIAL_DELAY_MS + words.length * WORD_STAGGER_MS + 100;
    supporting.forEach((element, index) => {
      animations.push(
        element.animate(
          [
            { transform: "translateY(0.45rem)", filter: "blur(1.5px)" },
            { transform: "translateY(0)", filter: "blur(0)" },
          ],
          {
            duration: 520,
            delay: supportingStart + index * 70,
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
