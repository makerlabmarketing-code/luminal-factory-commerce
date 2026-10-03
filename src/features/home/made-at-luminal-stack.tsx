"use client";


import { useEffect, useRef, useState } from "react";

type ProcessStep = Readonly<{
  number: string;
  title: string;
  copy: string;
}>;

type MadeAtLuminalStackProps = Readonly<{
  steps: readonly ProcessStep[];
}>;

const HEADER_STICKY_TOP_REM = 5;
const HEADER_STACK_GAP_REM = 0.75;
// A full-sized 2-line-safe rail prevents the next sticky card from clipping
// the preceding folder title as the four cards stack.
const STICKY_STEP_REM = 2.35;
const DESKTOP_MEDIA = "(min-width: 768px)";
const REDUCED_MOTION_MEDIA = "(prefers-reduced-motion: reduce)";

function statesEqual(left: readonly boolean[], right: readonly boolean[]) {
  return left.length === right.length && left.every((value, index) => value === right[index]);
}

export function MadeAtLuminalStack({ steps }: MadeAtLuminalStackProps) {
  const listRef = useRef<HTMLDivElement>(null);
  const itemRefs = useRef<Array<HTMLLIElement | null>>([]);
  const frameRef = useRef<number | null>(null);
  const [collapsed, setCollapsed] = useState<readonly boolean[]>(() => steps.map(() => false));

  useEffect(() => {
    const desktop = window.matchMedia(DESKTOP_MEDIA);
    const mountedList = listRef.current;
    const reducedMotion = window.matchMedia(REDUCED_MOTION_MEDIA);

    const measure = () => {
      frameRef.current = null;

      const list = listRef.current;
      const header = document.querySelector<HTMLElement>("[data-made-at-luminal-header='true']");
      if (!desktop.matches || reducedMotion.matches) {
        list?.style.removeProperty("--process-stack-top");
        list?.style.removeProperty("--process-stack-release");
        header?.style.removeProperty("translate");
        setCollapsed((previous) => {
          const next = steps.map(() => false);
          return statesEqual(previous, next) ? previous : next;
        });
        return;
      }

      const rootFontSize = Number.parseFloat(getComputedStyle(document.documentElement).fontSize) || 16;
      let stackTopPx = 0;
      if (list && header) {
        const headerHeight = header.getBoundingClientRect().height;
        stackTopPx = (
          HEADER_STICKY_TOP_REM * rootFontSize
          + headerHeight
          + HEADER_STACK_GAP_REM * rootFontSize
        );
        list.style.setProperty("--process-stack-top", `${Math.round(stackTopPx)}px`);
      }

      // All ceilings leave together as soon as Finish reaches its rail.
      // Measuring the containing block (not an already-sticky card) keeps
      // this independent of the previous frame's release offset.
      const finalCard = itemRefs.current[steps.length - 1];
      if (list && header && finalCard && stackTopPx > 0) {
        const ceiling = stackTopPx + (steps.length - 1) * STICKY_STEP_REM * rootFontSize;
        const release = Math.max(0, ceiling + finalCard.getBoundingClientRect().height - list.getBoundingClientRect().bottom);
        list.style.setProperty("--process-stack-release", `${release}px`);
        header.style.translate = release > 0 ? `0 -${Math.round(release)}px` : "";
      } else {
        list?.style.removeProperty("--process-stack-release");
        header?.style.removeProperty("translate");
      }

      const collapsedStripPx = STICKY_STEP_REM * rootFontSize + 2;
      const next = steps.map((_, index) => {
        if (index >= steps.length - 1) return false;

        const currentCard = itemRefs.current[index];
        const nextCard = itemRefs.current[index + 1];
        if (!currentCard || !nextCard) return false;

        const currentTop = currentCard.getBoundingClientRect().top;
        const nextTop = nextCard.getBoundingClientRect().top;
        return nextTop <= currentTop + collapsedStripPx;
      });

      setCollapsed((previous) => statesEqual(previous, next) ? previous : next);
    };

    const scheduleMeasure = () => {
      if (frameRef.current !== null) return;
      frameRef.current = window.requestAnimationFrame(measure);
    };

    scheduleMeasure();
    window.addEventListener("scroll", scheduleMeasure, { passive: true });
    window.addEventListener("resize", scheduleMeasure);
    desktop.addEventListener("change", scheduleMeasure);
    reducedMotion.addEventListener("change", scheduleMeasure);

    return () => {
      if (frameRef.current !== null) window.cancelAnimationFrame(frameRef.current);
      window.removeEventListener("scroll", scheduleMeasure);
      window.removeEventListener("resize", scheduleMeasure);
      desktop.removeEventListener("change", scheduleMeasure);
      reducedMotion.removeEventListener("change", scheduleMeasure);
      document.querySelector<HTMLElement>("[data-made-at-luminal-header='true']")?.style.removeProperty("translate");
      mountedList?.style.removeProperty("--process-stack-release");
    };
  }, [steps]);

  return (
    <div ref={listRef} className="relative">
      <ol className="m-0 grid list-none gap-[18vh] p-0 pb-[14vh] md:gap-[26vh] md:pb-0">
        {steps.map((step, index) => {
          const isLast = index === steps.length - 1;
          return (
            <li
              ref={(node) => {
                itemRefs.current[index] = node;
              }}
              className={`relative min-h-[24rem] overflow-hidden rounded-[1.75rem] border border-white/25 bg-[#0d0d0e] p-6 shadow-[0_2rem_7rem_rgba(0,0,0,0.38)] md:min-h-[60svh] md:p-10 md:sticky motion-reduce:static`}
              style={{
                // Preserve every title rail through the shared exit.
                top: `calc(var(--process-stack-top, 15rem) + ${index * STICKY_STEP_REM}rem - var(--process-stack-release, 0px))`,
                zIndex: index + 1,
              }}
              key={step.number}
              data-process-collapsed={collapsed[index] ? "true" : "false"}
              data-process-terminal={isLast ? "true" : undefined}
            >
              {!isLast ? (
                <div
                  aria-hidden="true"
                  className={`pointer-events-none absolute inset-x-6 top-[0.55rem] z-10 hidden h-[1.5rem] items-center bg-[#0d0d0e] font-mono text-[0.78rem] font-semibold uppercase leading-none tracking-[0.12em] text-white/80 transition-opacity duration-150 md:flex md:inset-x-10 ${
                    collapsed[index] ? "opacity-100" : "opacity-0"
                  }`}
                  data-process-collapsed-label={step.number}
                >
                  {step.number} / {step.title}
                </div>
              ) : null}

              <div
                className="grid h-full min-h-[inherit] content-between gap-12 md:grid-cols-[0.7fr_1.3fr] md:items-end"
                data-luminal-reveal="card"
                data-luminal-delay={index}
              >
                <div>
                  <span className="font-mono text-xs tracking-[0.2em] text-white/45">{step.number} / 04</span>
                  <h3 className="mt-5 max-w-[8ch] text-[clamp(2.6rem,7vw,7rem)] font-normal leading-[0.88] tracking-[-0.065em]">{step.title}</h3>
                </div>
                <div className="md:justify-self-end md:pb-4">
                  <p className="max-w-[30rem] text-base leading-7 text-white/55 md:text-lg">{step.copy}</p>
                  <div className="mt-8 h-px w-full bg-gradient-to-r from-[var(--ice)]/50 via-white/10 to-transparent" aria-hidden="true" />
                </div>
              </div>

              <span
                className="pointer-events-none absolute -right-4 -top-10 select-none text-[clamp(8rem,22vw,18rem)] font-semibold leading-none tracking-[-0.1em] text-white/[0.025]"
                aria-hidden="true"
              >
                {step.number}
              </span>
            </li>
          );
        })}
      </ol>
    </div>
  );
}
