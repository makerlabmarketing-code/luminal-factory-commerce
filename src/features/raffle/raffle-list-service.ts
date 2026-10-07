import 'server-only';
import { z } from 'zod';

const rowSchema = z.object({
  id: z.uuid(),
  slug: z.string().regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/).max(120),
  title: z.string().trim().min(1).max(180),
  summary: z.string().max(4000).nullable(),
  status: z.enum(['SCHEDULED', 'OPEN', 'CLOSED', 'DRAWING', 'DRAWN', 'PAYMENT_PENDING', 'FULFILLING', 'COMPLETED', 'CANCELLED']),
  product_id: z.uuid().nullable(),
  variant_id: z.uuid().nullable().optional(),
  products: z.unknown().optional(),
  is_published: z.literal(true),
  is_test: z.literal(false),
  published_at: z.string().datetime({ offset: true }),
  opens_at: z.string().datetime({ offset: true }).nullable(),
  closes_at: z.string().datetime({ offset: true }).nullable(),
});

export type RaffleListEntry = Readonly<{
  id: string; slug: string; title: string; summary: string | null;
  productId: string | null;
  variantId: string | null;
  media: Readonly<{ src: string; alt: string }> | null;
  state: 'upcoming' | 'open' | 'closed' | 'completed' | 'cancelled';
  opensAt: string | null; closesAt: string | null;
}>;
export type RaffleListResult = Readonly<{
  state: 'disabled' | 'unavailable' | 'empty' | 'ready';
  entries: readonly RaffleListEntry[];
}>;

const publicProductSchema = z.object({
  id: z.uuid(), status: z.literal('published'),
  published_at: z.string().datetime({ offset: true }),
  product_variants: z.array(z.object({ id: z.uuid(), product_id: z.uuid(), is_active: z.boolean() })).max(200).nullable(),
  product_media: z.array(z.unknown()).max(120).nullable(),
});
const publicImageSchema = z.object({
  variant_id: z.uuid().nullable(), media_type: z.literal('image'),
  storage_path: z.string().min(1).max(2048), alt_text: z.string().max(500).nullable(),
  is_primary: z.boolean(), sort_order: z.number().int(),
});

function publicImageSource(path: string, serviceUrl: string): string | null {
  try {
    const service = new URL(serviceUrl);
    const image = new URL(path, service);
    if (image.search || image.hash || image.username || image.password) return null;
    // Only existing local catalog images or this project's public Storage objects.
    if (path.startsWith('/images/') && !path.includes('%') && image.origin === service.origin && image.pathname.startsWith('/images/')) return image.pathname;
    const decodedPath = decodeURIComponent(image.pathname);
    if (image.protocol === 'https:' && image.origin === service.origin && decodedPath.startsWith('/storage/v1/object/public/') && !decodedPath.includes('/catalog-media-drafts/')) return image.href;
  } catch { return null; }
  return null;
}

export function resolveRaffleCover(product: unknown, productId: string | null, variantId: string | null, serviceUrl: string, now: number): RaffleListEntry['media'] {
  const parsed = publicProductSchema.safeParse(product);
  if (!parsed.success || !productId || parsed.data.id !== productId || Date.parse(parsed.data.published_at) > now) return null;
  if (variantId && !parsed.data.product_variants?.some(v => v.id === variantId && v.product_id === productId && v.is_active)) return null;
  const images = (parsed.data.product_media ?? []).flatMap(value => {
    const image = publicImageSchema.safeParse(value);
    if (!image.success || image.data.variant_id !== null && image.data.variant_id !== variantId) return [];
    const src = publicImageSource(image.data.storage_path, serviceUrl);
    return src ? [{ ...image.data, src }] : [];
  });
  images.sort((a, b) => Number(b.variant_id === variantId) - Number(a.variant_id === variantId) || Number(b.is_primary) - Number(a.is_primary) || a.sort_order - b.sort_order || a.src.localeCompare(b.src));
  const cover = images[0];
  return cover ? { src: cover.src, alt: cover.alt_text?.trim() || '' } : null;
}

