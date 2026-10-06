import type { ShopPresentationEntry } from './shop-content';

export function selectGallery(entry: ShopPresentationEntry, variantId: string | null) {
  const allowed = variantId !== null && entry.colorways?.some(variant => variant.id === variantId && variant.productId === entry.id);
  const target = allowed ? variantId : null;
  return (entry.gallery ?? []).filter(asset => asset.variantId === null || asset.variantId === target)
    .sort((a, b) => target === null ? 0 : Number(b.variantId === target) - Number(a.variantId === target));
}
