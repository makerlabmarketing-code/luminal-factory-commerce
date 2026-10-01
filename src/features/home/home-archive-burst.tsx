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
    let elapsed = 0;
    let target = 0;
    // Keep reveal and retract anchored to exactly the same scroll range.
    // Direction must never reset the animation to zero on a tiny upward scroll.
    const REVEAL_DURATION = 2960;
    const REVEAL_VIEWPORT_START = 0.52;
    const REVEAL_VIEWPORT_SPAN = 0.27;
    const render = (now: number) => {
      frame = null;
      const section = scene.closest<HTMLElement>("[data-home-3d-section='featured']");
      if (!section) return;
      const delta = previousTime === null ? 16 : Math.min(64, now - previousTime);
      previousTime = now;
      // Both directions use the same interpolation speed. The same scroll
      // position produces the same final lighting, copy and bubble layout.
      const step = delta * 1.08;
      if (target < elapsed) elapsed = Math.max(target, elapsed - step);
      else elapsed = Math.min(target, elapsed + step);
      if (Math.abs(target - elapsed) < 1) elapsed = target;
      const model = document.querySelector<HTMLElement>("[data-home-immersive-model]");
      const source = model?.getBoundingClientRect();
      const bounds = scene.getBoundingClientRect();
      scene.style.setProperty("--stage-light", clamp01(elapsed / 1120).toFixed(3));
      bubbleRefs.current.forEach((bubble, index) => {
        if (!bubble) return;
        const arrival = clamp01((elapsed - index * 185) / 1600);
        const eased = 1 - Math.pow(1 - arrival, 3);
        const origin = {
          x: (source ? source.left + source.width / 2 : bounds.left + bounds.width * 0.25) - bounds.left - bubble.offsetLeft - bubble.offsetWidth / 2,
          y: (source ? source.top + source.height / 2 : bounds.top + bounds.height * 0.45) - bounds.top - bubble.offsetTop - bubble.offsetHeight / 2,
        };
        const arc = Math.sin(arrival * Math.PI) * (index === 2 ? 60 : -70);
        bubble.style.transform = `translate3d(${(origin.x * (1 - eased)).toFixed(1)}px, ${(origin.y * (1 - eased) + arc).toFixed(1)}px, 0) scale(${(0.08 + eased * 0.92).toFixed(3)})`;
        bubble.style.opacity = clamp01(arrival * 5).toFixed(3);
        bubble.style.visibility = arrival > 0 ? "visible" : "hidden";
      });
      const copyProgress = clamp01((elapsed - 530) / 800);
      copy.style.opacity = copyProgress.toFixed(3);
      copy.style.transform = `translate3d(0, ${((1 - copyProgress) * 20).toFixed(1)}px, 0)`;
      copy.style.visibility = copyProgress > 0 ? "visible" : "hidden";
      if (Math.abs(target - elapsed) > 0.1) {
        frame = window.requestAnimationFrame(render);
      } else previousTime = null;
    };
    const schedule = () => {
      const section = scene.closest<HTMLElement>("[data-home-3d-section='featured']");
      if (!section) return;
      const top = section.getBoundingClientRect().top;
      target = REVEAL_DURATION * clamp01(
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
