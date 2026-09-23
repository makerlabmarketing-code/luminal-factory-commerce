"use client";

import Image from "next/image";
import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import type { HomeMediaContract } from "@/content/homepage-media";
import type { HeroModelPresentation } from "./hero-model-config";
import { HeroObjectStage } from "./hero-object-stage";
import styles from "./home-immersive-experience.module.css";

type HomeImmersiveExperienceProps = Readonly<{
  media: HomeMediaContract;
  presentation: HeroModelPresentation;
  enabled: boolean;
}>;

type IntroPhase = "loading" | "exiting" | "done";

type MotionState = Readonly<{
  xVw: number;
  yVh: number;
  scale: number;
  rotationDeg: number;
  opacity: number;
}>;

type MotionKeyframe = MotionState & Readonly<{ scrollY: number }>;

const INTRO_SESSION_KEY = "luminal-home-intro-v1";
const INTRO_MINIMUM_MS = 2100;
const INTRO_MAXIMUM_MS = 4800;
const INTRO_EXIT_MS = 980;
const MOTION_EPSILON = 0.002;

const desktopStates: ReadonlyArray<Readonly<{
  section: "hero" | "featured" | "revival" | "archive" | "gallery";
  viewportOffset: number;
  state: MotionState;
}>> = [
  { section: "hero", viewportOffset: 0, state: { xVw: 0, yVh: 0, scale: 1, rotationDeg: 0, opacity: 1 } },
  { section: "featured", viewportOffset: 0.52, state: { xVw: -27, yVh: 11, scale: 0.78, rotationDeg: -7, opacity: 1 } },
  { section: "revival", viewportOffset: 0.5, state: { xVw: -5, yVh: -7, scale: 0.68, rotationDeg: 6, opacity: 0.94 } },
  { section: "archive", viewportOffset: 0.48, state: { xVw: -22, yVh: 13, scale: 0.76, rotationDeg: -4, opacity: 0.86 } },
  { section: "gallery", viewportOffset: 0.62, state: { xVw: 7, yVh: -9, scale: 0.54, rotationDeg: 7, opacity: 0 } },
];

function clamp01(value: number) {
  return Math.min(Math.max(value, 0), 1);
}

function smoothstep(value: number) {
  const clamped = clamp01(value);
  return clamped * clamped * (3 - 2 * clamped);
}

function interpolate(from: number, to: number, progress: number) {
  return from + (to - from) * progress;
}

function readMotionState(scrollY: number, keyframes: readonly MotionKeyframe[]): MotionState {
  if (!keyframes.length) return desktopStates[0].state;
  if (scrollY <= keyframes[0].scrollY) return keyframes[0];

  for (let index = 0; index < keyframes.length - 1; index += 1) {
    const from = keyframes[index];
    const to = keyframes[index + 1];
    if (scrollY > to.scrollY) continue;
    const span = Math.max(to.scrollY - from.scrollY, 1);
    const progress = smoothstep((scrollY - from.scrollY) / span);
    return {
      xVw: interpolate(from.xVw, to.xVw, progress),
      yVh: interpolate(from.yVh, to.yVh, progress),
      scale: interpolate(from.scale, to.scale, progress),
      rotationDeg: interpolate(from.rotationDeg, to.rotationDeg, progress),
      opacity: interpolate(from.opacity, to.opacity, progress),
    };
  }

  return keyframes[keyframes.length - 1];
}

function stateDistance(left: MotionState, right: MotionState) {
  return Math.max(
    Math.abs(left.xVw - right.xVw) / 30,
    Math.abs(left.yVh - right.yVh) / 20,
    Math.abs(left.scale - right.scale),
    Math.abs(left.rotationDeg - right.rotationDeg) / 10,
    Math.abs(left.opacity - right.opacity),
  );
}

