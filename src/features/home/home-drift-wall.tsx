"use client";

import Image from "next/image";
import { useEffect, useMemo, useRef, useState } from "react";
import { createPortal } from "react-dom";

import type { HomeGalleryMedia } from "@/content/homepage-media";

import styles from "./home-drift-wall.module.css";

type HomeDriftWallProps = Readonly<{
  items: readonly HomeGalleryMedia[];
}>;

const DRIFT_COLUMN_COUNT = 5;
const DRIFT_ITEMS_PER_COLUMN = 3;
const DRIFT_POINTER_RANGE_PX = 12;

function buildColumns(items: readonly HomeGalleryMedia[]) {
  if (items.length === 0) return [];

  return Array.from({ length: DRIFT_COLUMN_COUNT }, (_, columnIndex) =>
    Array.from({ length: DRIFT_ITEMS_PER_COLUMN }, (_, itemIndex) =>
      items[(columnIndex * 2 + itemIndex * DRIFT_COLUMN_COUNT) % items.length],
    ),
  );
}

export function HomeDriftWall({ items }: HomeDriftWallProps) {
  const rootRef = useRef<HTMLDivElement>(null);
  const wallRef = useRef<HTMLDivElement>(null);
  const [supportsDrift, setSupportsDrift] = useState(false);
  const [isVisible, setIsVisible] = useState(false);
  const [selectedItem, setSelectedItem] = useState<HomeGalleryMedia | null>(null);
  const columns = useMemo(() => buildColumns(items), [items]);

  useEffect(() => {
    const finePointerQuery = window.matchMedia("(hover: hover) and (pointer: fine)");
    const wideViewportQuery = window.matchMedia("(min-width: 769px)");
    const reducedMotionQuery = window.matchMedia("(prefers-reduced-motion: reduce)");
    const updateCapability = () => {
      setSupportsDrift(finePointerQuery.matches && wideViewportQuery.matches && !reducedMotionQuery.matches);
    };

    updateCapability();
    finePointerQuery.addEventListener("change", updateCapability);
    wideViewportQuery.addEventListener("change", updateCapability);
    reducedMotionQuery.addEventListener("change", updateCapability);
    return () => {
      finePointerQuery.removeEventListener("change", updateCapability);
      wideViewportQuery.removeEventListener("change", updateCapability);
      reducedMotionQuery.removeEventListener("change", updateCapability);
    };
  }, []);

  useEffect(() => {
    const root = rootRef.current;
    if (!root || !supportsDrift) return;

    const observer = new IntersectionObserver(
      ([entry]) => setIsVisible(entry?.isIntersecting ?? false),
      { threshold: 0.08 },
    );
    observer.observe(root);
    return () => observer.disconnect();
  }, [supportsDrift]);

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

  const resetPointerOffset = () => {
    wallRef.current?.style.setProperty("--pointer-x", "0px");
    wallRef.current?.style.setProperty("--pointer-y", "0px");
    wallRef.current?.style.setProperty("--pointer-nx", "0");
    wallRef.current?.style.setProperty("--pointer-ny", "0");
  };

  const handlePointerMove = (event: React.PointerEvent<HTMLDivElement>) => {
    const bounds = event.currentTarget.getBoundingClientRect();
    const x = ((event.clientX - bounds.left) / bounds.width - 0.5) * DRIFT_POINTER_RANGE_PX * 2;
    const y = ((event.clientY - bounds.top) / bounds.height - 0.5) * DRIFT_POINTER_RANGE_PX * 2;
    wallRef.current?.style.setProperty("--pointer-x", `${x.toFixed(2)}px`);
    wallRef.current?.style.setProperty("--pointer-y", `${y.toFixed(2)}px`);
    wallRef.current?.style.setProperty("--pointer-nx", (x / DRIFT_POINTER_RANGE_PX).toFixed(3));
    wallRef.current?.style.setProperty("--pointer-ny", (y / DRIFT_POINTER_RANGE_PX).toFixed(3));
  };

  return (
    <div
      className={styles.root}
      data-gallery-mode={supportsDrift ? "drift-wall" : "compact-strip"}
      ref={rootRef}
    >
      {supportsDrift ? (
        <div
          className={styles.viewport}
          data-visible={isVisible ? "true" : "false"}
          onPointerLeave={resetPointerOffset}
          onPointerMove={handlePointerMove}
        >
          <div className={styles.wall} ref={wallRef}>
            {columns.map((column, columnIndex) => (
              <div
                className={styles.column}
                data-direction={columnIndex % 2 === 0 ? "up" : "down"}
                key={`column-${columnIndex}`}
                style={{
                  "--column-depth": `${(2 - columnIndex) * 0.6}rem`,
                  "--column-parallax": (columnIndex - 2) * 1.35,
                  "--drift-duration": `${30 + columnIndex * 2}s`,
                } as React.CSSProperties}
              >
                <div className={styles.track}>
                  {[0, 1].map((copyIndex) => (
                    <div className={styles.group} key={`group-${copyIndex}`}>
                      {column.map((item, itemIndex) => (
                        <button
                          aria-label={`Open ${item.colorway} image: ${item.alt}`}
                          className={`${styles.tile} ${styles[item.frame]}`}
                          key={`${copyIndex}-${itemIndex}-${item.id}`}
                          onClick={() => setSelectedItem(item)}
                          onPointerDown={(event) => {
                            if (event.button === 0) setSelectedItem(item);
                          }}
                          tabIndex={copyIndex === 0 ? 0 : -1}
                          type="button"
                        >
                          <Image
                            alt=""
                            fill
                            loading="lazy"
                            sizes="(max-width: 1200px) 22vw, 18vw"
                            src={item.src}
                            style={{ objectPosition: item.objectPosition ?? "50% 50%" }}
                          />
                        </button>
                      ))}
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
          <div className={styles.edgeVeil} aria-hidden="true" />
          <p className={styles.hint} aria-hidden="true">Move to explore · Select an image to enlarge</p>
        </div>
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
        <div
          aria-label={`${selectedItem.colorway} image preview`}
          aria-modal="true"
          className={styles.lightbox}
          onMouseDown={(event) => {
            if (event.target === event.currentTarget) setSelectedItem(null);
          }}
          role="dialog"
        >
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
