"use client";
import { useCallback, useEffect, useRef } from "react";
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

type MotionState = Readonly<{
  xVw: number;
  yVh: number;
  scale: number;
  rotationDeg: number;
  orbitDeg: number;
  opacity: number;
}>;

type MotionKeyframe = MotionState & Readonly<{ scrollY: number }>;

const HERO_INTRO_MS = 1600;
const HERO_SCROLL_HANDOFF_MS = 200;
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
  const modelLayerRef = useRef<HTMLDivElement>(null);
  const startIntroRef = useRef<(() => void) | null>(null);
  const onFirstFrame = useCallback(() => startIntroRef.current?.(), []);

  useEffect(() => {
    if (!enabled) return;
    const layer = modelLayerRef.current;
    if (!layer) return;

    // Match the stage CSS: landscape tablets use the wide path, while portrait
    // touch devices keep the lower stage even at the iPad Pro's 1024px width.
    const compactMotion = window.matchMedia("(max-width: 1023px), (orientation: portrait) and (hover: none) and (pointer: coarse)");
    const portraitTabletMotion = window.matchMedia("(min-width: 700px) and (orientation: portrait) and (hover: none) and (pointer: coarse)");
    const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)");
    const hero = document.querySelector<HTMLElement>('[data-home-3d-section="hero"]');
    const light = hero?.querySelector<HTMLElement>(".hero-atmosphere");
    const copy = hero?.querySelectorAll<HTMLElement>("[data-hero-entrance]");
    const title = hero?.querySelector<HTMLElement>(".revival-hero-title");
    const details = hero?.querySelector<HTMLElement>(".revival-hero-details");
    let introStart: number | undefined;
    let finishFrom: { start: number; age: number } | undefined;
    let introAge = HERO_INTRO_MS;
    let hasScrolled = window.scrollY > 1 || Boolean(location.hash);
    const copyAnimations: Animation[] = [];

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
      if (reducedMotion.matches) {
        layer.style.removeProperty("transform");
        layer.style.removeProperty("opacity");
        layer.style.removeProperty("filter");
        return;
      }
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

      if (introAge < HERO_INTRO_MS) {
        const lightPower = smoothstep(introAge / 800);
        light?.style.setProperty("--hero-atmosphere-light", String(interpolate(0.58, 1, lightPower)));
        const reveal = smoothstep((introAge - 80) / 1080);
        const remaining = 1 - clamp01(introAge / HERO_INTRO_MS);
        const lift = finishFrom?.age === 0 ? 0 : remaining ** 3;
        y += 20 * lift;
        scale *= 1 - 0.04 * lift;
        opacity *= reveal;
        layer.style.filter = `brightness(${interpolate(0.64, 1, reveal)})`;
      } else {
        if (light?.style.getPropertyValue("--hero-atmosphere-light")) {
          light.style.setProperty("--hero-atmosphere-light", "1");
        }
        layer.style.removeProperty("filter");
      }

      layer.style.transform = `translate3d(${x.toFixed(2)}px, ${y.toFixed(2)}px, 0) scale(${scale.toFixed(4)}) rotate(${rotation.toFixed(3)}deg)`;
      layer.style.opacity = opacity.toFixed(4);

      // The actual, eased 3D position is the only signal that arms Meowhe's
      // content. Bubbles own their animation clock after this signal fires.
      const featuredDestination = motionStates.findLast((step) => step.section === "featured")?.state;
      const heroOrigin = keyframes[0]?.xVw ?? 0;
      const featuredTravel = (featuredDestination?.xVw ?? heroOrigin) - heroOrigin;
      const heroArrival = featuredTravel ? clamp01((state.xVw - heroOrigin) / featuredTravel) : 0;
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
      const center = document.documentElement.clientWidth / 2;
      const availableHalfWidth = title && details
        ? Math.min(center - title.getBoundingClientRect().right, details.getBoundingClientRect().left - center)
        : 0;
      const heroScale = availableHalfWidth > 22 && layer.offsetWidth
        ? Math.min(0.72, (availableHalfWidth - 22) * 2 / layer.offsetWidth)
        : 0.65;
      keyframes = motionStates.flatMap(({ section, anchor, viewportOffset, state }) => {
        const element = document.querySelector<HTMLElement>(`[data-home-3d-section="${section}"]`);
        if (!element) return [];
        const rect = element.getBoundingClientRect();
        const absoluteTop = rect.top + window.scrollY;
        const absoluteAnchor = anchor === "bottom" ? absoluteTop + rect.height : absoluteTop;
        const pose = section === "hero" && !compactMotion.matches
          ? { ...state, xVw: (center - layer.offsetLeft - layer.offsetWidth / 2) * 100 / window.innerWidth, yVh: -4, scale: heroScale }
          : state;
        return [{ scrollY: Math.max(0, absoluteAnchor - viewportHeight * viewportOffset), ...pose }];
      }).sort((left, right) => left.scrollY - right.scrollY);

      target = readMotionState(window.scrollY, keyframes);
      current = target;
      apply(current);
    };

    const animate = (now: number) => {
      frameHandle = null;
      if (introStart !== undefined) {
        introAge = finishFrom
          ? interpolate(finishFrom.age, HERO_INTRO_MS, smoothstep((now - finishFrom.start) / HERO_SCROLL_HANDOFF_MS))
          : Math.min(HERO_INTRO_MS, Math.max(0, now - introStart));
        if (introAge >= HERO_INTRO_MS) introStart = undefined;
      }
      const blend = reducedMotion.matches ? 1 : compactMotion.matches ? 0.16 : 0.115;
      current = {
        xVw: interpolate(current.xVw, target.xVw, blend),
        yVh: interpolate(current.yVh, target.yVh, blend),
        scale: interpolate(current.scale, target.scale, blend),
        rotationDeg: interpolate(current.rotationDeg, target.rotationDeg, blend),
        orbitDeg: interpolate(current.orbitDeg, target.orbitDeg, blend),
        opacity: interpolate(current.opacity, target.opacity, blend),
      };
      const travelling = stateDistance(current, target) > MOTION_EPSILON;
      if (!travelling) current = target;
      apply(current);

      if (introStart !== undefined || travelling) {
        frameHandle = window.requestAnimationFrame(animate);
      }
    };

    const schedule = () => {
      const scrollY = window.scrollY;
      if (scrollY !== previousScrollY) {
        scrollingUp = scrollY < previousScrollY;
        if (Math.abs(scrollY) > 1) {
          hasScrolled = true;
          if (introStart !== undefined && !finishFrom) {
            finishFrom = { start: performance.now(), age: introAge };
          }
        }
      }
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

    startIntroRef.current = () => {
      if (reducedMotion.matches || window.matchMedia("(max-width: 699px)").matches) return;
      // A cached/restored page or a fast swipe reveals the object on its live scroll pose.
      const now = performance.now();
      const alreadyMoved = hasScrolled || window.scrollY > 1 || compactMotion.matches;
      introStart = now;
      introAge = 0;
      finishFrom = alreadyMoved ? { start: now, age: 0 } : undefined;
      layer.style.opacity = "0";
      if (!alreadyMoved) {
        copy?.forEach((part, index) => {
          if (!part.animate) return;
          copyAnimations.push(part.animate(
            [{ opacity: 0.76, transform: "translateY(6px)" }, { opacity: 1, transform: "translateY(0)" }],
            { duration: 520, delay: 220 + index * 100, fill: "backwards", easing: "cubic-bezier(.2,.7,.2,1)" },
          ));
        });
      }
      schedule();
    };

    const handlePreference = () => {
      if (reducedMotion.matches) {
        introStart = undefined;
        introAge = HERO_INTRO_MS;
        copyAnimations.forEach(animation => animation.cancel());
      }
      handleResize();
    };

    rebuildKeyframes();
    schedule();
    reducedMotion.addEventListener("change", handlePreference);
    compactMotion.addEventListener("change", handleResize);
    portraitTabletMotion.addEventListener("change", handleResize);
    window.addEventListener("scroll", schedule, { passive: true });
    window.addEventListener("resize", handleResize);

    return () => {
      startIntroRef.current = null;
      if (frameHandle !== null) window.cancelAnimationFrame(frameHandle);
      copyAnimations.forEach(animation => animation.cancel());
      reducedMotion.removeEventListener("change", handlePreference);
      compactMotion.removeEventListener("change", handleResize);
      portraitTabletMotion.removeEventListener("change", handleResize);
      window.removeEventListener("scroll", schedule);
      window.removeEventListener("resize", handleResize);
      layer.style.pointerEvents = "";
      layer.style.transform = "";
      layer.style.opacity = "";
      layer.style.removeProperty("filter");
      light?.style.removeProperty("--hero-atmosphere-light");
      delete document.documentElement.dataset.luminalHeroFeaturedArrival;
    };
  }, [
    enabled,
    presentation.camera.phiDeg,
    presentation.camera.radiusPercent,
    presentation.camera.thetaDeg,
  ]);

  return (
    <>
      <HomeArrivalHeader />
      {enabled && (
        <div className={styles.experience} data-home-immersive-experience="true">
          <div ref={modelLayerRef} className={styles.modelLayer} data-home-immersive-model="true">
            <HeroObjectStage media={media} presentation={presentation} preload allowTouch3d showLoadingIndicator={false} onFirstFrame={onFirstFrame} />
          </div>
        </div>
      )}
    </>
  );
}
