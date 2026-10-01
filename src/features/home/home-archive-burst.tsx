"use client";

import Image from "next/image";
import Link from "next/link";
import { useEffect, useRef } from "react";
import type { HomeGalleryMedia } from "@/content/homepage-media";
import styles from "./home-archive-burst.module.css";

type HomeArchiveBurstProps = Readonly<{
  colorways: readonly HomeGalleryMedia[];
}>;

function clamp01(value: number) {
  return Math.min(1, Math.max(0, value));
}

export function HomeArchiveBurst({ colorways }: HomeArchiveBurstProps) {
  const sceneRef = useRef<HTMLDivElement>(null);
  const bubbleRefs = useRef<Array<HTMLAnchorElement | null>>([]);
  const copyRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const scene = sceneRef.current;
    const copy = copyRef.current;
    const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)");
    if (!scene || !copy || reducedMotion.matches) return;

    let frame: number | null = null;
    let previousTime: number | null = null;
    let progress = 0;
    let target = 0;

    // The section scroll boundary controls WHEN the bubbles return, not WHERE
    // they fly from. No model position/DOM layout measurements in this loop.
    const REVEAL_VIEWPORT_START = 0.29;
    const REVEAL_VIEWPORT_SPAN = 0.29;
    const FLIGHT_EASING_PER_SECOND = 16;
    const BUBBLE_FLIGHT: ReadonlyArray<Readonly<{ x: number; y: number }>> = [
      { x: -112, y: 80 },
      { x: 118, y: -90 },
      { x: 74, y: 105 },
    ];

    const render = (now: number) => {
      frame = null;
      const seconds = previousTime === null ? 0.016 : Math.min(0.064, (now - previousTime) / 1000);
      previousTime = now;
      const easing = 1 - Math.exp(-FLIGHT_EASING_PER_SECOND * seconds);
      progress += (target - progress) * easing;
      if (Math.abs(target - progress) < 0.001) progress = target;

      const lightProgress = clamp01(progress);
      scene.style.setProperty("--stage-light", lightProgress.toFixed(3));
      bubbleRefs.current.forEach((bubble, index) => {
        if (!bubble) return;
        const arrival = clamp01((progress - index * 0.06) / 0.79);
        const eased = 1 - Math.pow(1 - arrival, 3);
        const flight = BUBBLE_FLIGHT[index] ?? BUBBLE_FLIGHT[0];
        const drift = 1 - eased;
        const arc = Math.sin(arrival * Math.PI) * (index === 2 ? 20 : -16);
        bubble.style.transform = `translate3d(${(flight.x * drift).toFixed(1)}px, ${(flight.y * drift + arc).toFixed(1)}px, 0) scale(${(0.08 + eased * 0.92).toFixed(3)})`;
        bubble.style.opacity = clamp01(arrival * 4).toFixed(3);
        bubble.style.visibility = arrival > 0 ? "visible" : "hidden";
      });

      const copyProgress = clamp01((progress - 0.16) / 0.38);
      copy.style.opacity = copyProgress.toFixed(3);
      copy.style.transform = `translate3d(0, ${((1 - copyProgress) * 20).toFixed(1)}px, 0)`;
      copy.style.visibility = copyProgress > 0 ? "visible" : "hidden";

      if (Math.abs(target - progress) > 0.001) {
        frame = window.requestAnimationFrame(render);
      } else previousTime = null;
    };

    const schedule = () => {
      const section = scene.closest<HTMLElement>("[data-home-3d-section='featured']");
      if (!section) return;
      const top = section.getBoundingClientRect().top;
      target = clamp01(
        (window.innerHeight * REVEAL_VIEWPORT_START - top)
          / (window.innerHeight * REVEAL_VIEWPORT_SPAN),
      );
      if (frame === null) frame = window.requestAnimationFrame(render);
    };
    const resize = () => schedule();
    schedule();
    window.addEventListener("scroll", schedule, { passive: true });
    window.addEventListener("resize", resize);
    return () => {
      if (frame !== null) window.cancelAnimationFrame(frame);
      window.removeEventListener("scroll", schedule);
      window.removeEventListener("resize", resize);
    };
  }, []);

  return (
    <div ref={sceneRef} className={styles.scene}>
      <div className={styles.spotlight} aria-hidden="true" />
      <div className={styles.field} aria-label="Ba colorway Meowhe trước đây">
        {colorways.map((colorway, index) => (
          <Link
            href="/archive"
            className={`${styles.bubble} ${styles[`bubble${index + 1}`]}`}
            key={colorway.id}
            ref={(node) => { bubbleRefs.current[index] = node; }}
            aria-label={`Xem colorway ${colorway.colorway} trong archive`}
          >
            <span className={styles.imageShell}>
              <Image src={colorway.src} alt={colorway.alt} fill sizes="(max-width: 700px) 38vw, 230px" style={{ objectPosition: colorway.objectPosition ?? "center" }} />
            </span>
            <span className={styles.bubbleLabel}>{colorway.colorway}</span>
          </Link>
        ))}
      </div>

      <div ref={copyRef} className={styles.copy}>
        <p className="eyebrow">01 / A character with a past</p>
        <h2 id="featured-title">Meet Meowhe.</h2>
        <p>One character, three earlier colorways. Explore Meowhe in Lolipop, Mictlán, and Mono.</p>
        <Link className="text-link" href="/archive">Explore the full archive <span aria-hidden="true">↗</span></Link>
      </div>
    </div>
  );
}
