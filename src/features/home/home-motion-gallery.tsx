"use client";

import Image from "next/image";
import { useEffect, useRef, useState } from "react";
import type { HomeGalleryMedia } from "@/content/homepage-media";
import { useTranslator } from "@/lib/i18n/client";
import { getGalleryArrival, getGalleryCornerOffset, getGalleryHeroPose, getGalleryPanelTransform, getGalleryProgress, getGallerySettleOffset, getGalleryCaptionOpacity, getGalleryStripPanel, galleryArrivalPadding, galleryArrivalProgress, galleryEntryViewportRatio, gallerySettleProgress } from "./home-gallery-motion";
import styles from "./home-motion-gallery.module.css";

const maxSlices = 7;

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
    const caption = chapter.querySelector<HTMLElement>("[data-home-gallery-caption]");
    const model = document.querySelector<HTMLElement>("[data-home-immersive-model] [data-hero-mode]");
    const viewport = chapter.querySelector<HTMLElement>("[data-home-gallery-viewport]");
    const images = Array.from(grid.querySelectorAll("img"));
    const tiles = Array.from(grid.querySelectorAll<HTMLButtonElement>("[data-home-gallery-card]"));
    const ribbons = Array.from(grid.querySelectorAll<HTMLElement>("[data-home-gallery-ribbon]")).map(
      ribbon => Array.from(ribbon.children) as HTMLElement[],
    );
    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)");
    const coarse = window.matchMedia("(pointer: coarse)");
    const compact = window.matchMedia("(max-width: 699px)");
    const device = navigator as Navigator & { connection?: { saveData?: boolean; effectiveType?: string }; deviceMemory?: number };
    const connection = device.connection;
    let decodedSources: string[] = [];
    let ready = false;
    let disposed = false;
    let frame = 0;
    let previous = -1;
    const motionAllowed = () => !reduced.matches && !(coarse.matches && (device.deviceMemory ?? Infinity) <= 2);
    let dimensions: { width: number; height: number; x: number; y: number; backgroundX: number; backgroundY: number }[] = [];

    function clearTiles() {
      for (const tile of tiles) {
        tile.style.removeProperty("transform");
        tile.style.removeProperty("opacity");
        tile.style.removeProperty("z-index");
      }
      if (poster) poster.style.opacity = "0";
      if (caption) caption.style.opacity = "0";
      if (grid) {
        grid.inert = false;
        delete grid.dataset.moving;
        delete grid.dataset.strip;
      }
    }

    function render() {
      frame = 0;
      if (!grid || !chapter) return;
      const top = chapter.getBoundingClientRect().top;
      const width = document.documentElement.clientWidth;
      const height = document.documentElement.clientHeight;
      const stageHeight = viewport?.offsetHeight || height;
      if (ready && motionAllowed() && !chapter.dataset.galleryMotion && top >= stageHeight * galleryEntryViewportRatio) {
        chapter.style.setProperty("--gallery-arrival-padding", galleryArrivalPadding);
        chapter.dataset.galleryMotion = "ready";
        dimensions = [];
        previous = -1;
      }
      if (chapter.dataset.galleryMotion !== "ready") return;
      const progress = getGalleryProgress(top, stageHeight);
      if (progress === previous) return;
      previous = progress;
      chapter.toggleAttribute("data-gallery-show-heading", progress >= galleryArrivalProgress);
      if (caption) caption.style.opacity = String(getGalleryCaptionOpacity(progress));

      const moving = progress < gallerySettleProgress;
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
      const sliceCount = compact.matches ? 4 : maxSlices;
      const strip = progress < galleryArrivalProgress;
      grid.toggleAttribute("data-strip", strip);
      if (!dimensions.length) {
        dimensions = tiles.map((tile, index) => {
          const slot = tile.parentElement ?? tile;
          const width = slot.offsetWidth;
          const height = slot.offsetHeight;
          const image = images[index];
          const scale = Math.max(width / image.naturalWidth, height / image.naturalHeight);
          const imageWidth = image.naturalWidth * scale;
          const imageHeight = image.naturalHeight * scale;
          const [positionX, positionY] = (items[index].objectPosition ?? "50% 50%").split(" ").map(value => parseFloat(value) / 100);
          for (const piece of ribbons[index]) {
            piece.style.setProperty("--slice-width", `${width / sliceCount}px`);
            piece.style.height = `${height}px`;
            piece.style.backgroundImage = `url("${image.currentSrc || decodedSources[index]}")`;
            piece.style.backgroundSize = `${imageWidth}px ${imageHeight}px`;
          }
          return {
            width, height, x: slot.offsetLeft, y: slot.offsetTop,
            backgroundX: (width - imageWidth) * positionX,
            backgroundY: (height - imageHeight) * positionY,
          };
        });
      }
      if (strip) {
        ribbons.forEach((pieces, index) => {
          const slot = dimensions[index];
          if (!slot.width || !slot.height) return;
          const panel = getGalleryStripPanel(progress, index, width, stageHeight, sliceCount);
          const pieceWidth = slot.width / sliceCount;
          pieces.forEach((piece, pieceIndex) => {
            const segment = panel?.[pieceIndex];
            const visible = segment && segment.corners[1][0] - segment.corners[0][0] > 0.12
              && Math.max(segment.corners[2][1], segment.corners[3][1]) >= 0
              && Math.min(segment.corners[0][1], segment.corners[1][1]) <= stageHeight;
            piece.hidden = !visible;
            if (!segment || !visible) return;
            // Overlap internal edges slightly to cover subpixel raster seams.
            piece.toggleAttribute("data-join", segment.slice < sliceCount - 1);
            piece.style.backgroundPosition = `${slot.backgroundX - segment.slice * pieceWidth}px ${slot.backgroundY}px`;
            piece.style.transform = getGalleryPanelTransform(segment.corners, {
              width: pieceWidth, height: slot.height, x: rect.left, y: rect.top,
            });
            piece.style.zIndex = String(segment.layer);
          });
        });
        return;
      }

      const settleOffset = getGallerySettleOffset(progress, stageHeight);
      const columns = compact.matches ? 2 : 3;
      const rows = Math.ceil(tiles.length / columns);
      tiles.forEach((tile, index) => {
        const slot = dimensions[index];
        if (!slot.width) return;
        const arrival = getGalleryArrival(progress, index);
        const offset = getGalleryCornerOffset(arrival, index, columns, rows, { width, height }, {
          x: rect.left + slot.x, y: rect.top + slot.y, width: slot.width, height: slot.height,
        }, settleOffset);
        tile.style.transform = `translate3d(${offset.x}px,${offset.y}px,0) rotate(${offset.tilt}deg)`;
        tile.style.opacity = arrival > 0 ? "1" : "0";
        tile.style.zIndex = "31";
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
        decodedSources = images.map(image => image.currentSrc || image.src);
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
        chapter.style.removeProperty("--gallery-arrival-padding");
        chapter.removeAttribute("data-gallery-show-heading");
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
      chapter.style.removeProperty("--gallery-arrival-padding");
      chapter.removeAttribute("data-gallery-show-heading");
      clearTiles();
    };
  }, [items]);

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
        <span className={styles.ribbons} aria-hidden="true">
          {items.map(item => (
            <span key={item.id} className={styles.ribbon} data-home-gallery-ribbon>
              {Array.from({ length: maxSlices }, (_, index) => <span key={index} className={styles.slice} hidden />)}
            </span>
          ))}
        </span>
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
