"use client";

import { Fragment, useEffect, useRef } from "react";
import { ButtonLink } from "@/components/ui/button-link";

type HeroCopyMotionProps = Readonly<{
  eyebrow: string;
  title: string;
  description: string;
  primaryAction: Readonly<{ href: string; label: string }>;
  secondaryAction: Readonly<{ href: string; label: string }>;
}>;

const WORD_DURATION_MS = 600;
const WORD_STAGGER_MS = 52;
const WORD_INITIAL_DELAY_MS = 120;

export function HeroCopyMotion({ eyebrow, title, description, primaryAction, secondaryAction }: HeroCopyMotionProps) {
  const rootRef = useRef<HTMLDivElement>(null);
  const titleWords = title.trim().split(/\s+/);

  useEffect(() => {
    const root = rootRef.current;
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

  return (
    <div ref={rootRef} className="revival-hero-copy lg:max-w-[34rem] lg:-translate-y-[4vh]" data-hero-text-motion="word-reveal">
      <p className="eyebrow" data-hero-copy-support>{eyebrow}</p>
      <h1 id="hero-title">
        {titleWords.map((word, index) => (
          <Fragment key={`${word}-${index}`}>
            <span className="inline-block will-change-transform" data-hero-word>{word}</span>
            {index < titleWords.length - 1 ? " " : null}
          </Fragment>
        ))}
      </h1>
      <p className="lede" data-hero-copy-support>{description}</p>
      <div className="actions" data-hero-copy-support>
        <ButtonLink href={primaryAction.href}>{primaryAction.label}</ButtonLink>
        <ButtonLink href={secondaryAction.href} variant="secondary">{secondaryAction.label}</ButtonLink>
      </div>
    </div>
  );
}
