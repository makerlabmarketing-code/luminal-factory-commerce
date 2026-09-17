"use client";

import Image from "next/image";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { createPortal } from "react-dom";

import type { HomeGalleryMedia } from "@/content/homepage-media";

import styles from "./home-dome-gallery.module.css";

type HomeDomeGalleryProps = Readonly<{
  items: readonly HomeGalleryMedia[];
}>;

type DomeTile = Readonly<{
  id: string;
  item: HomeGalleryMedia;
  yawDeg: number;
  pitchDeg: number;
}>;

const DOME_COLUMN_COUNT = 12;
const DOME_ROW_PITCH_DEG = [-30, 0, 30] as const;
const DOME_AUTO_ROTATE_DEG_PER_SECOND = 3;
const DOME_DRAG_DEG_PER_PIXEL = 0.12;
const DOME_MAX_PITCH_DEG = 7;
const DOME_RESUME_DELAY_MS = 600;
const DOME_DRAG_THRESHOLD_PX = 6;

function clamp(value: number, minimum: number, maximum: number) {
  return Math.min(Math.max(value, minimum), maximum);
}

function buildDomeTiles(items: readonly HomeGalleryMedia[]): readonly DomeTile[] {
  if (items.length === 0) return [];

  return DOME_ROW_PITCH_DEG.flatMap((pitchDeg, rowIndex) =>
    Array.from({ length: DOME_COLUMN_COUNT }, (_, columnIndex) => {
      const itemIndex = (columnIndex * DOME_ROW_PITCH_DEG.length + rowIndex) % items.length;
      return {
        id: `${rowIndex}-${columnIndex}-${items[itemIndex].id}`,
        item: items[itemIndex],
        yawDeg: columnIndex * (360 / DOME_COLUMN_COUNT),
        pitchDeg,
      };
    }),
  );
}

