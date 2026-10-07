"use client";

import { useEffect, useRef, type CSSProperties, type ReactNode, type PointerEvent } from "react";
import { cn } from "@/lib/utils";
import styles from "./spotlight-card.module.css";

export interface GlowCardProps {
  children?: ReactNode;
  className?: string;
  glowColor?: "blue" | "purple" | "green" | "red" | "orange";
  size?: "sm" | "md" | "lg";
  width?: string | number;
  height?: string | number;
  customSize?: boolean;
}
const colors = { blue: 220, purple: 280, green: 120, red: 0, orange: 30 };
const sizes = { sm: "w-48 h-64", md: "w-64 h-80", lg: "w-80 h-96" };
type GlowStyle = CSSProperties & { "--glow-hue": number };

// Adapted from the owner's Spotlight Card reference: local coordinates and scoped CSS.
export function GlowCard({ children, className, glowColor = "blue", size = "md", width, height, customSize = false }: GlowCardProps) {
  const cardRef = useRef<HTMLDivElement>(null);
  const frameRef = useRef(0);
  const motionAllowed = useRef(false);
  useEffect(() => {
    const query = window.matchMedia("(prefers-reduced-motion: reduce)");
    const sync = () => {
      motionAllowed.current = !query.matches;
      if (query.matches) cardRef.current?.removeAttribute("data-active");
    };
    sync(); query.addEventListener("change", sync);
    return () => { query.removeEventListener("change", sync); cancelAnimationFrame(frameRef.current); };
  }, []);
  const move = (event: PointerEvent<HTMLDivElement>) => {
    if (!motionAllowed.current || event.pointerType === "touch") return;
    const bounds = event.currentTarget.getBoundingClientRect();
    const x = event.clientX - bounds.left;
    const y = event.clientY - bounds.top;
    cancelAnimationFrame(frameRef.current);
    frameRef.current = requestAnimationFrame(() => {
      const card = cardRef.current;
      if (!card) return;
      card.style.setProperty("--glow-x", `${x}px`);
      card.style.setProperty("--glow-y", `${y}px`);
      card.dataset.active = "true";
    });
  };
  const leave = () => { cancelAnimationFrame(frameRef.current); cardRef.current?.removeAttribute("data-active"); };
  const style: GlowStyle = { "--glow-hue": colors[glowColor], width, height };
  return <div ref={cardRef} data-glow style={style} onPointerMove={move} onPointerLeave={leave}
    className={cn(styles.card, !customSize && sizes[size], className)}>
    <div className={styles.content}>{children}</div>
  </div>;
}
