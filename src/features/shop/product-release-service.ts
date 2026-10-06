import 'server-only';
import { z } from 'zod';

const rowSchema = z.object({
  slug: z.string().regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/).max(120),
  title: z.string().trim().min(1).max(180), product_id: z.uuid(),
  is_published: z.literal(true), is_test: z.literal(false),
  status: z.enum(['SCHEDULED', 'OPEN', 'CLOSED', 'DRAWING', 'DRAWN', 'PAYMENT_PENDING', 'FULFILLING', 'COMPLETED']),
  opens_at: z.string().datetime({ offset: true }).nullable(),
  closes_at: z.string().datetime({ offset: true }).nullable(),
  published_at: z.string().datetime({ offset: true }),
});
export type ProductRelease = Readonly<{ slug: string; title: string; state: 'upcoming' | 'current' | 'past' }>;

export function resolveProductReleases(payload: unknown, productId: string, now = Date.now()): ProductRelease[] {
  const parsed = z.array(rowSchema).max(20).safeParse(payload);
  if (!parsed.success) return [];
  return parsed.data.filter(row => row.product_id === productId && Date.parse(row.published_at) <= now).flatMap<ProductRelease>(row => {
    const opens = row.opens_at ? Date.parse(row.opens_at) : NaN;
    const closes = row.closes_at ? Date.parse(row.closes_at) : NaN;
    if (row.status === 'SCHEDULED') return opens > now && closes > opens ? [{ slug: row.slug, title: row.title, state: 'upcoming' as const }] : [];
    if (row.status === 'OPEN') return opens <= now && closes > now ? [{ slug: row.slug, title: row.title, state: 'current' as const }] : [];
    return closes <= now ? [{ slug: row.slug, title: row.title, state: 'past' as const }] : [];
  });
}

export async function getProductReleases(productId: string): Promise<ProductRelease[]> {
  if (process.env.COMMERCE_RAFFLE_DETAIL_ENABLED?.trim().toLowerCase() !== 'true' || !z.uuid().safeParse(productId).success) return [];
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL?.trim();
  const key = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY?.trim() || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY?.trim();
  if (!url || !key) return [];
  try {
    const endpoint = new URL('/rest/v1/raffles', url);
    if (endpoint.protocol !== 'https:') return [];
    endpoint.searchParams.set('select', 'slug,title,product_id,is_published,is_test,status,opens_at,closes_at,published_at');
    endpoint.searchParams.set('product_id', `eq.${productId}`);
    endpoint.searchParams.set('is_published', 'eq.true');
    endpoint.searchParams.set('is_test', 'eq.false');
    endpoint.searchParams.set('status', 'not.in.(DRAFT,CANCELLED)');
    endpoint.searchParams.set('order', 'published_at.desc');
    endpoint.searchParams.set('limit', '20');
    const response = await fetch(endpoint, { headers: { apikey: key, Accept: 'application/json' }, cache: 'no-store' });
    return response.ok ? resolveProductReleases(await response.json(), productId) : [];
  } catch { return []; }
}
