"use client";

import Image from "next/image";
import { useEffect, useRef, type ReactNode } from "react";
import type { HomeGalleryMedia } from "@/content/homepage-media";
import styles from "./made-at-luminal-rail.module.css";

type ProcessStep = Readonly<{
  number: string;
  title: string;
  copy: string;
  image?: HomeGalleryMedia;
}>;

type MadeAtLuminalRailProps = Readonly<{
  eyebrow: string;
  title: string;
  description: string;
  closing: string;
  steps: readonly ProcessStep[];
  children: ReactNode;
}>;

export function MadeAtLuminalRail({ eyebrow, title, description, closing, steps, children }: MadeAtLuminalRailProps) {
  const sectionRef = useRef<HTMLElement>(null);
  const viewportRef = useRef<HTMLDivElement>(null);
  const trackRef = useRef<HTMLDivElement>(null);
  const nextPanelRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const section = sectionRef.current;
    const viewport = viewportRef.current;
    const track = trackRef.current;
    const nextPanel = nextPanelRef.current;
    if (!section || !viewport || !track || !nextPanel) return;

    const desktop = window.matchMedia("(min-width: 900px) and (min-height: 600px) and (pointer: fine) and (prefers-reduced-motion: no-preference)");
    let travel = 0;
    let handoffWidth = 0;
    let frame = 0;

    function measure() {
      if (!section || !viewport || !nextPanel) return;
      if (!desktop.matches) {
        section.removeAttribute("data-process-pinned");
        section.style.removeProperty("--process-travel");
        section.style.removeProperty("--process-handoff");
        nextPanel.inert = false;
        viewport.tabIndex = 0;
        travel = 0;
        return;
      }

      travel = Math.max(0, viewport.scrollWidth - viewport.clientWidth);
      handoffWidth = viewport.clientWidth;
      section.toggleAttribute("data-process-pinned", travel > 0);
      section.style.setProperty("--process-travel", `${travel > 0 ? travel + handoffWidth : 0}px`);
      nextPanel.inert = travel > 0;
      viewport.tabIndex = travel > 0 ? -1 : 0;
      schedule();
    }

    function schedule() {
      if (!travel || frame) return;
      frame = window.requestAnimationFrame(() => {
        frame = 0;
        if (!travel || !section || !viewport || !nextPanel) return;
        const distance = -section.getBoundingClientRect().top;
        viewport.scrollLeft = Math.max(0, Math.min(travel, distance));
        const handoff = Math.max(0, Math.min(handoffWidth, distance - travel));
        section.style.setProperty("--process-handoff", `${-handoff}px`);
        nextPanel.inert = handoff < handoffWidth - 1;
      });
    }

    const observer = new ResizeObserver(measure);
    observer.observe(viewport);
    observer.observe(track);
    desktop.addEventListener("change", measure);
    window.addEventListener("scroll", schedule, { passive: true });
    measure();

    return () => {
      window.cancelAnimationFrame(frame);
      window.removeEventListener("scroll", schedule);
      desktop.removeEventListener("change", measure);
      observer.disconnect();
    };
  }, []);

  return (
    <section ref={sectionRef} className={`made-at-luminal ${styles.section}`} aria-labelledby="making-title">
      <div className={styles.stage}>
        <div className={styles.curtain} data-process-curtain>
          <div ref={viewportRef} className={styles.viewport} role="group" aria-labelledby="making-title" tabIndex={0}>
            <div ref={trackRef} className={styles.track}>
              <header className={styles.intro}>
                <p className="eyebrow">{eyebrow}</p>
                <h2 id="making-title">{title}</h2>
                <p>{description}</p>
              </header>
              <ol className={styles.steps} role="list">
                {steps.map((step) => (
                  <li className={styles.step} key={step.number}>
                    {step.image && (
                      <div className={styles.image}>
                        <Image
                          src={step.image.src}
                          alt={step.image.alt}
                          fill
                          sizes="(min-width: 900px) 48vw, 84vw"
                          style={{ objectPosition: step.image.objectPosition }}
                        />
                      </div>
                    )}
                    <div className={styles.copy}>
                      <span className={styles.number}>{step.number}</span>
                      <h3>{step.title}</h3>
                      <p>{step.copy}</p>
                    </div>
                  </li>
                ))}
              </ol>
              <p className={styles.outro}>{closing}</p>
            </div>
          </div>
        </div>
        <div ref={nextPanelRef} className={styles.nextPanel} data-process-next>{children}</div>
      </div>
    </section>
  );
}
