import { resolveRaffleList } from "@/features/raffle/raffle-list-service";

export const dynamic = "force-dynamic";

export async function GET() {
  let raffle: { slug: string; closesAt: string } | null = null;
  const headers = { "Cache-Control": "public, max-age=20, s-maxage=20" };

  if (process.env.COMMERCE_RAFFLE_DETAIL_ENABLED?.trim().toLowerCase() !== "true") {
    return Response.json({ raffle }, { headers });
  }
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL?.trim();
  const key = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY?.trim() || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY?.trim();
  if (!url || !key) return Response.json({ raffle }, { headers });

  try {
    const base = new URL(url);
    if (base.protocol !== "https:" || base.username || base.password || base.pathname !== "/" || base.search || base.hash) {
      return Response.json({ raffle }, { headers });
    }
    const now = new Date().toISOString();
    const endpoint = new URL("/rest/v1/raffles", base);
    endpoint.search = new URLSearchParams({
      select: "id,slug,title,summary,status,product_id,is_published,is_test,published_at,opens_at,closes_at",
      is_published: "eq.true",
      is_test: "eq.false",
      status: "eq.OPEN",
      published_at: `lte.${now}`,
      opens_at: `lte.${now}`,
      closes_at: `gt.${now}`,
      order: "closes_at.asc,id.asc",
      limit: "3",
    }).toString();
    const response = await fetch(endpoint, {
      headers: { apikey: key, Accept: "application/json" },
      cache: "no-store",
      signal: AbortSignal.timeout(2500),
    });
    if (response.ok) {
      const open = resolveRaffleList(await response.json(), Date.now()).entries
        .filter(entry => entry.state === "open" && entry.closesAt)
        .sort((a, b) => Date.parse(a.closesAt!) - Date.parse(b.closesAt!))[0];
      if (open?.closesAt) raffle = { slug: open.slug, closesAt: open.closesAt };
    }
  } catch {
    // A notice is optional. The regular header stays available on provider errors.
  }
  return Response.json({ raffle }, { headers });
}
