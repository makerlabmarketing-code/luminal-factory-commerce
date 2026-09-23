"use client";

import Image from "next/image";
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

type IntroPhase = "loading" | "docking" | "done";

type MotionState = Readonly<{
  xVw: number;
  yVh: number;
  scale: number;
  rotationDeg: number;
  orbitDeg: number;
  opacity: number;
}>;

type MotionKeyframe = MotionState & Readonly<{ scrollY: number }>;

const INTRO_SESSION_KEY = "luminal-home-intro-v1";
const INTRO_MINIMUM_MS = 2100;
const INTRO_MAXIMUM_MS = 4800;
const LOGO_DOCK_MS = 1080;
const MOTION_EPSILON = 0.002;

type MotionDefinition = Readonly<{
  section: "hero" | "featured";
  anchor: "top" | "bottom";
  viewportOffset: number;
  state: MotionState;
}>;

const desktopStates: ReadonlyArray<MotionDefinition> = [
  {
    section: "hero",
    anchor: "top",
    viewportOffset: 0,
    state: { xVw: 0, yVh: 0, scale: 1, rotationDeg: 0, orbitDeg: 0, opacity: 1 },
  },
  {
    section: "featured",
    anchor: "top",
    viewportOffset: 0.52,
    state: { xVw: -39, yVh: 7, scale: 0.70, rotationDeg: -3.5, orbitDeg: -32, opacity: 1 },
  },
  {
    section: "featured",
    anchor: "bottom",
    viewportOffset: 0.34,
    state: { xVw: -40, yVh: 6, scale: 0.67, rotationDeg: -4.5, orbitDeg: -35, opacity: 0 },
  },
];

const compactStates: ReadonlyArray<MotionDefinition> = [
  {
    section: "hero",
    anchor: "top",
    viewportOffset: 0,
    state: { xVw: 0, yVh: 0, scale: 1, rotationDeg: 0, orbitDeg: 0, opacity: 1 },
  },
  {
    section: "featured",
    anchor: "top",
    viewportOffset: 0.70,
    state: { xVw: -6, yVh: -34, scale: 0.80, rotationDeg: -2.5, orbitDeg: -28, opacity: 1 },
  },
  {
    section: "featured",
    anchor: "top",
    viewportOffset: 0.44,
    state: { xVw: -6.5, yVh: -38, scale: 0.74, rotationDeg: -3, orbitDeg: -31, opacity: 1 },
  },
  {
    section: "featured",
    anchor: "top",
    viewportOffset: 0.22,
    state: { xVw: -7, yVh: -42, scale: 0.60, rotationDeg: -3.5, orbitDeg: -33, opacity: 0.42 },
  },
  {
    section: "featured",
    anchor: "bottom",
    viewportOffset: 0.96,
    state: { xVw: -7, yVh: -48, scale: 0.48, rotationDeg: -4, orbitDeg: -34, opacity: 0 },
  },
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
      orbitDeg: interpolate(from.orbitDeg, to.orbitDeg, progress),
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
    Math.abs(left.orbitDeg - right.orbitDeg) / 24,
    Math.abs(left.opacity - right.opacity),
  );
}