// Presentation only: lifecycle and database enforcement still own entry eligibility.
export function resolveRaffleList(payload: unknown, now: number, serviceUrl = ''): RaffleListResult {
  const rows = z.array(z.unknown()).max(30).safeParse(payload);
  if (!rows.success || !Number.isFinite(now)) return { state: 'unavailable', entries: [] };
  const entries: RaffleListEntry[] = [];
  const seen = new Set<string>();
  for (const candidate of rows.data) {
    const parsed = rowSchema.safeParse(candidate);
    if (!parsed.success) continue;
    const row = parsed.data;
    if (Date.parse(row.published_at) > now || seen.has(row.slug)) continue;
    const opens = row.opens_at ? Date.parse(row.opens_at) : NaN;
    const closes = row.closes_at ? Date.parse(row.closes_at) : NaN;
    let state: RaffleListEntry['state'];
    if (row.status === 'CANCELLED') state = 'cancelled';
    else {
      if (!Number.isFinite(opens) || !Number.isFinite(closes) || closes <= opens) continue;
      if (row.status === 'SCHEDULED') {
        if (opens <= now) continue; // Never manufacture an OPEN transition.
        state = 'upcoming';
      } else if (row.status === 'OPEN') {
        if (opens > now) continue;
        state = closes > now ? 'open' : 'closed';
      } else {
        if (closes > now) continue;
        state = row.status === 'COMPLETED' ? 'completed' : 'closed';
      }
    }
    seen.add(row.slug);
    entries.push({ id: row.id, slug: row.slug, title: row.title, summary: row.summary,
      productId: row.product_id, variantId: row.variant_id ?? null,
      media: resolveRaffleCover(row.products, row.product_id, row.variant_id ?? null, serviceUrl, now),
      state, opensAt: row.opens_at, closesAt: row.closes_at });
  }
  const rank = { open: 0, upcoming: 1, closed: 2, completed: 3, cancelled: 4 };
  entries.sort((a, b) => rank[a.state] - rank[b.state] ||
    (a.state === 'upcoming'
      ? Date.parse(a.opensAt!) - Date.parse(b.opensAt!)
      : Date.parse(b.closesAt ?? '1970-01-01') - Date.parse(a.closesAt ?? '1970-01-01')) || a.slug.localeCompare(b.slug));
  // A nonempty response with no eligible rows is distinguishable from verified empty.
  return { state: entries.length ? 'ready' : rows.data.length ? 'unavailable' : 'empty', entries };
}

export async function getPublishedRaffleList(): Promise<RaffleListResult> {
  if (process.env.COMMERCE_RAFFLE_DETAIL_ENABLED?.trim().toLowerCase() !== 'true') {
    return { state: 'disabled', entries: [] };
  }
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL?.trim();
  const key = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY?.trim() || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY?.trim();
  if (!url || !key) return { state: 'unavailable', entries: [] };
  try {
    const base = new URL(url);
    if (base.protocol !== 'https:' || base.username || base.password || base.pathname !== '/' || base.search || base.hash) {
      return { state: 'unavailable', entries: [] };
    }
    const endpoint = new URL('/rest/v1/raffles', base);
    endpoint.searchParams.set('select', 'id,slug,title,summary,status,product_id,variant_id,is_published,is_test,published_at,opens_at,closes_at,products(id,status,published_at,product_variants(id,product_id,is_active),product_media(variant_id,media_type,storage_path,alt_text,is_primary,sort_order))');
    endpoint.searchParams.set('is_published', 'eq.true');
    endpoint.searchParams.set('is_test', 'eq.false');
    endpoint.searchParams.set('status', 'neq.DRAFT');
    endpoint.searchParams.set('published_at', `lte.${new Date().toISOString()}`);
    endpoint.searchParams.set('order', 'published_at.desc,id.asc');
    endpoint.searchParams.set('limit', '30');
    endpoint.searchParams.set('products.product_media.limit', '120');
    endpoint.searchParams.set('products.product_media.order', 'is_primary.desc,sort_order.asc');
    endpoint.searchParams.set('products.product_variants.limit', '200');
    const response = await fetch(endpoint, { headers: { apikey: key, Accept: 'application/json' }, cache: 'no-store', signal: AbortSignal.timeout(8000) });
    if (!response.ok) return { state: 'unavailable', entries: [] };
    return resolveRaffleList(await response.json(), Date.now(), base.href);
  } catch { return { state: 'unavailable', entries: [] }; }
}
