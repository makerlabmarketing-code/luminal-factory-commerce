"use client";

import Image from "next/image";
import { useEffect, useRef } from "react";
import type { HomeMediaContract } from "@/content/homepage-media";
import type { HeroModelPresentation } from "./hero-model-config";

type HeroObjectStageProps = Readonly<{
  media: HomeMediaContract;
  presentation: HeroModelPresentation;
}>;

type PointerPosition = {
  x: number;
  y: number;
};

const MODEL_VIEWER_SCRIPT_ID = "luminal-model-viewer-runtime";
const MODEL_VIEWER_SCRIPT_SRC = "https://ajax.googleapis.com/ajax/libs/model-viewer/4.3.1/model-viewer.min.js";
const POINTER_THETA_RANGE_DEG = 4;
const POINTER_PHI_RANGE_DEG = 2.4;
const POINTER_EASE = 0.1;

function ensureModelViewer() {
  if (window.customElements.get("model-viewer")) return Promise.resolve();

  return new Promise<void>((resolve, reject) => {
    const existingScript = document.getElementById(MODEL_VIEWER_SCRIPT_ID);
    const resolveWhenReady = () => {
      window.customElements.whenDefined("model-viewer").then(() => resolve()).catch(reject);
    };

    if (existingScript instanceof HTMLScriptElement) {
      existingScript.addEventListener("load", resolveWhenReady, { once: true });
      existingScript.addEventListener("error", () => reject(new Error("Model Viewer failed to load.")), { once: true });
      resolveWhenReady();
      return;
    }

    const script = document.createElement("script");
    script.id = MODEL_VIEWER_SCRIPT_ID;
    script.type = "module";
    script.src = MODEL_VIEWER_SCRIPT_SRC;
    script.addEventListener("load", resolveWhenReady, { once: true });
    script.addEventListener("error", () => reject(new Error("Model Viewer failed to load.")), { once: true });
    document.head.appendChild(script);
  });
}

function clamp(value: number, min: number, max: number) {
  return Math.min(Math.max(value, min), max);
}

