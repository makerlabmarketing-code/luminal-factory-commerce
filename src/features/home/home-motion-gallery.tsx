"use client";

import Image from "next/image";
import { useEffect, useRef, useState } from "react";
import type { HomeGalleryMedia } from "@/content/homepage-media";
import { useTranslator } from "@/lib/i18n/client";
import { getGalleryCardPose, getGalleryHeroPose, getGalleryProgress } from "./home-gallery-motion";
import styles from "./home-motion-gallery.module.css";

export function HomeMotionGallery({ items }: Readonly<{ items: readonly HomeGalleryMedia[] }>) {
  const tr = useTranslator();
  const posterRef = useRef<HTMLDivElement>(null);
  const gridRef = useRef<HTMLDivElement>(null);
  const dialogRef = useRef<HTMLDialogElement>(null);
  const [selected, setSelected] = useState<HomeGalleryMedia | null>(null);

  useEffect(() => {
    const grid = gridRef.current;
    const chapter = grid?.closest<HTMLElement>("[data-home-photo-handoff]");
    if (!grid || !chapter || !items.length) return;
    const poster = posterRef.current;
    const model = document.querySelector<HTMLElement>("[data-home-immersive-model] [data-hero-mode]");
    const viewport = chapter.querySelector<HTMLElement>("[data-home-gallery-viewport]");
    const images = Array.from(grid.querySelectorAll("img"));
    const tiles = Array.from(grid.querySelectorAll<HTMLButtonElement>("[data-home-gallery-card]"));
    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)");
    const coarse = window.matchMedia("(pointer: coarse)");
    const compact = window.matchMedia("(max-width: 699px)");
    const device = navigator as Navigator & { connection?: { saveData?: boolean; effectiveType?: string }; deviceMemory?: number };
    const connection = device.connection;
    let ready = false;
    let disposed = false;
    let frame = 0;
    let previous = -1;
    const motionAllowed = () => !reduced.matches && !(coarse.matches && (device.deviceMemory ?? Infinity) <= 2);
    let dimensions: { width: number; height: number; x: number; y: number }[] = [];

    function clearTiles() {
      for (const tile of tiles) {
        tile.style.removeProperty("transform");
        tile.style.removeProperty("opacity");
        tile.style.removeProperty("z-index");
      }
      if (poster) poster.style.opacity = "0";
      if (grid) {
        grid.inert = false;
        delete grid.dataset.moving;
      }
    }

    function render() {
      frame = 0;
      if (!grid || !chapter) return;
      const top = chapter.getBoundingClientRect().top;
      const width = document.documentElement.clientWidth;
      const height = document.documentElement.clientHeight;
      const stageHeight = viewport?.offsetHeight || height;
      if (ready && motionAllowed() && !chapter.dataset.galleryMotion && top >= stageHeight * 0.88) {
        chapter.dataset.galleryMotion = "ready";
        dimensions = [];
        previous = -1;
      }
      if (chapter.dataset.galleryMotion !== "ready") return;
      const progress = getGalleryProgress(top, stageHeight);
      if (progress === previous) return;
      previous = progress;

      const moving = progress < 0.97;
      grid.inert = moving;
      if (!moving) {
        if (grid.dataset.moving) clearTiles();
        return;
      }
      grid.dataset.moving = "true";
      if (poster) {
        const fallback = model && !model.dataset.heroMode?.startsWith("enhanced");
        if (fallback) {
          const pose = getGalleryHeroPose(progress, 0);
          const rise = 1 - pose.travel;
          const posterY = stageHeight * (0.5 - rise * 0.16) - top;
          poster.style.transform = `translate3d(calc(-50% - ${width * 0.12 * rise}px),calc(-50% + ${posterY}px),0)`;
          poster.style.opacity = pose.visible ? String(Math.min(1, progress / 0.10)) : "0";
        } else {
          poster.style.opacity = "0";
        }
      }
      const rect = grid.getBoundingClientRect();
      if (!dimensions.length) {
        dimensions = tiles.map(tile => {
          const slot = tile.parentElement ?? tile;
          return { width: slot.offsetWidth, height: slot.offsetHeight, x: slot.offsetLeft, y: slot.offsetTop };
        });
      }
      tiles.forEach((tile, index) => {
        const slot = dimensions[index];
        if (!slot.width) return;
        const pose = getGalleryCardPose(progress, index, width, stageHeight, compact.matches);
        const left = rect.left + slot.x + slot.width / 2;
        const top = rect.top + slot.y + slot.height / 2;
        const remaining = 1 - pose.settle;
        tile.style.transform = `translate3d(${(width / 2 + pose.x - left) * remaining}px,${(stageHeight / 2 + pose.y - top) * remaining}px,0) perspective(950px) rotateZ(${pose.roll * remaining}deg) rotateY(${pose.yaw * remaining}deg) scale(${1 + (pose.width / slot.width - 1) * remaining})`;
        tile.style.opacity = String(pose.opacity);
        tile.style.zIndex = String(pose.layer);
      });
    }

    function schedule() {
      if (!frame) frame = window.requestAnimationFrame(render);
    }

    function resize() {
      dimensions = [];
      previous = -1;
      schedule();
    }

    const observer = new IntersectionObserver(entries => {
      if (!entries.some(entry => entry.isIntersecting)) return;
      observer.disconnect();
      if (!motionAllowed() || connection?.saveData || connection?.effectiveType === "2g" || connection?.effectiveType === "slow-2g") return;
      const fallbackImage = model ? poster?.querySelector("img") : null;
      const media = fallbackImage ? [...images, fallbackImage] : images;
      for (const image of media) image.loading = "eager";
      void Promise.all(media.map(image => image.decode())).then(() => {
        if (disposed) return;
        ready = true;
        schedule();
      }).catch(() => { /* Keep the normal photo grid if an image cannot decode. */ });
    }, { rootMargin: "1800px 0px" });
    observer.observe(chapter);
    const sizeObserver = new ResizeObserver(resize);
    sizeObserver.observe(grid);

    function updatePreference() {
      if (chapter && !motionAllowed()) {
        delete chapter.dataset.galleryMotion;
        clearTiles();
      }
      resize();
    }
    reduced.addEventListener("change", updatePreference);
    compact.addEventListener("change", resize);
    coarse.addEventListener("change", updatePreference);
    window.addEventListener("scroll", schedule, { passive: true });
    window.addEventListener("resize", resize);
    return () => {
      disposed = true;
      observer.disconnect();
      sizeObserver.disconnect();
      reduced.removeEventListener("change", updatePreference);
      compact.removeEventListener("change", resize);
      coarse.removeEventListener("change", updatePreference);
      window.removeEventListener("scroll", schedule);
      window.removeEventListener("resize", resize);
      window.cancelAnimationFrame(frame);
      delete chapter.dataset.galleryMotion;
      clearTiles();
    };
  }, [items.length]);

  useEffect(() => {
    const dialog = dialogRef.current;
    if (selected && dialog && !dialog.open) dialog.showModal();
  }, [selected]);

  return (
    <>
      <div ref={posterRef} className={styles.poster} aria-hidden="true">
        <Image src="/images/home/hero.webp" fill alt="" sizes="(max-width: 699px) 48vw, 420px" />
      </div>
      <div ref={gridRef} className={styles.grid} data-home-chapter-photo>
        {items.map(item => (
          <div key={item.id} className={styles.slot}>
            <button type="button" className={styles.tile} data-home-gallery-card
              aria-label={`${tr("View image")}: ${item.alt}`} onClick={() => setSelected(item)}>
              <Image fill src={item.src} alt="" sizes="(max-width: 699px) 52vw, (max-width: 1100px) 45vw, 680px"
                style={{ objectPosition: item.objectPosition ?? "center" }} />
            </button>
          </div>
        ))}
      </div>
      <dialog ref={dialogRef} className={styles.dialog} aria-label={tr("Image preview")}
        onClose={() => setSelected(null)} onClick={event => { if (event.target === event.currentTarget) event.currentTarget.close(); }}>
        <form method="dialog"><button className="button-link button-secondary">{tr("Close")}</button></form>
        {selected && (
          <figure>
            <div className={styles.preview}><Image fill src={selected.src} alt={selected.alt} sizes="(max-width: 900px) 88vw, 900px" /></div>
            <figcaption>{selected.colorway}</figcaption>
          </figure>
        )}
      </dialog>
    </>
  );
}
