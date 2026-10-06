'use client';

import { useState, type ReactNode } from 'react';
import Image from 'next/image';
import { useTranslator } from '@/lib/i18n/client';
import type { ShopPresentationEntry } from './shop-content';
import { selectGallery } from './gallery-selection';
import { ShopMedia } from './shop-media';

type ShopGalleryProps = Readonly<{ entry: ShopPresentationEntry; identity?: ReactNode; children?: ReactNode }>;

export function ShopGallery({ entry, identity, children }: ShopGalleryProps) {
  const tr = useTranslator();
  const variants = (entry.colorways ?? []).filter(variant => variant.productId === entry.id);
  const [variantId, setVariantId] = useState<string | null>(variants[0]?.id ?? null);
  const [selected, setSelected] = useState<string | null>(null);
  const visible = selectGallery(entry, variantId);
  const current = visible.find(asset => asset.key === selected) ?? visible[0];
  const selectedVariant = variants.find(variant => variant.id === variantId);
  // A missing Colorway photo may use only the shared Product image, never another Colorway.
  const fallback = variantId === null && (entry.media.type === 'video' || !entry.gallery?.length)
    ? entry.media
    : { ...entry.media, src: '', source: 'internal-placeholder' as const, productionApproved: false, label: 'Object image coming soon' };
  function choose(id: string | null) { setVariantId(id); setSelected(null); }

  return <article className={identity ? 'product-detail-grid' : 'shop-gallery'}>
    {identity && <header className="product-detail-identity">{identity}<p className="product-colorway-name" aria-live="polite">{selectedVariant?.name ?? tr('The object')}</p></header>}
    <div className="product-detail-gallery shop-gallery" aria-label={tr('Product images')}>
      <ShopMedia key={current?.key ?? `${variantId ?? 'product'}-fallback`} media={current?.media ?? fallback} priority sizes="(max-width: 900px) calc(100vw - 40px), 750px" />
      {visible.length > 1 && <div className="shop-gallery-thumbnails" aria-label={tr('Product images')}>{visible.map((asset, index) => <button key={asset.key} type="button" aria-label={`${tr('View image')} ${index + 1}: ${asset.media.alt}`} aria-pressed={current?.key === asset.key} onClick={() => setSelected(asset.key)}><Image src={asset.media.src} alt={asset.media.alt} width={112} height={84} sizes="112px" /></button>)}</div>}
    </div>
    {variants.length > 0 && <div className="product-detail-colorways"><label htmlFor={`colorway-${entry.id}`}>{tr('Choose a colorway')}</label><select id={`colorway-${entry.id}`} value={variantId ?? ''} onChange={event => choose(event.target.value || null)}><option value="">{tr('Product photos')}</option>{variants.map(variant => <option key={variant.id} value={variant.id}>{variant.name}</option>)}</select></div>}
    {children && <div className="product-detail-copy">{children}</div>}
    {variants.length > 1 && <section className="product-related" aria-labelledby="other-colorways-title"><h2 id="other-colorways-title">{tr('Other colorways')}</h2><div>{variants.filter(variant => variant.id !== variantId).map(variant => <button key={variant.id} type="button" onClick={() => {choose(variant.id); const heading = document.getElementById('shop-detail-title'); heading?.focus({ preventScroll: true }); heading?.scrollIntoView({ block: 'start' });}}>{variant.name}</button>)}</div></section>}
  </article>;
}