export function HomeImmersiveExperience({ media, presentation, enabled }: HomeImmersiveExperienceProps) {
  const modelLayerRef = useRef<HTMLDivElement>(null);
  const [phase, setPhase] = useState<IntroPhase>("loading");

  useEffect(() => {
    if (!enabled) {
      setPhase("done");
      return;
    }

    const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    let seenIntro = false;
    try {
      seenIntro = window.sessionStorage.getItem(INTRO_SESSION_KEY) === "1";
    } catch {
      seenIntro = false;
    }

    if (reducedMotion || seenIntro) {
      setPhase("done");
      return;
    }

    const root = document.documentElement;
    const body = document.body;
    const previousOverflow = body.style.overflow;
    const previousOverscroll = body.style.overscrollBehavior;
    body.style.overflow = "hidden";
    body.style.overscrollBehavior = "none";
    root.dataset.luminalIntro = "loading";

    let disposed = false;
    let minimumElapsed = false;
    let objectReady = Boolean(root.dataset.luminalHeroObjectReady);
    let exitStarted = false;
    let exitTimer: number | null = null;

    const unlock = () => {
      body.style.overflow = previousOverflow;
      body.style.overscrollBehavior = previousOverscroll;
      delete root.dataset.luminalIntro;
    };

    const completeExit = () => {
      if (disposed) return;
      setPhase("done");
      unlock();
      try {
        window.sessionStorage.setItem(INTRO_SESSION_KEY, "1");
      } catch {
        // Storage may be unavailable in privacy modes; the intro still completes safely.
      }
    };

    const maybeExit = () => {
      if (disposed || exitStarted || !minimumElapsed || !objectReady) return;
      exitStarted = true;
      setPhase("exiting");
      root.dataset.luminalIntro = "exiting";
      exitTimer = window.setTimeout(completeExit, INTRO_EXIT_MS);
    };

    const handleObjectReady = () => {
      objectReady = true;
      maybeExit();
    };

    window.addEventListener("luminal:hero-object-ready", handleObjectReady);

    const minimumTimer = window.setTimeout(() => {
      minimumElapsed = true;
      maybeExit();
    }, INTRO_MINIMUM_MS);

    const maximumTimer = window.setTimeout(() => {
      objectReady = true;
      minimumElapsed = true;
      maybeExit();
    }, INTRO_MAXIMUM_MS);

    return () => {
      disposed = true;
      window.clearTimeout(minimumTimer);
      window.clearTimeout(maximumTimer);
      if (exitTimer !== null) window.clearTimeout(exitTimer);
      window.removeEventListener("luminal:hero-object-ready", handleObjectReady);
      unlock();
    };
  }, [enabled]);

  useEffect(() => {
    if (!enabled) return;
    const layer = modelLayerRef.current;
    if (!layer) return;

    const desktopMotion = window.matchMedia("(min-width: 900px) and (hover: hover) and (pointer: fine)");
    const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)");
    if (!desktopMotion.matches || reducedMotion.matches) return;

    let keyframes: MotionKeyframe[] = [];
    let frameHandle: number | null = null;
    let current: MotionState = desktopStates[0].state;
    let target: MotionState = current;

    const apply = (state: MotionState) => {
      layer.style.transform =
        `translate3d(${state.xVw.toFixed(3)}vw, ${state.yVh.toFixed(3)}vh, 0) scale(${state.scale.toFixed(4)}) rotate(${state.rotationDeg.toFixed(3)}deg)`;
      layer.style.opacity = state.opacity.toFixed(4);
    };

    const rebuildKeyframes = () => {
      const viewportHeight = window.innerHeight;
      keyframes = desktopStates.flatMap(({ section, viewportOffset, state }) => {
        const element = document.querySelector<HTMLElement>(`[data-home-3d-section="${section}"]`);
        if (!element) return [];
        const absoluteTop = element.getBoundingClientRect().top + window.scrollY;
        return [{ scrollY: Math.max(0, absoluteTop - viewportHeight * viewportOffset), ...state }];
      }).sort((left, right) => left.scrollY - right.scrollY);

      target = readMotionState(window.scrollY, keyframes);
      current = target;
      apply(current);
    };

    const animate = () => {
      frameHandle = null;
      const blend = 0.14;
      current = {
        xVw: interpolate(current.xVw, target.xVw, blend),
        yVh: interpolate(current.yVh, target.yVh, blend),
        scale: interpolate(current.scale, target.scale, blend),
        rotationDeg: interpolate(current.rotationDeg, target.rotationDeg, blend),
        opacity: interpolate(current.opacity, target.opacity, blend),
      };
      apply(current);

      if (stateDistance(current, target) > MOTION_EPSILON) {
        frameHandle = window.requestAnimationFrame(animate);
      }
    };

    const schedule = () => {
      target = readMotionState(window.scrollY, keyframes);
      const featured = keyframes[1]?.scrollY ?? window.innerHeight;
      layer.style.pointerEvents = window.scrollY < featured ? "auto" : "none";
      if (frameHandle === null) frameHandle = window.requestAnimationFrame(animate);
    };

    const handleResize = () => {
      rebuildKeyframes();
      schedule();
    };

    rebuildKeyframes();
    window.addEventListener("scroll", schedule, { passive: true });
    window.addEventListener("resize", handleResize);

    return () => {
      if (frameHandle !== null) window.cancelAnimationFrame(frameHandle);
      window.removeEventListener("scroll", schedule);
      window.removeEventListener("resize", handleResize);
      layer.style.pointerEvents = "";
      layer.style.transform = "";
      layer.style.opacity = "";
    };
  }, [enabled]);

  if (!enabled) {
    return <HeroObjectStage media={media} presentation={presentation} />;
  }

  return (
    <div className={styles.experience} data-home-immersive-experience="true">
      <div className={styles.reserve} aria-hidden="true" />

      <div
        ref={modelLayerRef}
        className={styles.modelLayer}
        data-home-immersive-model="true"
      >
        <HeroObjectStage media={media} presentation={presentation} preload />
      </div>

      <div className={styles.introRoot} data-phase={phase} aria-hidden={phase === "done" ? "true" : undefined}>
        <div className={styles.veil}>
          <div className={styles.progress} aria-hidden="true"><span /></div>
          <div className={styles.blueprint} aria-hidden="true">
            <i className={styles.ringOuter} />
            <i className={styles.ringInner} />
            <i className={styles.axisHorizontal} />
            <i className={styles.axisVertical} />
            <i className={styles.diamondOne} />
            <i className={styles.diamondTwo} />
          </div>
          <p className={styles.loadingCopy} role="status" aria-live="polite">
            Preparing the object
          </p>
        </div>

        <Link className={styles.travelBrand} href="/" aria-label="Luminal Factory">
          <Image
            src="/brand/luminal-factory-logo-primary.png"
            alt=""
            width={4000}
            height={4000}
            priority
            sizes="(max-width: 899px) 72px, 144px"
          />
        </Link>
      </div>
    </div>
  );
}
