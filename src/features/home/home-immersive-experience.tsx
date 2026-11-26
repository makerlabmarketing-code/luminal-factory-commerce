"use client";
import { useTranslator } from "@/lib/i18n/client";


import Image from "next/image";
import { useCallback, useEffect, useRef, useState } from "react";
import type { HomeMediaContract } from "@/content/homepage-media";
import type { HeroModelPresentation } from "./hero-model-config";
import { HeroObjectStage } from "./hero-object-stage";
import { HomeArrivalHeader } from "./home-arrival-header";
import { galleryEntryViewportRatio, getGalleryCoverWidth, getGalleryHeroPose, getGalleryProgress } from "./home-gallery-motion";
import { getHeroPhotoMotion } from "./home-photo-handoff";
import styles from "./home-immersive-experience.module.css";

type HomeImmersiveExperienceProps = Readonly<{
  media: HomeMediaContract;
  presentation: HeroModelPresentation;
  enabled: boolean;
}>;

type IntroPhase = "pending" | "loading" | "docking" | "done";

type MotionState = Readonly<{
  xVw: number;
  yVh: number;
  scale: number;
  rotationDeg: number;
  orbitDeg: number;
  opacity: number;
}>;

type MotionKeyframe = MotionState & Readonly<{ scrollY: number }>;

const INTRO_SESSION_KEY = "luminal-home-intro-v3";
const INTRO_MINIMUM_MS = 550;
const INTRO_MAXIMUM_MS = 8000;
const LOGO_DOCK_MS = 480;
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
    state: { xVw: -49, yVh: 7, scale: 0.70, rotationDeg: -3.5, orbitDeg: -32, opacity: 1 },
  },
  {
    section: "featured",
    anchor: "bottom",
    viewportOffset: 0.98,
    state: { xVw: -49, yVh: 7, scale: 0.70, rotationDeg: -3.5, orbitDeg: -32, opacity: 1 },
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
    state: { xVw: -22, yVh: -52, scale: 0.68, rotationDeg: -3, orbitDeg: -31, opacity: 1 },
  },
  {
    section: "featured",
    anchor: "bottom",
    viewportOffset: 0.98,
    state: { xVw: -22, yVh: -52, scale: 0.68, rotationDeg: -3, orbitDeg: -31, opacity: 1 },
  },
];

