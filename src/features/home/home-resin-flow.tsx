"use client";

import { useEffect, useRef } from "react";
import { getHomePhotoHandoffProgress } from "./home-photo-handoff";
import styles from "./home-resin-flow.module.css";

export function HomeResinFlow() {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    const section = canvas?.closest<HTMLElement>("[data-home-photo-handoff]");
    const context = canvas?.getContext("2d");
    if (!canvas || !section || !context) return;

    const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)");
    const clamp = (value: number) => Math.max(0, Math.min(1, value));
    let frame = 0;
    let width = 0;
    let height = 0;
    let length = 0;
    let curve: Path2D;
    let progress = -1;

    const render = () => {
      frame = 0;
      const top = section.getBoundingClientRect().top;
      const viewport = window.innerHeight;
      // A single scroll position controls both directions, even mid-transition.
      const next = reducedMotion.matches ? 1 : getHomePhotoHandoffProgress(top, viewport);
      if (next === progress) return;
      progress = next;
      const photoProgress = clamp((next - 0.42) / 0.58);
      section.style.setProperty("--photo-reveal", String(photoProgress));

      context.clearRect(0, 0, width, height);
      if (next === 0) return;
      context.setLineDash(next === 1 ? [] : [length * next, length]);
      context.stroke(curve);
    };

    const schedule = () => {
      if (!frame) frame = window.requestAnimationFrame(render);
    };

    const measure = () => {
      width = canvas.clientWidth;
      height = canvas.clientHeight;
      if (!width || !height) return;
      const ratio = Math.min(window.devicePixelRatio, 2);
      canvas.width = Math.round(width * ratio);
      canvas.height = Math.round(height * ratio);
      context.setTransform(ratio, 0, 0, ratio, 0, 0);

      // The long first crest flattens before the line sweeps past the right edge.
      // Measure the same cubic segments for a draw-on stroke with a rounded head.
      curve = new Path2D();
      const segments = [
        [0.19, 0.32, 0.31, 0.155, 0.44, 0.155],
        [0.65, 0.155, 0.78, 0.69, 0.96, 0.59],
        [1.04, 0.546, 1.085, 0.58, 1.12, 0.83],
      ];
      let x = 0.124;
      let y = 0.60;
      curve.moveTo(x * width, y * height);
      length = 0;
      for (const [x1, y1, x2, y2, endX, endY] of segments) {
        curve.bezierCurveTo(x1 * width, y1 * height, x2 * width, y2 * height, endX * width, endY * height);
        let previousX = x;
        let previousY = y;
        for (let step = 1; step <= 48; step++) {
          const t = step / 48;
          const u = 1 - t;
          const nextX = u ** 3 * x + 3 * u ** 2 * t * x1 + 3 * u * t ** 2 * x2 + t ** 3 * endX;
          const nextY = u ** 3 * y + 3 * u ** 2 * t * y1 + 3 * u * t ** 2 * y2 + t ** 3 * endY;
          length += Math.hypot((nextX - previousX) * width, (nextY - previousY) * height);
          previousX = nextX;
          previousY = nextY;
        }
        x = endX;
        y = endY;
      }

      const gradient = context.createLinearGradient(width * 0.12, 0, width, height * 0.4);
      gradient.addColorStop(0, "#4eddea");
      gradient.addColorStop(0.48, "#37c9dd");
      gradient.addColorStop(1, "#27a9ce");
      context.strokeStyle = gradient;
      context.lineCap = "round";
      context.lineWidth = Math.max(10, Math.min(width * 0.0225, 38));
      progress = -1;
      schedule();
    };

    measure();
    const observer = new ResizeObserver(measure);
    observer.observe(canvas);
    reducedMotion.addEventListener("change", schedule);
    window.addEventListener("scroll", schedule, { passive: true });
    return () => {
      observer.disconnect();
      reducedMotion.removeEventListener("change", schedule);
      window.removeEventListener("scroll", schedule);
      window.cancelAnimationFrame(frame);
      section.style.removeProperty("--photo-reveal");
    };
  }, []);

  return <canvas ref={canvasRef} className={styles.ribbon} data-home-resin-flow aria-hidden="true" />;
}
