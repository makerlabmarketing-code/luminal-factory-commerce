"use client";

import Image from "next/image";
import { useLayoutEffect, useRef } from "react";
import { gsap } from "gsap";

import type { HomeGalleryMedia } from "@/content/homepage-media";

import styles from "./home-masonry-gallery.module.css";

type HomeMasonryGalleryProps = Readonly<{
  items: readonly HomeGalleryMedia[];
}>;

export function HomeMasonryGallery({ items }: HomeMasonryGalleryProps) {
  const rootRef = useRef<HTMLDivElement>(null);

  useLayoutEffect(() => {
    const root = rootRef.current;
    if (!root || window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;

    const cards = Array.from(root.querySelectorAll<HTMLElement>("[data-gallery-card]"));
    const compact = window.matchMedia("(max-width: 640px)").matches;
    let tween: gsap.core.Tween | null = null;
    const context = gsap.context(() => {
      gsap.set(cards, {
        autoAlpha: 0,
        y: compact ? 18 : 56,
        filter: compact ? "none" : "blur(10px)",
      });
      root.dataset.galleryReady = "true";
    }, root);

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (!entry?.isIntersecting) return;
        observer.disconnect();
        tween = gsap.to(cards, {
          autoAlpha: 1,
          y: 0,
          filter: "blur(0px)",
          duration: compact ? 0.5 : 0.78,
          ease: "power3.out",
          stagger: compact ? 0.035 : 0.075,
          clearProps: "opacity,transform,filter,visibility",
        });
      },
      { threshold: 0.08, rootMargin: "0px 0px -8% 0px" },
    );

    observer.observe(root);
    return () => {
      observer.disconnect();
      tween?.kill();
      context.revert();
    };
  }, [items]);

  return (
    <div className={styles.masonry} ref={rootRef} aria-label="Meowhe colorway gallery">
      {items.map((item, index) => (
        <figure className={styles.card} data-gallery-card key={item.id}>
          <div className={`${styles.media} ${styles[item.frame]}`}>
            <Image
              alt={item.alt}
              fill
              loading="lazy"
              sizes="(max-width: 640px) calc(100vw - 2rem), (max-width: 960px) calc(50vw - 2rem), (max-width: 1440px) calc(33vw - 2rem), 440px"
              src={item.src}
              style={{ objectPosition: item.objectPosition ?? "50% 50%" }}
            />
            <span aria-hidden="true">{String(index + 1).padStart(2, "0")}</span>
          </div>
          <figcaption>
            <span>{item.colorway}</span>
            <span>Color study</span>
          </figcaption>
        </figure>
      ))}
    </div>
  );
}
