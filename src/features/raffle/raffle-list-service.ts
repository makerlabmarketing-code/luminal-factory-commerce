import 'server-only';
import { z } from 'zod';

const rowSchema = z.object({
  id: z.uuid(),
  slug: z.string().regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/).max(120),
  title: z.string().trim().min(1).max(180),
  summary: z.string().max(4000).nullable(),
  status: z.enum(['SCHEDULED', 'OPEN', 'CLOSED', 'DRAWING', 'DRAWN', 'PAYMENT_PENDING', 'FULFILLING', 'COMPLETED', 'CANCELLED']),
  product_id: z.uuid().nullable(),
  is_published: z.literal(true),
  is_test: z.literal(false),
  published_at: z.string().datetime({ offset: true }),
  opens_at: z.string().datetime({ offset: true }).nullable(),
  closes_at: z.string().datetime({ offset: true }).nullable(),
});

export type RaffleListEntry = Readonly<{
  id: string; slug: string; title: string; summary: string | null;
  productId: string | null;
  state: 'upcoming' | 'open' | 'closed' | 'completed' | 'cancelled';
  opensAt: string | null; closesAt: string | null;
}>;
export type RaffleListResult = Readonly<{
  state: 'disabled' | 'unavailable' | 'empty' | 'ready';
  entries: readonly RaffleListEntry[];
}>;

// Presentation only: lifecycle and database enforcement still own entry eligibility.
export function resolveRaffleList(payload: unknown, now: number): RaffleListResult {
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
      productId: row.product_id, state, opensAt: row.opens_at, closesAt: row.closes_at });
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
    endpoint.searchParams.set('select', 'id,slug,title,summary,status,product_id,is_published,is_test,published_at,opens_at,closes_at');
    endpoint.searchParams.set('is_published', 'eq.true');
    endpoint.searchParams.set('is_test', 'eq.false');
    endpoint.searchParams.set('status', 'neq.DRAFT');
    endpoint.searchParams.set('published_at', `lte.${new Date().toISOString()}`);
    endpoint.searchParams.set('order', 'published_at.desc,id.asc');
    endpoint.searchParams.set('limit', '30');
    const response = await fetch(endpoint, { headers: { apikey: key, Accept: 'application/json' }, cache: 'no-store', signal: AbortSignal.timeout(8000) });
    if (!response.ok) return { state: 'unavailable', entries: [] };
    return resolveRaffleList(await response.json(), Date.now());
  } catch { return { state: 'unavailable', entries: [] }; }
}