export function HomeImmersiveExperience({ media, presentation, enabled }: HomeImmersiveExperienceProps) {
  const modelLayerRef = useRef<HTMLDivElement>(null);
  const travelBrandRef = useRef<HTMLDivElement>(null);
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
      document.documentElement.dataset.luminalBrandDocked = "true";
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
    delete root.dataset.luminalBrandDocked;

    let disposed = false;
    let minimumElapsed = false;
    let objectReady = Boolean(root.dataset.luminalHeroObjectReady);
    let dockingStarted = false;
    let brandAnimation: Animation | null = null;

    const unlock = () => {
      body.style.overflow = previousOverflow;
      body.style.overscrollBehavior = previousOverscroll;
      delete root.dataset.luminalIntro;
    };

    const finishDock = () => {
      if (disposed) return;
      root.dataset.luminalBrandDocked = "true";
      window.dispatchEvent(new CustomEvent("luminal:brand-docked"));
      setPhase("done");
      unlock();
      try {
        window.sessionStorage.setItem(INTRO_SESSION_KEY, "1");
      } catch {
        // Storage can be unavailable in privacy modes without blocking the experience.
      }
    };

    const dockBrand = () => {
      if (disposed || dockingStarted || !minimumElapsed || !objectReady) return;
      dockingStarted = true;
      setPhase("docking");
      root.dataset.luminalIntro = "docking";

      window.requestAnimationFrame(() => {
        const traveler = travelBrandRef.current;
        const dock = document.querySelector<HTMLElement>("[data-home-logo-dock]");
        if (!traveler || !dock) {
          finishDock();
          return;
        }

        const from = traveler.getBoundingClientRect();
        const to = dock.getBoundingClientRect();
        const dx = to.left + to.width / 2 - (from.left + from.width / 2);
        const dy = to.top + to.height / 2 - (from.top + from.height / 2);
        const scale = to.width / Math.max(from.width, 1);

        brandAnimation = traveler.animate(
          [
            { transform: "translate(-50%, -50%) translate3d(0, 0, 0) scale(1)" },
            { transform: `translate(-50%, -50%) translate3d(${dx}px, ${dy}px, 0) scale(${scale})` },
          ],
          {
            duration: LOGO_DOCK_MS,
            easing: "cubic-bezier(.68, 0, .18, 1)",
            fill: "forwards",
          },
        );

        brandAnimation.addEventListener("finish", finishDock, { once: true });
        brandAnimation.addEventListener("cancel", finishDock, { once: true });
      });
    };

    const handleObjectReady = () => {
      objectReady = true;
      dockBrand();
    };

    window.addEventListener("luminal:hero-object-ready", handleObjectReady);

    const minimumTimer = window.setTimeout(() => {
      minimumElapsed = true;
      dockBrand();
    }, INTRO_MINIMUM_MS);

    const maximumTimer = window.setTimeout(() => {
      objectReady = true;
      minimumElapsed = true;
      dockBrand();
    }, INTRO_MAXIMUM_MS);

    return () => {
      disposed = true;
      window.clearTimeout(minimumTimer);
      window.clearTimeout(maximumTimer);
      window.removeEventListener("luminal:hero-object-ready", handleObjectReady);
      brandAnimation?.cancel();
      unlock();
    };
  }, [enabled]);

  useEffect(() => {
    if (!enabled) return;
    const layer = modelLayerRef.current;
    if (!layer) return;

    const compactMotion = window.matchMedia("(max-width: 1023px), (hover: none) and (pointer: coarse)");
    const interactivePointer = window.matchMedia("(hover: hover) and (pointer: fine)");
    const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)");
    if (reducedMotion.matches) return;

    let motionStates: ReadonlyArray<MotionDefinition> = compactMotion.matches ? compactStates : desktopStates;
    let keyframes: MotionKeyframe[] = [];
    let frameHandle: number | null = null;
    let current: MotionState = motionStates[0].state;
    let target: MotionState = current;

    const apply = (state: MotionState) => {
      layer.style.transform =
        `translate3d(${state.xVw.toFixed(3)}vw, ${state.yVh.toFixed(3)}vh, 0) scale(${state.scale.toFixed(4)}) rotate(${state.rotationDeg.toFixed(3)}deg)`;
      layer.style.opacity = state.opacity.toFixed(4);

      window.dispatchEvent(
        new CustomEvent("luminal:hero-orbit-offset", {
          detail: { orbitDeg: state.orbitDeg },
        }),
      );
    };

    const rebuildKeyframes = () => {
      const viewportHeight = window.innerHeight;
      motionStates = compactMotion.matches ? compactStates : desktopStates;
      keyframes = motionStates.flatMap(({ section, anchor, viewportOffset, state }) => {
        const element = document.querySelector<HTMLElement>(`[data-home-3d-section="${section}"]`);
        if (!element) return [];
        const rect = element.getBoundingClientRect();
        const absoluteTop = rect.top + window.scrollY;
        const absoluteAnchor = anchor === "bottom" ? absoluteTop + rect.height : absoluteTop;
        return [{ scrollY: Math.max(0, absoluteAnchor - viewportHeight * viewportOffset), ...state }];
      }).sort((left, right) => left.scrollY - right.scrollY);

      target = readMotionState(window.scrollY, keyframes);
      current = target;
      apply(current);
    };

    const animate = () => {
      frameHandle = null;
      const blend = compactMotion.matches ? 0.16 : 0.115;
      current = {
        xVw: interpolate(current.xVw, target.xVw, blend),
        yVh: interpolate(current.yVh, target.yVh, blend),
        scale: interpolate(current.scale, target.scale, blend),
        rotationDeg: interpolate(current.rotationDeg, target.rotationDeg, blend),
        orbitDeg: interpolate(current.orbitDeg, target.orbitDeg, blend),
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
      layer.style.pointerEvents = interactivePointer.matches && window.scrollY < featured ? "auto" : "none";
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
  }, [
    enabled,
    presentation.camera.phiDeg,
    presentation.camera.radiusPercent,
    presentation.camera.thetaDeg,
  ]);

  if (!enabled) return null;

  return (
    <div className={styles.experience} data-home-immersive-experience="true">
      <div ref={modelLayerRef} className={styles.modelLayer} data-home-immersive-model="true">
        <HeroObjectStage media={media} presentation={presentation} preload allowTouch3d />
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
          <p className={styles.loadingCopy} role="status" aria-live="polite">Preparing the object</p>
        </div>

        <div ref={travelBrandRef} className={styles.travelBrand} aria-hidden="true">
          <Image
            src="/brand/luminal-factory-logo-primary.png"
            alt=""
            width={4000}
            height={4000}
            priority
            sizes="(max-width: 899px) 104px, 152px"
          />
        </div>
      </div>
    </div>
  );
}
