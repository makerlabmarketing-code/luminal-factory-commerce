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
  const fieldRef = useRef<HTMLDivElement>(null);
  const bubbleRefs = useRef<Array<HTMLAnchorElement | null>>([]);
  const copyRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const scene = sceneRef.current;
    const field = fieldRef.current;
    const copy = copyRef.current;
    const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)");
    if (!scene || !field || !copy || reducedMotion.matches) return;

    let frame: number | null = null;
    const render = () => {
      frame = null;
      const section = scene.closest<HTMLElement>("[data-home-3d-section='featured']");
      if (!section) return;

      const top = section.getBoundingClientRect().top;
      const progress = clamp01((window.innerHeight * 0.72 - top) / (window.innerHeight * 0.67));
      const spread = progress * progress * (3 - 2 * progress);
      const model = document.querySelector<HTMLElement>("[data-home-immersive-model]");
      const modelRect = model?.getBoundingClientRect();
      const fieldRect = field.getBoundingClientRect();
      const sourceX = modelRect ? modelRect.left + modelRect.width * 0.5 : fieldRect.left + fieldRect.width * 0.5;
      const sourceY = modelRect ? modelRect.top + modelRect.height * 0.5 : fieldRect.top + fieldRect.height * 0.5;

      bubbleRefs.current.forEach((bubble, index) => {
        if (!bubble) return;
        const targetX = fieldRect.left + bubble.offsetLeft + bubble.offsetWidth * 0.5;
        const targetY = fieldRect.top + bubble.offsetTop + bubble.offsetHeight * 0.5;
        const rotate = index === 0 ? -16 : index === 2 ? 16 : 0;
        bubble.style.transform = `translate3d(${((sourceX - targetX) * (1 - spread)).toFixed(1)}px, ${((sourceY - targetY) * (1 - spread)).toFixed(1)}px, 0) scale(${(0.18 + spread * 0.82).toFixed(3)}) rotate(${(rotate * (1 - spread)).toFixed(1)}deg)`;
        const opacity = clamp01((progress - index * 0.065) / 0.23);
        bubble.style.opacity = opacity.toFixed(3);
        bubble.style.visibility = opacity > 0.01 ? "visible" : "hidden";
      });

      const copyProgress = clamp01((progress - 0.65) / 0.26);
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
      <div ref={fieldRef} className={styles.field} aria-label="Ba colorway Meowhe trước đây">
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
        <p className="eyebrow">01 / Selected archive</p>
        <h2 id="featured-title">Objects with a past.</h2>
        <p>Three earlier Meowhe colorways—Lolipop, Mictlán, and Mono—carry the character from its first chapter into Luminal Factory.</p>
        <Link className="text-link" href="/archive">Explore the full archive <span aria-hidden="true">↗</span></Link>
      </div>
    </div>
  );
}
