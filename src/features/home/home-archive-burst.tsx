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
    const render = () => {
      frame = null;
      const section = scene.closest<HTMLElement>("[data-home-3d-section='featured']");
      if (!section) return;

      const top = section.getBoundingClientRect().top;
      const progress = clamp01((window.innerHeight * 0.62 - top) / (window.innerHeight * 0.46));

      bubbleRefs.current.forEach((bubble, index) => {
        if (!bubble) return;
        const arrival = clamp01((progress - index * 0.13) / 0.43);
        const eased = arrival * arrival * (3 - 2 * arrival);
        bubble.style.transform = `translate3d(${((1 - eased) * -32).toFixed(1)}px, ${((1 - eased) * 24).toFixed(1)}px, 0) scale(${(0.72 + eased * 0.28).toFixed(3)})`;
        bubble.style.opacity = eased.toFixed(3);
        bubble.style.visibility = eased > 0.01 ? "visible" : "hidden";
      });

      const copyProgress = clamp01((progress - 0.55) / 0.35);
      copy.style.opacity = copyProgress.toFixed(3);
      copy.style.transform = `translate3d(0, ${((1 - copyProgress) * 28).toFixed(1)}px, 0)`;
      copy.style.visibility = copyProgress > 0.01 ? "visible" : "hidden";
    };

    const schedule = () => {
      if (frame === null) frame = window.requestAnimationFrame(render);
    };

    render();
    window.addEventListener("scroll", schedule, { passive: true });
    window.addEventListener("resize", schedule);
    return () => {
      if (frame !== null) window.cancelAnimationFrame(frame);
      window.removeEventListener("scroll", schedule);
      window.removeEventListener("resize", schedule);
    };
  }, []);

  return (
    <div ref={sceneRef} className={styles.scene}>
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
