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

    type ContentPhase = "hidden" | "revealing" | "visible" | "hiding";
    let phase: ContentPhase = "hidden";
    let frame: number | null = null;
    let lastTime: number | null = null;
    let progress = 0;
    let startProgress = 0;
    let endProgress = 0;
    let elapsed = 0;
    let duration = 1;
    let wantsVisible = false;

    // Actual eased Hero location triggers once; wheel travel never scrubs
    // individual bubble frames. Hysteresis prevents repeated trigger flapping.
    const REVEAL_AT = 0.92;
    const RETRACT_AT = 0.80;
    const REVEAL_MS = 1550;
    const RETRACT_MS = 980;

    // Independent launch point near Meowhe, calculated at mount/resize only.
    const BUBBLE_FLIGHT: Array<{ x: number; y: number }> = [];
    const measureFlight = () => {
      const rect = scene.getBoundingClientRect();
      const originX = rect.width * 0.29;
      const originY = rect.height * 0.5;
      bubbleRefs.current.forEach((bubble, index) => {
        if (!bubble) return;
        BUBBLE_FLIGHT[index] = {
          x: originX - bubble.offsetLeft - bubble.offsetWidth * 0.5,
          y: originY - bubble.offsetTop - bubble.offsetHeight * 0.5,
        };
      });
    };

    const easeOut = (value: number) => 1 - (1 - value) ** 3;
    const draw = () => {
      scene.style.setProperty("--stage-light", clamp01(progress * 1.35).toFixed(3));
      bubbleRefs.current.forEach((bubble, index) => {
        if (!bubble) return;
        // Staggered curved flight with a buoyant arc, reversible mid-flight.
        const arrival = clamp01((progress - index * 0.075) / (0.86 - index * 0.075));
        const eased = easeOut(arrival);
        const flight = BUBBLE_FLIGHT[index] ?? { x: -120, y: 60 };
        const drift = 1 - eased;
        const arc = -Math.sin(arrival * Math.PI) * (43 + index * 13);
        const sway = Math.sin(arrival * Math.PI * 2 + index * 1.4) * 14 * Math.sin(arrival * Math.PI);
        const scale = 0.55 + eased * 0.45 + Math.sin(arrival * Math.PI) * 0.035;
        bubble.style.transform = "translate3d(" + (flight.x * drift + sway).toFixed(1) + "px, " + (flight.y * drift + arc).toFixed(1) + "px, 0) scale(" + scale.toFixed(3) + ")";
        bubble.style.opacity = clamp01(arrival / 0.22).toFixed(3);
        bubble.style.visibility = arrival > 0 ? "visible" : "hidden";
        bubble.tabIndex = arrival > 0 ? 0 : -1;
        bubble.dataset.landed = arrival >= 0.999 ? "true" : "false";
      });
      const copyProgress = clamp01((progress - 0.17) / 0.62);
      const copyEased = easeOut(copyProgress);
      copy.style.opacity = copyEased.toFixed(3);
      copy.style.transform = "translate3d(0, " + ((1 - copyEased) * 22).toFixed(1) + "px, 0)";
      copy.style.visibility = copyProgress > 0 ? "visible" : "hidden";
    };

    const animate = (now: number) => {
      frame = null;
      if (lastTime === null) lastTime = now;
      elapsed += Math.min(48, Math.max(0, now - lastTime));
      lastTime = now;
      const fraction = clamp01(elapsed / duration);
      progress = startProgress + (endProgress - startProgress) * easeOut(fraction);
      draw();
      if (fraction < 1) frame = window.requestAnimationFrame(animate);
      else {
        phase = wantsVisible ? "visible" : "hidden";
        lastTime = null;
      }
    };

    const transitionTo = (visible: boolean) => {
      if (wantsVisible === visible) return;
      wantsVisible = visible;
      phase = visible ? "revealing" : "hiding";
      startProgress = progress; // Reversals preserve the in-flight visual state.
      endProgress = visible ? 1 : 0;
      elapsed = 0;
      duration = Math.max(180, (visible ? REVEAL_MS : RETRACT_MS) * Math.abs(endProgress - startProgress));
      lastTime = null;
      if (frame === null) frame = window.requestAnimationFrame(animate);
    };

    const onHeroArrival = (event: Event) => {
      const arrival = (event as CustomEvent<{ progress?: number }>).detail?.progress;
      if (typeof arrival !== "number" || !Number.isFinite(arrival)) return;
      if (!wantsVisible && arrival >= REVEAL_AT) transitionTo(true);
      else if (wantsVisible && arrival <= RETRACT_AT) transitionTo(false);
    };

    const resize = () => { measureFlight(); draw(); };
    measureFlight();
    draw();
    // The immersive stage may mount before this listener.
    const initialArrival = Number(document.documentElement.dataset.luminalHeroFeaturedArrival);
    if (Number.isFinite(initialArrival) && initialArrival >= REVEAL_AT) transitionTo(true);
    window.addEventListener("luminal:hero-featured-arrival", onHeroArrival);
    window.addEventListener("resize", resize);
    return () => {
      if (frame !== null) window.cancelAnimationFrame(frame);
      window.removeEventListener("luminal:hero-featured-arrival", onHeroArrival);
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
            <span className={styles.floatBody}>
              <span className={styles.imageShell}>
                <Image src={colorway.src} alt={colorway.alt} fill sizes="(max-width: 700px) 38vw, 230px" style={{ objectPosition: colorway.objectPosition ?? "center" }} />
              </span>
              <span className={styles.bubbleLabel}>{colorway.colorway}</span>
            </span>
          </Link>
        ))}
      </div>

      <div ref={copyRef} className={styles.copy}>
        <h2 id="featured-title">Meet Meowhe.</h2>
        <p>A character with a past. Explore three earlier colorways: Lolipop, Mictlán, and Mono.</p>
        <Link className="text-link" href="/archive">Explore the full archive <span aria-hidden="true">↗</span></Link>
      </div>
    </div>
  );
}