export function HeroObjectStage({ media, presentation }: HeroObjectStageProps) {
  const stageRef = useRef<HTMLDivElement>(null);
  const previewRef = useRef<HTMLDivElement>(null);
  const modelMountRef = useRef<HTMLDivElement>(null);
  const loaderRef = useRef<HTMLDivElement>(null);
  const errorRef = useRef<HTMLDivElement>(null);
  const noteRef = useRef<HTMLSpanElement>(null);
  const lensRef = useRef<HTMLDivElement>(null);
  const reactiveLightRef = useRef<HTMLDivElement>(null);
  const viewerRef = useRef<HTMLElement | null>(null);
  const radiusRef = useRef(presentation.camera.radiusPercent);
  const introFrameRef = useRef<number | null>(null);
  const interactionFrameRef = useRef<number | null>(null);
  const modelReadyRef = useRef(false);
  const pointerTargetRef = useRef<PointerPosition>({ x: 0, y: 0 });
  const pointerCurrentRef = useRef<PointerPosition>({ x: 0, y: 0 });

  useEffect(() => {
    const stage = stageRef.current;
    const preview = previewRef.current;
    const mount = modelMountRef.current;
    if (!stage || !mount || media.availability !== "available") return;

    mount.style.display = "";
    mount.style.opacity = "0";
    modelReadyRef.current = false;
    pointerTargetRef.current = { x: 0, y: 0 };
    pointerCurrentRef.current = { x: 0, y: 0 };

    if (preview) {
      preview.style.opacity = "1";
      preview.style.visibility = "visible";
    }

    const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const finePointer = window.matchMedia("(hover: hover) and (pointer: fine)").matches;
    let cancelled = false;
    let observer: IntersectionObserver | null = null;
    let visibilityObserver: IntersectionObserver | null = null;

    const applyCamera = (pointer = pointerCurrentRef.current) => {
      const theta = presentation.camera.thetaDeg + pointer.x * POINTER_THETA_RANGE_DEG;
      const phi = presentation.camera.phiDeg - pointer.y * POINTER_PHI_RANGE_DEG;
      viewerRef.current?.setAttribute(
        "camera-orbit",
        `${theta.toFixed(2)}deg ${phi.toFixed(2)}deg ${radiusRef.current}%`,
      );
    };

    const updateOpticalLayers = (pointer: PointerPosition) => {
      const xPercent = clamp((pointer.x + 1) * 50, 0, 100);
      const yPercent = clamp((pointer.y + 1) * 50, 0, 100);

      if (reactiveLightRef.current) {
        reactiveLightRef.current.style.background = `radial-gradient(circle at ${xPercent}% ${yPercent}%, rgba(214,179,90,.18) 0%, rgba(114,89,184,.07) 25%, rgba(5,5,5,0) 58%)`;
      }

      if (lensRef.current) {
        lensRef.current.style.left = `${xPercent}%`;
        lensRef.current.style.top = `${yPercent}%`;
      }
    };

    const animateInteraction = () => {
      interactionFrameRef.current = null;
      if (cancelled || reducedMotion || !finePointer) return;

      const current = pointerCurrentRef.current;
      const target = pointerTargetRef.current;
      current.x += (target.x - current.x) * POINTER_EASE;
      current.y += (target.y - current.y) * POINTER_EASE;

      applyCamera(current);
      updateOpticalLayers(current);

      const unsettled = Math.abs(target.x - current.x) > 0.002 || Math.abs(target.y - current.y) > 0.002;
      if (unsettled) interactionFrameRef.current = window.requestAnimationFrame(animateInteraction);
    };

    const scheduleInteraction = () => {
      if (interactionFrameRef.current !== null || reducedMotion || !finePointer) return;
      interactionFrameRef.current = window.requestAnimationFrame(animateInteraction);
    };

    const onPointerMove = (event: PointerEvent) => {
      const bounds = stage.getBoundingClientRect();
      if (!bounds.width || !bounds.height) return;

      pointerTargetRef.current = {
        x: clamp(((event.clientX - bounds.left) / bounds.width) * 2 - 1, -1, 1),
        y: clamp(((event.clientY - bounds.top) / bounds.height) * 2 - 1, -1, 1),
      };

      if (modelReadyRef.current && lensRef.current) lensRef.current.style.opacity = "1";
      scheduleInteraction();
    };

    const onPointerLeave = () => {
      pointerTargetRef.current = { x: 0, y: 0 };
      if (lensRef.current) lensRef.current.style.opacity = "0";
      scheduleInteraction();
    };

    if (finePointer && !reducedMotion) {
      stage.addEventListener("pointermove", onPointerMove, { passive: true });
      stage.addEventListener("pointerleave", onPointerLeave, { passive: true });
    }

    const showError = () => {
      modelReadyRef.current = false;
      if (loaderRef.current) loaderRef.current.style.display = "none";
      if (errorRef.current) errorRef.current.style.opacity = "1";
      if (lensRef.current) lensRef.current.style.opacity = "0";
      mount.style.display = "none";
      if (preview) {
        preview.style.opacity = "1";
        preview.style.visibility = "visible";
      }
    };

    const mountViewer = async () => {
      try {
        await ensureModelViewer();
        if (cancelled || viewerRef.current) return;

        const viewer = document.createElement("model-viewer");
        viewer.style.display = "block";
        viewer.style.width = "100%";
        viewer.style.height = "100%";
        viewer.style.background = "transparent";
        viewer.style.pointerEvents = "none";
        viewer.setAttribute("src", presentation.modelSrc);
        viewer.setAttribute("alt", media.alt);
        viewer.setAttribute("loading", "eager");
        viewer.setAttribute("interaction-prompt", "none");
        viewer.setAttribute("environment-image", "neutral");
        viewer.setAttribute("shadow-intensity", String(presentation.shadowIntensity));
        viewer.setAttribute("shadow-softness", String(presentation.shadowSoftness));
        viewer.setAttribute("exposure", String(presentation.exposure));
        viewer.setAttribute("field-of-view", `${presentation.camera.fieldOfViewDeg}deg`);
        viewer.setAttribute("min-camera-orbit", `auto auto ${presentation.camera.minRadiusPercent}%`);
        viewer.setAttribute("max-camera-orbit", `auto auto ${presentation.camera.maxRadiusPercent}%`);
        viewer.setAttribute("min-field-of-view", `${presentation.camera.minFieldOfViewDeg}deg`);
        viewer.setAttribute("max-field-of-view", `${presentation.camera.maxFieldOfViewDeg}deg`);
        viewer.setAttribute("camera-target", "auto auto auto");

        const useSimplifiedIdleMotion = !reducedMotion && !finePointer && presentation.autoRotate;
        if (useSimplifiedIdleMotion) {
          viewer.setAttribute("auto-rotate", "");
          viewer.setAttribute("auto-rotate-delay", String(presentation.autoRotateDelayMs));
          viewer.setAttribute("rotation-per-second", `${presentation.rotationPerSecondDeg}deg`);
        }

        radiusRef.current = reducedMotion ? presentation.camera.radiusPercent : presentation.camera.introRadiusPercent;
        applyCamera();

        viewer.addEventListener("load", () => {
          modelReadyRef.current = true;
          if (loaderRef.current) {
            loaderRef.current.style.opacity = "0";
            window.setTimeout(() => {
              if (loaderRef.current) loaderRef.current.style.display = "none";
            }, 320);
          }
          mount.style.opacity = "1";
          if (preview) {
            preview.style.opacity = "0";
            window.setTimeout(() => {
              if (!cancelled && previewRef.current) previewRef.current.style.visibility = "hidden";
            }, 620);
          }
          if (noteRef.current && finePointer && !reducedMotion) noteRef.current.style.opacity = "1";

          if (reducedMotion) {
            radiusRef.current = presentation.camera.radiusPercent;
            applyCamera({ x: 0, y: 0 });
            return;
          }

          const startedAt = performance.now();
          const duration = 1450;
          const zoomIn = (now: number) => {
            if (cancelled) return;
            const progress = clamp((now - startedAt) / duration, 0, 1);
            const eased = 1 - Math.pow(1 - progress, 3);
            radiusRef.current = presentation.camera.introRadiusPercent + (presentation.camera.radiusPercent - presentation.camera.introRadiusPercent) * eased;
            applyCamera();
            if (progress < 1) introFrameRef.current = window.requestAnimationFrame(zoomIn);
          };

          introFrameRef.current = window.requestAnimationFrame(zoomIn);
        }, { once: true });

        viewer.addEventListener("error", showError, { once: true });
        mount.replaceChildren(viewer);
        viewerRef.current = viewer;

        if (useSimplifiedIdleMotion) {
          visibilityObserver = new IntersectionObserver((entries) => {
            const visible = entries.some((entry) => entry.isIntersecting && entry.intersectionRatio > 0.05);
            if (visible) viewer.setAttribute("auto-rotate", "");
            else viewer.removeAttribute("auto-rotate");
          }, { threshold: [0, 0.05] });
          visibilityObserver.observe(stage);
        }
      } catch {
        showError();
      }
    };

    observer = new IntersectionObserver((entries) => {
      if (!entries.some((entry) => entry.isIntersecting)) return;
      observer?.disconnect();
      void mountViewer();
    }, { rootMargin: "280px" });

    observer.observe(stage);

    return () => {
      cancelled = true;
      modelReadyRef.current = false;
      observer?.disconnect();
      visibilityObserver?.disconnect();
      stage.removeEventListener("pointermove", onPointerMove);
      stage.removeEventListener("pointerleave", onPointerLeave);
      if (introFrameRef.current !== null) window.cancelAnimationFrame(introFrameRef.current);
      if (interactionFrameRef.current !== null) window.cancelAnimationFrame(interactionFrameRef.current);
      viewerRef.current = null;
      mount.replaceChildren();
    };
  }, [media.alt, media.availability, presentation]);

  return (
    <div
      ref={stageRef}
      className="hero-object-stage group !min-h-[30rem] !overflow-visible !border-0 !bg-transparent lg:!min-h-[46rem]"
      data-hero-renderer="model-viewer"
      data-hero-interaction="pointer-orbit-fluid-lens"
      data-hero-tint={presentation.tint ?? "default"}
    >
      {media.availability === "available" ? (
        <>
          <div
            ref={previewRef}
            className="absolute inset-0 z-[1] overflow-hidden opacity-100 transition-[opacity,visibility] duration-500 motion-reduce:transition-none"
            data-hero-product-image="true"
            style={{
              WebkitMaskImage: "radial-gradient(ellipse 94% 86% at 54% 49%, #000 58%, transparent 100%)",
              maskImage: "radial-gradient(ellipse 94% 86% at 54% 49%, #000 58%, transparent 100%)",
            }}
          >
            <Image
              className="home-product-image hero-product-image"
              src={media.src}
              alt={media.alt}
              fill
              preload
              sizes={media.sizes}
              style={{ objectPosition: media.objectPosition }}
            />
          </div>

          <div
            className="pointer-events-none absolute inset-[1%] z-[1] rounded-full opacity-55 blur-3xl"
            style={{ background: "radial-gradient(circle, rgba(214,179,90,.14) 0%, rgba(114,89,184,.055) 38%, rgba(0,0,0,0) 72%)" }}
            aria-hidden="true"
          />

          <div
            ref={reactiveLightRef}
            className="pointer-events-none absolute -inset-[8%] z-[3] opacity-80 transition-opacity duration-300 motion-reduce:hidden"
            style={{ background: "radial-gradient(circle at 50% 50%, rgba(214,179,90,.18) 0%, rgba(114,89,184,.07) 25%, rgba(5,5,5,0) 58%)" }}
            aria-hidden="true"
          />

          <div ref={loaderRef} className="absolute inset-0 z-[5] flex items-center justify-center transition-opacity duration-300" role="status" aria-live="polite">
            <div className="flex flex-col items-center gap-4">
              <div className="relative size-14" aria-hidden="true">
                <span className="absolute inset-0 rounded-full border border-white/10" />
                <span className="absolute inset-0 animate-spin rounded-full border border-transparent border-t-white/80 border-r-white/25 motion-reduce:animate-none" />
                <span className="absolute inset-[9px] rounded-full border border-white/15 motion-safe:animate-pulse" />
                <span className="absolute inset-[21px] rounded-full bg-white/75 shadow-[0_0_18px_rgba(255,255,255,0.35)]" />
              </div>
              <span className="font-mono text-[0.58rem] uppercase tracking-[0.18em] text-white/45">Loading 3D object</span>
            </div>
          </div>

          <div ref={errorRef} className="pointer-events-none absolute inset-0 z-[4] flex items-center justify-center opacity-0 transition-opacity duration-300" role="status">
            <span className="rounded-full border border-white/10 bg-black/55 px-3 py-2 font-mono text-[0.58rem] uppercase tracking-[0.16em] text-white/55 backdrop-blur-sm">3D preview unavailable · Product image active</span>
          </div>

          <div ref={modelMountRef} className="absolute -inset-x-[9%] -inset-y-[4%] z-[2] opacity-0 transition-opacity duration-[620ms]" />

          <div
            ref={lensRef}
            data-hero-lens="fluid-glass"
            className="pointer-events-none absolute z-[4] hidden aspect-square w-[clamp(7.5rem,11vw,10rem)] -translate-x-1/2 -translate-y-1/2 rounded-full border border-white/20 opacity-0 shadow-[0_1.5rem_5rem_rgba(0,0,0,.35),inset_0_0_2rem_rgba(255,255,255,.08)] transition-opacity duration-200 md:block motion-reduce:hidden"
            style={{
              left: "50%",
              top: "50%",
              background: "radial-gradient(circle at 32% 24%, rgba(255,255,255,.16), rgba(214,179,90,.055) 28%, rgba(114,89,184,.05) 56%, rgba(5,5,5,.08) 100%)",
              backdropFilter: "blur(2px) brightness(1.16) contrast(1.1) saturate(1.08)",
              WebkitBackdropFilter: "blur(2px) brightness(1.16) contrast(1.1) saturate(1.08)",
            }}
            aria-hidden="true"
          >
            <span className="absolute inset-[9%] rounded-full border border-white/10" />
            <span className="absolute left-[20%] top-[15%] h-[22%] w-[35%] rotate-[-28deg] rounded-full bg-white/15 blur-md" />
          </div>

          <span ref={noteRef} className="pointer-events-none absolute bottom-4 right-4 z-[5] hidden font-mono text-[0.58rem] uppercase tracking-[0.14em] text-white/42 opacity-0 transition-opacity duration-300 md:block motion-reduce:hidden" aria-hidden="true">Move to explore</span>
        </>
      ) : (
        <>
          <span className="hero-object-silhouette" aria-hidden="true" />
          <p className="home-media-pending">{media.alt}<br /><span>Approved product media pending sync</span></p>
        </>
      )}
      <div className="hero-object-vignette pointer-events-none z-[3]" aria-hidden="true" />
    </div>
  );
}
