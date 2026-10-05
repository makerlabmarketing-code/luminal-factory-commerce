'use client';
import { useState } from 'react';
import Image from 'next/image';
import { useTranslator } from '@/lib/i18n/client';
import type { ShopPresentationEntry } from './shop-content';
import { ShopMedia } from './shop-media';
export function ShopGallery({ entry }: { entry:ShopPresentationEntry }) {
  const tr=useTranslator();const [variant,setVariant]=useState('all');const [selected,setSelected]=useState<string|null>(null);
  const gallery=entry.gallery ?? [];
  const visible=gallery.filter(a => variant==='all' || a.variantId===null || a.variantId===variant).sort((a,b) => variant==='all' ? 0 : Number(b.variantId===variant)-Number(a.variantId===variant));
  const current=visible.find(a => a.key===selected) ?? (entry.media.type==='video' && variant==='all' && selected===null ? undefined : visible[0]);
  const variants=Array.from(new Map(gallery.filter(a => a.variantId && a.variantName).map(a => [a.variantId!,a.variantName!])).entries());
  if (!gallery.length) return <ShopMedia media={entry.media} priority />;
  return <div className="shop-gallery">
    {!!variants.length && <label>{tr('Colorway')}<select value={variant} onChange={e => {setVariant(e.target.value);setSelected(null);}}><option value="all">{tr('All colorways')}</option>{variants.map(([id,name]) => <option key={id} value={id}>{name}</option>)}</select></label>}
    <ShopMedia key={current?.key ?? 'fallback'} media={current?.media ?? entry.media} priority />
    {visible.length>1 && <div className="shop-gallery-thumbnails" aria-label={tr('Product images')}>{visible.map((a,i) => <button key={a.key} type="button" aria-label={`${tr('View image')} ${i+1}: ${a.media.alt}`} aria-pressed={current?.key===a.key} onClick={() => setSelected(a.key)}><Image src={a.media.src} alt={a.media.alt} width={112} height={84} sizes="112px" /></button>)}</div>}
  </div>;
}
