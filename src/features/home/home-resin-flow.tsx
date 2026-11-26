"use client";

import { useEffect, useRef } from "react";
import styles from "./home-resin-flow.module.css";

export function HomeResinFlow({ reverse = false }: Readonly<{ reverse?: boolean }>) {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    const context = canvas?.getContext("2d");
    if (!canvas || !context) return;

    const draw = () => {
      const width = canvas.clientWidth;
      const height = canvas.clientHeight;
      if (!width || !height) return;
      const ratio = Math.min(window.devicePixelRatio || 1, 2);
      canvas.width = Math.round(width * ratio);
      canvas.height = Math.round(height * ratio);
      context.setTransform(reverse ? -ratio : ratio, 0, 0, ratio, reverse ? width * ratio : 0, 0);

      const ribbon = context.createLinearGradient(0, 0, width, 0);
      ribbon.addColorStop(0, "#176764");
      ribbon.addColorStop(0.36, "#65e4c3");
      ribbon.addColorStop(0.64, "#27a292");
      ribbon.addColorStop(0.87, "#226972");
      ribbon.addColorStop(1, "#86764a");

      context.beginPath();
      context.moveTo(width * 0.035, height * 0.79);
      context.bezierCurveTo(width * 0.15, height * 0.77, width * 0.22, height * 0.24, width * 0.39, height * 0.25);
      context.bezierCurveTo(width * 0.57, height * 0.25, width * 0.61, height * 0.71, width * 0.78, height * 0.68);
      context.bezierCurveTo(width * 0.87, height * 0.67, width * 0.91, height * 0.48, width * 0.97, height * 0.4);
      const thickness = Math.max(4, Math.min(12, width * 0.008));
      context.lineCap = "round";
      context.strokeStyle = ribbon;
      context.lineWidth = thickness;
      context.shadowBlur = thickness * 1.25;
      context.shadowColor = "rgba(44, 211, 178, .27)";
      context.stroke();
    };

    draw();
    const observer = new ResizeObserver(draw);
    observer.observe(canvas);
    return () => observer.disconnect();
  }, [reverse]);

  return (
    <div className={styles.flow} data-luminal-reveal="flow" data-flow-direction={reverse ? "reverse" : "forward"} aria-hidden="true">
      <canvas ref={canvasRef} className={styles.ribbon} />
    </div>
  );
}
