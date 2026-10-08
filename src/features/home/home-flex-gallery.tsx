"use client";

import dynamic from "next/dynamic";
import Image from "next/image";
import Link from "@/lib/i18n/link";
import { useCallback, useEffect, useRef, useState } from "react";
import { GlowCard } from "@/components/ui/spotlight-card";
import type { HomeGalleryMedia } from "@/content/homepage-media";
import { useTranslator } from "@/lib/i18n/client";
import styles from "./home-flex-gallery.module.css";

const FlexCarousel = dynamic(() => import("@/components/ui/flex-carousel"), { ssr: false });

export function HomeFlexGallery({ items }: Readonly<{ items: readonly HomeGalleryMedia[] }>) {
  const tr = useTranslator();
  const rootRef = useRef<HTMLDivElement>(null);
  const dialogRef = useRef<HTMLDialogElement>(null);
  const [enhanced, setEnhanced] = useState(false);
  const [ready, setReady] = useState(false);
  const [failed, setFailed] = useState(false);
  const [selected, setSelected] = useState<HomeGalleryMedia | null>(null);
  const fail = useCallback(() => { setFailed(true); setReady(false); }, []);
  const loaded = useCallback(() => setReady(true), []);
  useEffect(() => {
    const root = rootRef.current;
    if (!root) return;
    const pointer = matchMedia("(hover: hover) and (pointer: fine) and (min-width: 769px)");
    const reduced = matchMedia("(prefers-reduced-motion: reduce)");
    let visible = false;
    const update = () => { setEnhanced(visible && pointer.matches && !reduced.matches); setReady(false); };
    const observer = new IntersectionObserver(([entry]) => { visible = entry.isIntersecting; update(); }, { rootMargin: "200px" });
    observer.observe(root);
    pointer.addEventListener("change", update); reduced.addEventListener("change", update);
    return () => { observer.disconnect(); pointer.removeEventListener("change", update); reduced.removeEventListener("change", update); };
  }, []);
  useEffect(() => {
    if (selected) dialogRef.current?.showModal();
    else dialogRef.current?.close();
  }, [selected]);
  if (!items.length) return null;
  const showEngine = enhanced && !failed;
  return <div ref={rootRef} data-gallery-mode={showEngine ? "flex-carousel" : "compact-strip"}>
    <GlowCard customSize glowColor="blue" className={styles.frame}>
      {showEngine && <div className={styles.engine} data-ready={ready}>
        <FlexCarousel items={items.map(item => ({ src: item.src, alt: item.alt, title: item.colorway }))}
          preset="liquid" intro="rise" fit="natural" radius={16} cardHeight={0.56}
          captureWheel={false} autoplay={false} followCursor={false} dispersion={0.2}
          ariaLabel={tr("Meowhe colorway gallery")} previousLabel={tr("Previous image")} nextLabel={tr("Next image")}
          onReady={loaded} onError={fail} />
      </div>}
      <div className={styles.strip} hidden={showEngine && ready} aria-label={tr("Meowhe colorway gallery")}>
        {items.map(item => <button key={item.id} type="button" className={styles.item} onClick={() => setSelected(item)} aria-label={`${tr("View image")}: ${item.colorway}`}>
          <span className={styles.media}><Image src={item.src} alt={item.alt} fill loading="lazy" sizes="(max-width: 540px) 78vw, 350px" style={{ objectPosition: item.objectPosition ?? "center" }} /></span>
          <span className={styles.caption}>{item.colorway}</span>
        </button>)}
      </div>
    </GlowCard>
    <p className={styles.hint}>{tr(showEngine && ready ? "Drag to explore · Select an image to enlarge" : "Swipe to explore · Select an image to enlarge")}</p>
    <nav className={styles.records} aria-label={tr("Explore colorway records")}>
      <Link href="/archive/meowhe-lolipop">Lolipop <span aria-hidden="true">↗</span></Link>
      <Link href="/archive/meowhe-mictlan">Mictlán <span aria-hidden="true">↗</span></Link>
      <Link href="/archive/meowhe-mono">Mono <span aria-hidden="true">↗</span></Link>
    </nav>
    <p className={styles.hint}>{tr("Artisan keycaps are small sculpted resin objects for mechanical keyboards and collections.")}</p>
    <p className={styles.hint}><Link className="text-link" href="/raffle">{tr("Explore announced releases")} <span aria-hidden="true">↗</span></Link></p>
    <dialog ref={dialogRef} className={styles.dialog} onClose={() => setSelected(null)} onClick={event => { if (event.target === event.currentTarget) setSelected(null); }} aria-label={tr("Image preview")}>
      <button autoFocus type="button" className="button-link button-secondary" onClick={() => setSelected(null)}>{tr("Close")}</button>
      {selected && <figure><div className={styles.preview}><Image src={selected.src} alt={selected.alt} fill sizes="(max-width: 900px) 88vw, 900px" /></div><figcaption>{selected.colorway}</figcaption></figure>}
    </dialog>
  </div>;
}