export function HomeDomeGallery({ items }: HomeDomeGalleryProps) {
  const rootRef = useRef<HTMLDivElement>(null);
  const sphereRef = useRef<HTMLDivElement>(null);
  const rotationRef = useRef({ pitchDeg: -1.5, yawDeg: 0 });
  const dragStartRef = useRef<{ x: number; y: number; pitchDeg: number; yawDeg: number } | null>(null);
  const dragDistanceRef = useRef(0);
  const pressedItemRef = useRef<HomeGalleryMedia | null>(null);
  const animationFrameRef = useRef<number | null>(null);
  const resumeAtRef = useRef(0);
  const isVisibleRef = useRef(false);
  const isDraggingRef = useRef(false);
  const [supportsDome, setSupportsDome] = useState(false);
  const [selectedItem, setSelectedItem] = useState<HomeGalleryMedia | null>(null);

  const tiles = useMemo(() => buildDomeTiles(items), [items]);

  const applyRotation = useCallback(() => {
    if (!sphereRef.current) return;
    const { pitchDeg, yawDeg } = rotationRef.current;
    sphereRef.current.style.transform = `translateZ(calc(var(--dome-radius) * -1)) rotateX(${pitchDeg}deg) rotateY(${yawDeg}deg)`;
  }, []);

  useEffect(() => {
    const finePointerQuery = window.matchMedia("(hover: hover) and (pointer: fine)");
    const wideViewportQuery = window.matchMedia("(min-width: 769px)");
    const updateCapability = () => setSupportsDome(finePointerQuery.matches && wideViewportQuery.matches);

    updateCapability();
    finePointerQuery.addEventListener("change", updateCapability);
    wideViewportQuery.addEventListener("change", updateCapability);
    return () => {
      finePointerQuery.removeEventListener("change", updateCapability);
      wideViewportQuery.removeEventListener("change", updateCapability);
    };
  }, []);

  useEffect(() => {
    if (!supportsDome || selectedItem) return;
    const root = rootRef.current;
    if (!root) return;

    const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    applyRotation();
    if (reducedMotion) return;

    let previousTime = performance.now();

    const animate = (time: number) => {
      const elapsedSeconds = Math.min((time - previousTime) / 1000, 0.05);
      previousTime = time;

      const canAutoRotate = !reducedMotion
        && isVisibleRef.current
        && !isDraggingRef.current
        && selectedItem === null
        && time >= resumeAtRef.current;

      if (canAutoRotate) {
        rotationRef.current.yawDeg += DOME_AUTO_ROTATE_DEG_PER_SECOND * elapsedSeconds;
        applyRotation();
      }

      animationFrameRef.current = isVisibleRef.current
        ? window.requestAnimationFrame(animate)
        : null;
    };

    const observer = new IntersectionObserver(
      ([entry]) => {
        isVisibleRef.current = entry?.isIntersecting ?? false;
        previousTime = performance.now();
        if (isVisibleRef.current && animationFrameRef.current === null) {
          animationFrameRef.current = window.requestAnimationFrame(animate);
        }
      },
      { threshold: 0.08 },
    );

    observer.observe(root);

    return () => {
      observer.disconnect();
      if (animationFrameRef.current !== null) window.cancelAnimationFrame(animationFrameRef.current);
      animationFrameRef.current = null;
    };
  }, [applyRotation, selectedItem, supportsDome]);

  useEffect(() => {
    if (!selectedItem) return;
    const previousOverflow = document.body.style.overflow;
    const closeOnEscape = (event: KeyboardEvent) => {
      if (event.key === "Escape") setSelectedItem(null);
    };

    document.body.style.overflow = "hidden";
    window.addEventListener("keydown", closeOnEscape);
    return () => {
      document.body.style.overflow = previousOverflow;
      window.removeEventListener("keydown", closeOnEscape);
    };
  }, [selectedItem]);

  const handlePointerDown = (event: React.PointerEvent<HTMLDivElement>) => {
    if (event.pointerType !== "mouse" && event.pointerType !== "pen") return;
    if (event.pointerType === "mouse" && event.button !== 0) return;

    const tile = event.target instanceof Element
      ? event.target.closest<HTMLElement>("[data-dome-item-id]")
      : null;
    const itemId = tile?.dataset.domeItemId;
    pressedItemRef.current = itemId ? items.find((item) => item.id === itemId) ?? null : null;
    event.currentTarget.setPointerCapture(event.pointerId);
    isDraggingRef.current = true;
    dragDistanceRef.current = 0;
    dragStartRef.current = {
      x: event.clientX,
      y: event.clientY,
      pitchDeg: rotationRef.current.pitchDeg,
      yawDeg: rotationRef.current.yawDeg,
    };
  };

  const handlePointerMove = (event: React.PointerEvent<HTMLDivElement>) => {
    const start = dragStartRef.current;
    if (!start || !isDraggingRef.current) return;

    const deltaX = event.clientX - start.x;
    const deltaY = event.clientY - start.y;
    dragDistanceRef.current = Math.max(dragDistanceRef.current, Math.hypot(deltaX, deltaY));
    rotationRef.current = {
      pitchDeg: clamp(start.pitchDeg - deltaY * DOME_DRAG_DEG_PER_PIXEL, -DOME_MAX_PITCH_DEG, DOME_MAX_PITCH_DEG),
      yawDeg: start.yawDeg + deltaX * DOME_DRAG_DEG_PER_PIXEL,
    };
    applyRotation();
  };

  const finishDrag = (event: React.PointerEvent<HTMLDivElement>, allowOpen: boolean) => {
    const wasDragging = isDraggingRef.current;
    const selectedTile = pressedItemRef.current;
    const shouldOpen = wasDragging
      && allowOpen
      && selectedTile !== null
      && dragDistanceRef.current < DOME_DRAG_THRESHOLD_PX;

    if (event.currentTarget.hasPointerCapture(event.pointerId)) {
      event.currentTarget.releasePointerCapture(event.pointerId);
    }
    isDraggingRef.current = false;
    dragStartRef.current = null;
    pressedItemRef.current = null;
    resumeAtRef.current = performance.now() + DOME_RESUME_DELAY_MS;

    if (shouldOpen) setSelectedItem(selectedTile);
  };

  return (
    <div className={styles.root} ref={rootRef} data-gallery-mode={supportsDome ? "dome" : "compact-strip"}>
      {supportsDome ? (
        <>
          <div
            className={styles.viewport}
            onPointerDown={handlePointerDown}
            onPointerLeave={(event) => {
              if (isDraggingRef.current) finishDrag(event, false);
            }}
            onPointerMove={handlePointerMove}
            onPointerCancel={(event) => finishDrag(event, false)}
            onPointerUp={(event) => finishDrag(event, true)}
          >
            <div className={styles.sphere} ref={sphereRef} aria-hidden="true">
              {tiles.map((tile) => (
                <div
                  className={styles.tile}
                  data-dome-item-id={tile.item.id}
                  key={tile.id}
                  style={{
                    "--tile-pitch": `${tile.pitchDeg}deg`,
                    "--tile-yaw": `${tile.yawDeg}deg`,
                  } as React.CSSProperties}
                >
                  <Image
                    alt=""
                    fill
                    loading="lazy"
                    sizes="192px"
                    src={tile.item.src}
                    style={{ objectPosition: tile.item.objectPosition ?? "50% 50%" }}
                  />
                  <span>{tile.item.colorway}</span>
                </div>
              ))}
            </div>
            <div className={styles.edgeVeil} aria-hidden="true" />
            <p className={styles.hint} aria-hidden="true">Drag to explore · Select an image to enlarge</p>
          </div>

          <ul className={styles.accessibleList}>
            {items.map((item) => <li key={item.id}>{item.alt} — {item.colorway}</li>)}
          </ul>
        </>
      ) : (
        <div className={styles.strip} aria-label="Meowhe colorway gallery">
          {items.map((item, index) => (
            <button className={styles.stripCard} key={item.id} onClick={() => setSelectedItem(item)} type="button">
              <span className={styles.stripMedia}>
                <Image
                  alt={item.alt}
                  fill
                  loading="lazy"
                  sizes="(max-width: 540px) 78vw, 22rem"
                  src={item.src}
                  style={{ objectPosition: item.objectPosition ?? "50% 50%" }}
                />
                <i aria-hidden="true">{String(index + 1).padStart(2, "0")}</i>
              </span>
              <span className={styles.stripCaption}>{item.colorway}<i>Color study</i></span>
            </button>
          ))}
        </div>
      )}

      {selectedItem ? createPortal(
        <div className={styles.lightbox} role="dialog" aria-modal="true" aria-label={`${selectedItem.colorway} image preview`} onMouseDown={(event) => {
          if (event.target === event.currentTarget) setSelectedItem(null);
        }}>
          <button autoFocus className={styles.closeButton} onClick={() => setSelectedItem(null)} type="button">Close</button>
          <figure>
            <div className={styles.lightboxMedia}>
              <Image
                alt={selectedItem.alt}
                fill
                priority
                sizes="min(88vw, 900px)"
                src={selectedItem.src}
                style={{ objectPosition: selectedItem.objectPosition ?? "50% 50%" }}
              />
            </div>
            <figcaption><span>{selectedItem.colorway}</span><span>{selectedItem.alt}</span></figcaption>
          </figure>
        </div>,
        document.body,
      ) : null}
    </div>
  );
}
