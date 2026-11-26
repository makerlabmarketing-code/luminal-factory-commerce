"use client";

import { useEffect, useRef } from "react";
import { getHomePhotoHandoffProgress } from "./home-photo-handoff";
import styles from "./home-resin-flow.module.css";

const paths = {
  entry: {
    start: [0.025, 0.025],
    segments: [
      [0.10, 0.03, 0.12, 0.42, 0.33, 0.43],
      [0.54, 0.44, 0.59, 0.12, 0.45, 0.13],
      [0.29, 0.14, 0.34, 0.55, 0.56, 0.55],
      [0.72, 0.55, 0.78, 0.54, 0.71, 0.79],
      [0.68, 0.89, 0.64, 0.92, 0.60, 0.96],
    ],
  },
  exit: {
    start: [1.04, 0.20],
    segments: [
      [0.90, 0.66, 0.78, 0.84, 0.61, 0.77],
      [0.43, 0.70, 0.39, 0.22, 0.24, 0.26],
      [0.12, 0.29, 0.06, 0.61, -0.04, 0.69],
    ],
  },
} as const;

type ResinFlowDirection = keyof typeof paths;

export function HomeResinFlow({ direction }: Readonly<{ direction: ResinFlowDirection }>) {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    const chapter = canvas?.closest<HTMLElement>("[data-home-photo-handoff]");
    const context = canvas?.getContext("2d");
    if (!canvas || !chapter || !context) return;

    const isEntry = direction === "entry";

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
      const top = (isEntry ? chapter : canvas).getBoundingClientRect().top;
      const viewport = window.innerHeight;
      // A single scroll position controls both directions, even mid-transition.
      const next = reducedMotion.matches ? 1 : isEntry
        ? getHomePhotoHandoffProgress(top, viewport)
        : clamp((viewport * 0.92 - top) / (viewport * 0.38));
      if (next === progress) return;
      progress = next;
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

      // Both paths use distances in the rendered aspect ratio, including on phones.
      curve = new Path2D();
      const { start, segments } = paths[direction];
      let [x, y]: [number, number] = [...start];
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
    };
  }, [direction]);

  return <canvas ref={canvasRef} className={styles.ribbon} data-home-resin-flow={direction} aria-hidden="true" />;
}
