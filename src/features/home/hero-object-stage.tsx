"use client";

import Image from "next/image";
import { useEffect, useRef } from "react";
import type { HomeMediaContract } from "@/content/homepage-media";
import type { HeroModelPresentation } from "./hero-model-config";

type HeroObjectStageProps = Readonly<{
  media: HomeMediaContract;
  presentation: HeroModelPresentation;
}>;

type NetworkInformationLike = {
  saveData?: boolean;
  effectiveType?: string;
};

type NavigatorWithConnection = Navigator & {
  connection?: NetworkInformationLike;
};

type IdleCapableWindow = Window & {
  requestIdleCallback?: (callback: () => void, options?: { timeout?: number }) => number;
  cancelIdleCallback?: (handle: number) => void;
};

const MODEL_VIEWER_SCRIPT_ID = "luminal-model-viewer-runtime";
const MODEL_VIEWER_SCRIPT_SRC = "https://ajax.googleapis.com/ajax/libs/model-viewer/4.3.1/model-viewer.min.js";
const HERO_IDLE_TIMEOUT_MS = 1200;
const HERO_IDLE_FALLBACK_MS = 450;

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

export function HeroObjectStage({ media, presentation }: HeroObjectStageProps) {
  const stageRef = useRef<HTMLDivElement>(null);
  const previewRef = useRef<HTMLDivElement>(null);
  const modelMountRef = useRef<HTMLDivElement>(null);
  const loaderRef = useRef<HTMLDivElement>(null);
  const errorRef = useRef<HTMLDivElement>(null);
  const viewerRef = useRef<HTMLElement | null>(null);

  useEffect(() => {
    const stage = stageRef.current;
    const preview = previewRef.current;
    const mount = modelMountRef.current;
    if (!stage || !mount || media.availability !== "available") return;

    mount.style.display = "";
    mount.style.opacity = "0";

    if (loaderRef.current) {
      loaderRef.current.style.display = "none";
      loaderRef.current.style.opacity = "0";
    }
    if (errorRef.current) errorRef.current.style.opacity = "0";

    const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const finePointer = window.matchMedia("(hover: hover) and (pointer: fine)").matches;
    const connection = (navigator as NavigatorWithConnection).connection;
    const constrainedNetwork = connection?.saveData === true
      || connection?.effectiveType === "slow-2g"
      || connection?.effectiveType === "2g";
    const posterOnly = !finePointer || constrainedNetwork;

    if (posterOnly) {
      stage.dataset.heroMode = !finePointer ? "poster-coarse-pointer" : "poster-constrained-network";
      mount.style.display = "none";
      if (preview) {
        preview.style.display = "block";
        preview.style.visibility = "visible";
        preview.style.opacity = "1";
      }
      return;
    }

    stage.dataset.heroMode = "pending-3d";
    if (preview) {
      preview.style.display = "none";
      preview.style.visibility = "hidden";
      preview.style.opacity = "0";
    }
    if (loaderRef.current) {
      loaderRef.current.style.display = "flex";
      loaderRef.current.style.opacity = "1";
    }

    let cancelled = false;
    let observer: IntersectionObserver | null = null;
    let idleHandle: number | null = null;
    let fallbackTimeout: number | null = null;

    const showError = () => {
      stage.dataset.heroMode = "3d-error";
      if (loaderRef.current) loaderRef.current.style.display = "none";
      if (errorRef.current) errorRef.current.style.opacity = "1";
      mount.style.display = "none";
      if (preview) {
        preview.style.display = "none";
        preview.style.visibility = "hidden";
      }
    };

    const mountViewer = async () => {
      try {
        stage.dataset.heroMode = "loading-3d";
        await ensureModelViewer();
        if (cancelled || viewerRef.current) return;

        const viewer = document.createElement("model-viewer");
        viewer.style.display = "block";
        viewer.style.width = "100%";
        viewer.style.height = "100%";
        viewer.style.background = "transparent";
        viewer.style.pointerEvents = "none";
        viewer.setAttribute(
          "orientation",
          `${presentation.orientation.rollDeg}deg ${presentation.orientation.pitchDeg}deg ${presentation.orientation.yawDeg}deg`,
        );
        viewer.setAttribute("src", presentation.modelSrc);
        viewer.setAttribute("alt", media.alt);
        viewer.setAttribute("loading", "eager");
        viewer.setAttribute("interaction-prompt", "none");
        viewer.setAttribute("environment-image", "neutral");
        viewer.setAttribute("shadow-intensity", String(presentation.shadowIntensity));
        viewer.setAttribute("shadow-softness", String(presentation.shadowSoftness));
        viewer.setAttribute("exposure", String(presentation.exposure));
        viewer.setAttribute("camera-orbit", `${presentation.camera.thetaDeg}deg ${presentation.camera.phiDeg}deg ${presentation.camera.radiusPercent}%`);
        viewer.setAttribute("field-of-view", `${presentation.camera.fieldOfViewDeg}deg`);
        viewer.setAttribute("min-camera-orbit", `auto auto ${presentation.camera.minRadiusPercent}%`);
        viewer.setAttribute("max-camera-orbit", `auto auto ${presentation.camera.maxRadiusPercent}%`);
        viewer.setAttribute("min-field-of-view", `${presentation.camera.minFieldOfViewDeg}deg`);
        viewer.setAttribute("max-field-of-view", `${presentation.camera.maxFieldOfViewDeg}deg`);
        viewer.setAttribute("camera-target", "auto auto auto");

        if (presentation.autoRotate && !reducedMotion) {
          viewer.setAttribute("auto-rotate", "");
          viewer.setAttribute("auto-rotate-delay", String(presentation.autoRotateDelayMs));
          viewer.setAttribute("rotation-per-second", `${presentation.rotationPerSecondDeg}deg`);
        }

        viewer.addEventListener("load", () => {
          stage.dataset.heroMode = reducedMotion ? "enhanced-static" : "enhanced-auto-rotate";
          if (loaderRef.current) {
            loaderRef.current.style.opacity = "0";
            window.setTimeout(() => {
              if (loaderRef.current) loaderRef.current.style.display = "none";
            }, 280);
          }
          if (errorRef.current) errorRef.current.style.opacity = "0";
          mount.style.opacity = "1";
        }, { once: true });

        viewer.addEventListener("error", showError, { once: true });
        mount.replaceChildren(viewer);
        viewerRef.current = viewer;
      } catch {
        showError();
      }
    };

    const scheduleMountViewer = () => {
      if (cancelled || idleHandle !== null || fallbackTimeout !== null) return;

      const idleWindow = window as IdleCapableWindow;
      if (typeof idleWindow.requestIdleCallback === "function") {
        idleHandle = idleWindow.requestIdleCallback(() => {
          idleHandle = null;
          void mountViewer();
        }, { timeout: HERO_IDLE_TIMEOUT_MS });
        return;
      }

      fallbackTimeout = window.setTimeout(() => {
        fallbackTimeout = null;
        void mountViewer();
      }, HERO_IDLE_FALLBACK_MS);
    };

    observer = new IntersectionObserver((entries) => {
      if (!entries.some((entry) => entry.isIntersecting)) return;
      observer?.disconnect();
      scheduleMountViewer();
    }, { rootMargin: "160px" });

    observer.observe(stage);

    return () => {
      cancelled = true;
      observer?.disconnect();

      const idleWindow = window as IdleCapableWindow;
      if (idleHandle !== null && typeof idleWindow.cancelIdleCallback === "function") {
        idleWindow.cancelIdleCallback(idleHandle);
      }
      if (fallbackTimeout !== null) window.clearTimeout(fallbackTimeout);

      viewerRef.current = null;
      mount.replaceChildren();
    };
  }, [media.alt, media.availability, presentation]);

  return (
    <div
      ref={stageRef}
      className="hero-object-stage group !min-h-[30rem] !overflow-visible !border-0 !bg-transparent lg:!min-h-[46rem]"
      data-hero-renderer="model-viewer"
      data-hero-interaction="auto-rotate-360"
      data-hero-mode="capability-gated"
      data-hero-tint={presentation.tint ?? "default"}
    >
      {media.availability === "available" ? (
        <>
          <div
            ref={previewRef}
            className="absolute inset-0 z-[1] overflow-hidden opacity-100 md:hidden"
            data-hero-product-image="true"
            data-hero-poster-role="constrained-fallback"
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
            style={{ background: "radial-gradient(circle, rgba(214,179,90,.075) 0%, rgba(243,230,195,.035) 34%, rgba(114,89,184,.025) 52%, rgba(0,0,0,0) 74%)" }}
            aria-hidden="true"
          />

          <div ref={loaderRef} className="absolute inset-0 z-[5] flex items-center justify-center opacity-0 transition-opacity duration-300" role="status" aria-live="polite">
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
            <span className="rounded-full border border-white/10 bg-black/55 px-3 py-2 font-mono text-[0.58rem] uppercase tracking-[0.16em] text-white/55 backdrop-blur-sm">3D preview unavailable</span>
          </div>

          <div ref={modelMountRef} className="absolute -inset-x-[9%] -inset-y-[4%] z-[2] opacity-0 transition-opacity duration-[620ms]" />
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
