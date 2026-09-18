import "server-only";

import { cache } from "react";
import { createClient } from "@supabase/supabase-js";
import { z } from "zod";

const raffleRowSchema = z.object({
  id: z.string().uuid(),
  slug: z.string().regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/),
  title: z.string().trim().min(1).max(180),
  summary: z.string().nullable(),
  rules_summary: z.string().nullable(),
  status: z.enum([
    "DRAFT",
    "SCHEDULED",
    "OPEN",
    "CLOSED",
    "DRAWING",
    "DRAWN",
    "PAYMENT_PENDING",
    "FULFILLING",
    "COMPLETED",
    "CANCELLED",
  ]),
  rules_version: z.string().trim().min(1).max(64),
  opens_at: z.string().datetime({ offset: true }).nullable(),
  closes_at: z.string().datetime({ offset: true }).nullable(),
  published_at: z.string().datetime({ offset: true }),
  product_id: z.string().uuid().nullable(),
});

type RaffleDetailDatabase = {
  public: {
    Tables: {
      raffles: {
        Row: z.infer<typeof raffleRowSchema>;
        Insert: never;
        Update: never;
        Relationships: [];
      };
    };
    Views: Record<never, never>;
    Functions: Record<never, never>;
    Enums: Record<never, never>;
    CompositeTypes: Record<never, never>;
  };
};

export type PublicRaffleDetail = Readonly<{
  id: string;
  slug: string;
  title: string;
  summary: string | null;
  rulesSummary: string | null;
  status: z.infer<typeof raffleRowSchema>["status"];
  rulesVersion: string;
  opensAt: string | null;
  closesAt: string | null;
  publishedAt: string;
  productId: string | null;
  presentationTimeZone: "Asia/Ho_Chi_Minh";
}>;

function getPublicRaffleConfig(
  environment: Readonly<Record<string, string | undefined>> = process.env,
): Readonly<{ url: string; key: string }> | null {
  if (environment.COMMERCE_RAFFLE_DETAIL_ENABLED?.trim().toLowerCase() !== "true") return null;

  const url = environment.NEXT_PUBLIC_SUPABASE_URL?.trim();
  const key = (
    environment.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY ?? environment.NEXT_PUBLIC_SUPABASE_ANON_KEY
  )?.trim();
  if (!url || !key) return null;

  try {
    const parsed = new URL(url);
    if (parsed.protocol !== "https:" || parsed.username || parsed.password || parsed.pathname !== "/") {
      return null;
    }
  } catch {
    return null;
  }

  return { url, key };
}
export const getPublishedRaffleBySlug = cache(async (slug: string): Promise<PublicRaffleDetail | null> => {
  if (!/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(slug) || slug.length > 120) return null;

  const config = getPublicRaffleConfig();
  if (!config) return null;

  const client = createClient<RaffleDetailDatabase>(config.url, config.key, {
    auth: { autoRefreshToken: false, detectSessionInUrl: false, persistSession: false },
    global: { fetch: (input, init) => fetch(input, { ...init, cache: "no-store" }) },
  });

  const { data, error } = await client
    .from("raffles")
    .select(
      "id,slug,title,summary,rules_summary,status,rules_version,opens_at,closes_at,published_at,product_id",
    )
    .eq("slug", slug)
    .maybeSingle();

  if (error || !data) return null;
  const parsed = raffleRowSchema.safeParse(data);
  if (!parsed.success) return null;

  return {
    id: parsed.data.id,
    slug: parsed.data.slug,
    title: parsed.data.title,
    summary: parsed.data.summary,
    rulesSummary: parsed.data.rules_summary,
    status: parsed.data.status,
    rulesVersion: parsed.data.rules_version,
    opensAt: parsed.data.opens_at,
    closesAt: parsed.data.closes_at,
    publishedAt: parsed.data.published_at,
    productId: parsed.data.product_id,
    presentationTimeZone: "Asia/Ho_Chi_Minh",
  };
});

export function isRaffleEntryPresentationEnabled(
  environment: Readonly<Record<string, string | undefined>> = process.env,
): boolean {
  return (
    environment.COMMERCE_RAFFLE_ENTRY_ENABLED?.trim().toLowerCase() === "true" &&
    Boolean(environment.NEXT_PUBLIC_CLOUDFLARE_TURNSTILE_SITE_KEY?.trim())
  );
}