const portraitTabletStates: ReadonlyArray<MotionDefinition> = [
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
    state: { xVw: -39, yVh: 0, scale: 0.80, rotationDeg: -2.5, orbitDeg: -28, opacity: 1 },
  },
  {
    section: "featured",
    anchor: "top",
    viewportOffset: 0.44,
    state: { xVw: -48, yVh: -29, scale: 0.68, rotationDeg: -3, orbitDeg: -31, opacity: 1 },
  },
  {
    section: "featured",
    anchor: "bottom",
    viewportOffset: 0.98,
    state: { xVw: -48, yVh: -29, scale: 0.68, rotationDeg: -3, orbitDeg: -31, opacity: 1 },
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
  const tr = useTranslator();
  const modelLayerRef = useRef<HTMLDivElement>(null);
  const travelBrandRef = useRef<HTMLDivElement>(null);
  const [phase, setPhase] = useState<IntroPhase>(() => enabled ? "pending" : "done");
  const objectSettled = useRef(false);
  const tryDock = useRef<(() => void) | null>(null);
  const onObjectSettled = useCallback(() => {
    objectSettled.current = true;
    tryDock.current?.();
  }, []);

  useEffect(() => {
    if (!enabled) return;

    const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)");
    const phone = window.matchMedia("(max-width: 699px)");
    let seenIntro = false;
    try {
      seenIntro = window.sessionStorage.getItem(INTRO_SESSION_KEY) === "1";
    } catch {
      // Storage may be unavailable in privacy mode.
    }

    if (reducedMotion.matches || seenIntro || phone.matches || window.scrollY > 0 || location.hash) {
      const finishFrame = window.requestAnimationFrame(() => setPhase("done"));
      return () => window.cancelAnimationFrame(finishFrame);
    }

    const root = document.documentElement;
    const previousOverflow = root.style.overflow;
    const background = Array.from(document.querySelectorAll<HTMLElement>("#main-content, footer"));
    const previousInert = background.map((item) => item.inert);
    root.style.overflow = "hidden";
    background.forEach((item) => { item.inert = true; });

    let disposed = false;
    let finished = false;
    let minimumElapsed = false;
    let dockingStarted = false;
    let brandAnimation: Animation | null = null;
    let dockFrame: number | undefined;
    const showFrame = window.requestAnimationFrame(() => {
      if (!finished && !dockingStarted) setPhase("loading");
    });

    const unlock = () => {
      root.style.overflow = previousOverflow;
      background.forEach((item, index) => { item.inert = previousInert[index]; });
    };

    const finishDock = () => {
      if (disposed || finished) return;
      finished = true;
      setPhase("done");
      unlock();
      try {
        window.sessionStorage.setItem(INTRO_SESSION_KEY, "1");
      } catch {
        // The page remains available when storage is blocked.
      }
    };

    const dockBrand = () => {
      if (disposed || finished || dockingStarted || !minimumElapsed) return;
      dockingStarted = true;
      setPhase("docking");

      dockFrame = window.requestAnimationFrame(() => {
        const traveler = travelBrandRef.current;
        const dock = document.querySelector<HTMLElement>("[data-home-logo-dock] img");
        if (!traveler || !dock || typeof traveler.animate !== "function" || phone.matches || reducedMotion.matches) {
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

    tryDock.current = () => {
      if (objectSettled.current) dockBrand();
    };
    const minimumTimer = window.setTimeout(() => {
      minimumElapsed = true;
      tryDock.current?.();
    }, INTRO_MINIMUM_MS);

    // Fail open if the 3D stage is unable to report a terminal state.
    const maximumTimer = window.setTimeout(() => {
      minimumElapsed = true;
      dockBrand();
    }, INTRO_MAXIMUM_MS);

    const exitForPreference = () => {
      if (!phone.matches && !reducedMotion.matches) return;
      brandAnimation?.cancel();
      finishDock();
    };
    phone.addEventListener("change", exitForPreference);
    reducedMotion.addEventListener("change", exitForPreference);

    return () => {
      disposed = true;
      tryDock.current = null;
      window.clearTimeout(minimumTimer);
      window.clearTimeout(maximumTimer);
      window.cancelAnimationFrame(showFrame);
      if (dockFrame !== undefined) window.cancelAnimationFrame(dockFrame);
      phone.removeEventListener("change", exitForPreference);
      reducedMotion.removeEventListener("change", exitForPreference);
      brandAnimation?.cancel();
      if (!finished) unlock();
    };
  }, [enabled]);

  useEffect(() => {
    if (!enabled) return;
    const layer = modelLayerRef.current;
    if (!layer) return;

    // Match the stage CSS: landscape tablets use the wide path, while portrait
    // touch devices keep the lower stage even at the iPad Pro's 1024px width.
    const compactMotion = window.matchMedia("(max-width: 1023px), (orientation: portrait) and (hover: none) and (pointer: coarse)");
    const portraitTabletMotion = window.matchMedia("(min-width: 700px) and (orientation: portrait) and (hover: none) and (pointer: coarse)");
    const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)");
    if (reducedMotion.matches) return;

    const selectMotionStates = () => portraitTabletMotion.matches
      ? portraitTabletStates
      : compactMotion.matches ? compactStates : desktopStates;
    let motionStates: ReadonlyArray<MotionDefinition> = selectMotionStates();
    let keyframes: MotionKeyframe[] = [];
    let frameHandle: number | null = null;
    let current: MotionState = motionStates[0].state;
    let target: MotionState = current;
    let previousScrollY = window.scrollY;
    let scrollingUp = false;

    const featuredSection = document.querySelector<HTMLElement>('[data-home-3d-section="featured"]');
    const photoChapter = document.querySelector<HTMLElement>("[data-home-photo-handoff]");
    const chapterPhoto = photoChapter?.querySelector<HTMLElement>("[data-home-chapter-photo]");
    const galleryViewport = photoChapter?.querySelector<HTMLElement>("[data-home-gallery-viewport]");

    const apply = (state: MotionState) => {
      const releaseY = featuredSection ? Math.min(0, featuredSection.getBoundingClientRect().bottom - window.innerHeight) : 0;
      const viewportWidth = window.innerWidth;
      const viewportHeight = window.innerHeight;
      let x = state.xVw * viewportWidth / 100;
      let y = state.yVh * viewportHeight / 100 + releaseY;
      let scale = state.scale;
      let rotation = state.rotationDeg;
      let opacity = state.opacity;
      let faceFront = 0;
      let galleryYaw: number | undefined;

      if (photoChapter && chapterPhoto) {
        const sectionTop = photoChapter.getBoundingClientRect().top;
        const stableHeight = galleryViewport?.offsetHeight || viewportHeight;
        const galleryProgress = getGalleryProgress(sectionTop, stableHeight);
        if (photoChapter.dataset.galleryMotion === "ready" && galleryProgress > 0) {
          const pose = getGalleryHeroPose(galleryProgress, -presentation.camera.thetaDeg);
          const coverWidth = getGalleryCoverWidth(document.documentElement.clientWidth, stableHeight);
          const coverScale = Math.min(0.49, Math.min(stableHeight, document.documentElement.clientWidth * 0.82) * 0.28 / layer.offsetHeight, coverWidth * 0.75 / layer.offsetWidth);
          const galleryCenterX = document.documentElement.clientWidth * 0.5;
          const sourceY = y - releaseY - stableHeight * (1 - galleryEntryViewportRatio);
          x = interpolate(x, galleryCenterX - layer.offsetLeft - layer.offsetWidth * 0.5, pose.travel);
          y = interpolate(sourceY, stableHeight * 0.5 - layer.offsetTop - layer.offsetHeight * 0.5, pose.travel);
          scale = interpolate(scale, coverScale, pose.travel);
          faceFront = pose.travel;
          rotation = interpolate(rotation, 0, pose.travel);
          galleryYaw = pose.yaw;
          opacity *= Number(pose.visible);
        } else {
          const motion = getHeroPhotoMotion(sectionTop, viewportHeight);
          const { travel } = motion;
          if (travel > 0) {
            const destination = chapterPhoto.getBoundingClientRect();
            x = interpolate(x, destination.left + destination.width * 0.5 - layer.offsetLeft - layer.offsetWidth * 0.5, travel);
            y = interpolate(y, destination.top + Math.min(destination.height * 0.36, 138) - layer.offsetTop - layer.offsetHeight * 0.5, travel);
            scale = interpolate(scale, 0.48, travel);
            faceFront = motion.faceFront;
            rotation = interpolate(rotation, 0, faceFront);
            opacity *= motion.opacity;
          }
        }
      }

      layer.style.transform = `translate3d(${x.toFixed(2)}px, ${y.toFixed(2)}px, 0) scale(${scale.toFixed(4)}) rotate(${rotation.toFixed(3)}deg)`;
      layer.style.opacity = opacity.toFixed(4);

      // The actual, eased 3D position is the only signal that arms Meowhe's
      // content. Bubbles own their animation clock after this signal fires.
      const featuredDestination = motionStates.findLast((step) => step.section === "featured")?.state;
      const heroArrival = featuredDestination && featuredDestination.xVw !== 0
        ? clamp01(state.xVw / featuredDestination.xVw)
        : 0;
      document.documentElement.dataset.luminalHeroFeaturedArrival = heroArrival.toFixed(4);
      // Compare the moving first/featured-section seam against an actual
      // contact point on the eased 3D stage, not the Hero's horizontal orbit.
      // The stage is measured once per travel frame, never by the bubbles.
      const featuredBoundaryTop = featuredSection?.getBoundingClientRect().top ?? Number.NEGATIVE_INFINITY;
      const modelBounds = layer.getBoundingClientRect();
      const heroContactY = modelBounds.top + modelBounds.height * 0.22;
      window.dispatchEvent(new CustomEvent("luminal:hero-featured-arrival", {
        detail: { progress: heroArrival, featuredBoundaryTop, heroContactY, scrollingUp },
      }));

      // Normalize the section transition independently of the actual orbit
      // degrees: the 2nd section mirrors the angle configured in ERP.
      const finalOrbitDeg = motionStates[motionStates.length - 1]?.state.orbitDeg ?? -32;
      const orbitProgress = finalOrbitDeg === 0
        ? 0
        : clamp01(state.orbitDeg / finalOrbitDeg);
      window.dispatchEvent(
        new CustomEvent("luminal:hero-orbit-offset", {
          detail: { orbitDeg: state.orbitDeg, orbitProgress: interpolate(orbitProgress, 0.5, faceFront), faceFront, galleryYaw },
        }),
      );
    };

    const rebuildKeyframes = () => {
      const viewportHeight = window.innerHeight;
      motionStates = selectMotionStates();
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
      const scrollY = window.scrollY;
      if (scrollY !== previousScrollY) scrollingUp = scrollY < previousScrollY;
      previousScrollY = scrollY;
      target = readMotionState(scrollY, keyframes);
      // The pointer is tracked globally by HeroObjectStage only within Hero/Meet.
      // The floating 3D layer must not intercept archive links and buttons.
      layer.style.pointerEvents = "none";
      if (frameHandle === null) frameHandle = window.requestAnimationFrame(animate);
    };

    const handleResize = () => {
      rebuildKeyframes();
      schedule();
    };

    rebuildKeyframes();
    schedule();
    compactMotion.addEventListener("change", handleResize);
    portraitTabletMotion.addEventListener("change", handleResize);
    window.addEventListener("scroll", schedule, { passive: true });
    window.addEventListener("resize", handleResize);

    return () => {
      if (frameHandle !== null) window.cancelAnimationFrame(frameHandle);
      compactMotion.removeEventListener("change", handleResize);
      portraitTabletMotion.removeEventListener("change", handleResize);
      window.removeEventListener("scroll", schedule);
      window.removeEventListener("resize", handleResize);
      layer.style.pointerEvents = "";
      layer.style.transform = "";
      layer.style.opacity = "";
      delete document.documentElement.dataset.luminalHeroFeaturedArrival;
    };
  }, [
    enabled,
    presentation.camera.phiDeg,
    presentation.camera.radiusPercent,
    presentation.camera.thetaDeg,
  ]);

  if (!enabled) return <HomeArrivalHeader />;
  const waiting = phase === "loading" || phase === "docking";

  return (
    <>
      <HomeArrivalHeader stage={waiting ? "waiting" : "revealed"} />
      <div className={styles.experience} data-home-immersive-experience="true">
        <div ref={modelLayerRef} className={styles.modelLayer} data-home-immersive-model="true">
          <HeroObjectStage media={media} presentation={presentation} preload allowTouch3d showLoadingIndicator={false} onSettled={onObjectSettled} />
        </div>
      </div>

      <noscript><style>{'[data-home-brand-intro="true"] { display: none !important; }'}</style></noscript>
      <div className={styles.introRoot} data-home-brand-intro="true" data-phase={phase} aria-hidden={phase === "done" ? "true" : undefined}>
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
          <p className={styles.loadingCopy} role="status" aria-live="polite">{tr("Preparing the object")}</p>
        </div>

        <div ref={travelBrandRef} className={styles.travelBrand} aria-hidden="true">
          <Image
            src="/brand/luminal-factory-logo-primary.png?v=gold-20261007"
            alt=""
            width={1024}
            height={1024}
            priority
            sizes="(max-width: 899px) 104px, 152px"
          />
        </div>
      </div>
    </>
  );
}
