"use client";

import Image from "next/image";
import { useEffect, useRef } from "react";
import type { PointerEvent } from "react";
import type { HomeMediaContract } from "@/content/homepage-media";

type HeroObjectStageProps = Readonly<{
  media: HomeMediaContract;
}>;

const HERO_MODEL_SRC = "/models/meowhe-hero.glb";
const MODEL_VIEWER_SCRIPT_ID = "luminal-model-viewer-runtime";
const MODEL_VIEWER_SCRIPT_SRC = "https://ajax.googleapis.com/ajax/libs/model-viewer/4.3.1/model-viewer.min.js";
const DEFAULT_THETA = 0;
const DEFAULT_PHI = 76;
const DEFAULT_RADIUS = 104;

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

export function HeroObjectStage({ media }: HeroObjectStageProps) {
  const stageRef = useRef<HTMLDivElement>(null);
  const modelMountRef = useRef<HTMLDivElement>(null);
  const fallbackRef = useRef<HTMLImageElement>(null);
  const noteRef = useRef<HTMLSpanElement>(null);
  const viewerRef = useRef<HTMLElement | null>(null);
  const radiusRef = useRef(DEFAULT_RADIUS);
  const introFrameRef = useRef<number | null>(null);
  const reducedMotionRef = useRef(false);

  const applyCamera = (theta = DEFAULT_THETA, phi = DEFAULT_PHI) => {
    viewerRef.current?.setAttribute("camera-orbit", `${theta}deg ${phi}deg ${radiusRef.current}%`);
  };

  useEffect(() => {
    const stage = stageRef.current;
    const mount = modelMountRef.current;
    if (!stage || !mount || media.availability !== "available") return;

    const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    reducedMotionRef.current = reducedMotion;
    if (reducedMotion) return;

    let cancelled = false;
    let observer: IntersectionObserver | null = null;

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
        viewer.setAttribute("src", HERO_MODEL_SRC);
        viewer.setAttribute("alt", "");
        viewer.setAttribute("aria-hidden", "true");
        viewer.setAttribute("loading", "eager");
        viewer.setAttribute("interaction-prompt", "none");
        viewer.setAttribute("environment-image", "neutral");
        viewer.setAttribute("shadow-intensity", "0.75");
        viewer.setAttribute("shadow-softness", "0.85");
        viewer.setAttribute("exposure", "0.92");
        viewer.setAttribute("field-of-view", "29deg");
        viewer.setAttribute("camera-target", "auto auto auto");
        radiusRef.current = 122;
        viewer.setAttribute("camera-orbit", `${DEFAULT_THETA}deg ${DEFAULT_PHI}deg ${radiusRef.current}%`);

        viewer.addEventListener("load", () => {
          mount.style.opacity = "1";
          if (fallbackRef.current) {
            fallbackRef.current.style.opacity = "0";
            fallbackRef.current.style.transform = "scale(1.035)";
          }
          if (noteRef.current) noteRef.current.style.opacity = "1";

          const startedAt = performance.now();
          const duration = 1450;
          const zoomIn = (now: number) => {
            if (cancelled) return;
            const progress = clamp((now - startedAt) / duration, 0, 1);
            const eased = 1 - Math.pow(1 - progress, 3);
            radiusRef.current = 122 + (DEFAULT_RADIUS - 122) * eased;
            applyCamera();
            if (progress < 1) introFrameRef.current = window.requestAnimationFrame(zoomIn);
          };

          introFrameRef.current = window.requestAnimationFrame(zoomIn);
        }, { once: true });

        viewer.addEventListener("error", () => {
          mount.style.display = "none";
        }, { once: true });

        mount.replaceChildren(viewer);
        viewerRef.current = viewer;
      } catch {
        mount.style.display = "none";
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
      observer?.disconnect();
      if (introFrameRef.current !== null) window.cancelAnimationFrame(introFrameRef.current);
      viewerRef.current = null;
      mount.replaceChildren();
    };
  }, [media.availability]);

  const moveCamera = (event: PointerEvent<HTMLDivElement>) => {
    if (!viewerRef.current || reducedMotionRef.current || !window.matchMedia("(hover: hover) and (pointer: fine)").matches) return;

    const bounds = event.currentTarget.getBoundingClientRect();
    const normalizedX = clamp((event.clientX - bounds.left) / Math.max(bounds.width, 1), 0, 1) - 0.5;
    const normalizedY = clamp((event.clientY - bounds.top) / Math.max(bounds.height, 1), 0, 1) - 0.5;
    applyCamera(normalizedX * 9, DEFAULT_PHI + normalizedY * 5);
  };

  const settleCamera = () => {
    if (!viewerRef.current || reducedMotionRef.current) return;
    applyCamera();
  };

  return (
    <div
      ref={stageRef}
      className="hero-object-stage group overflow-hidden [touch-action:pan-y]"
      data-hero-renderer="model-viewer"
      onPointerMove={moveCamera}
      onPointerLeave={settleCamera}
    >
      {media.availability === "available" ? (
        <>
          <Image
            ref={fallbackRef}
            className="home-product-image hero-product-image transition-[opacity,transform] duration-[420ms,900ms] ease-out motion-reduce:transition-none"
            src={media.src}
            alt={media.alt}
            fill
            priority
            sizes={media.sizes}
            style={{ objectPosition: media.objectPosition }}
          />
          <div ref={modelMountRef} className="absolute inset-0 z-[2] opacity-0 transition-opacity duration-[420ms] motion-reduce:hidden" aria-hidden="true" />
          <span ref={noteRef} className="absolute bottom-4 right-4 z-[4] hidden rounded-full border border-white/10 bg-black/50 px-3 py-2 font-mono text-[0.58rem] uppercase tracking-[0.14em] text-white/50 opacity-0 backdrop-blur-sm transition-opacity duration-300 md:block motion-reduce:hidden" aria-hidden="true">Move to shift perspective</span>
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
