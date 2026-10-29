"use client";

import Image from "next/image";
import Link from "@/lib/i18n/link";
import { useEffect, useRef, useState } from "react";
import { GlowCard } from "@/components/ui/spotlight-card";
import type { HomeGalleryMedia } from "@/content/homepage-media";
import { useTranslator } from "@/lib/i18n/client";
import styles from "./home-flex-gallery.module.css";

export function HomeFlexGallery({ items }: Readonly<{ items: readonly HomeGalleryMedia[] }>) {
  const tr = useTranslator();
  const dialogRef = useRef<HTMLDialogElement>(null);
  const [selected, setSelected] = useState<HomeGalleryMedia | null>(null);
  useEffect(() => {
    if (selected) dialogRef.current?.showModal();
    else dialogRef.current?.close();
  }, [selected]);
  if (!items.length) return null;
  return <div data-gallery-mode="compact-strip">
    <GlowCard customSize glowColor="blue" className={styles.frame}>
      <div className={styles.strip} aria-label={tr("Meowhe colorway gallery")}>
        {items.map(item => <button key={item.id} type="button" className={styles.item} onClick={() => setSelected(item)} aria-label={`${tr("View image")}: ${item.colorway}`}>
          <span className={styles.media}><Image src={item.src} alt={item.alt} fill loading="lazy" sizes="(max-width: 540px) 78vw, 350px" style={{ objectPosition: item.objectPosition ?? "center" }} /></span>
          <span className={styles.caption}>{item.colorway}</span>
        </button>)}
      </div>
    </GlowCard>
    <p className={styles.hint}>{tr("Swipe to explore · Select an image to enlarge")}</p>
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
