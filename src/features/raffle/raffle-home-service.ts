import "server-only";

import { cache } from "react";
import { createClient } from "@supabase/supabase-js";
import { z } from "zod";
import type { Database } from "@/lib/supabase/database.types";

const HOME_RAFFLE_FLAG = "COMMERCE_HOME_RAFFLE_ENABLED";

const raffleRowSchema = z.object({
  id: z.string().uuid(),
  slug: z.string().regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/),
  title: z.string().trim().min(1).max(180),
  summary: z.string().nullable(),
  status: z.enum(["SCHEDULED", "OPEN"]),
  opens_at: z.string().datetime({ offset: true }).nullable(),
  closes_at: z.string().datetime({ offset: true }).nullable(),
  product_id: z.string().uuid().nullable(),
});

const mediaRowSchema = z.object({
  media_type: z.enum(["image", "video"]),
  storage_path: z.string().trim().min(1).max(2048),
  alt_text: z.string().max(500).nullable(),
  is_primary: z.boolean(),
  sort_order: z.number().int(),
});

export type HomeFeaturedRaffle = Readonly<{
  id: string;
  slug: string;
  title: string;
  summary: string | null;
  state: "scheduled" | "open";
  opensAt: string;
  closesAt: string | null;
  productId: string | null;
  media: Readonly<{
    src: string;
    alt: string;
  }> | null;
  entryPresentationEnabled: boolean;
}>;

function getPublicConfig(
  environment: Readonly<Record<string, string | undefined>> = process.env,
): Readonly<{ url: string; key: string }> | null {
  if (environment[HOME_RAFFLE_FLAG]?.trim().toLowerCase() !== "true") return null;
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

  return { url: url.replace(/\/$/, ""), key };
}

function resolvePublicMediaSource(storagePath: string, supabaseUrl: string): string | null {
  if (storagePath.startsWith("/") && !storagePath.startsWith("//")) return storagePath;

  try {
    const mediaUrl = new URL(storagePath);
    const serviceUrl = new URL(supabaseUrl);
    if (
      mediaUrl.protocol === "https:" &&
      mediaUrl.origin === serviceUrl.origin &&
      mediaUrl.pathname.startsWith("/storage/v1/object/public/")
    ) {
      return mediaUrl.toString();
    }
  } catch {
    return null;
  }

  return null;
}

export const getHomeFeaturedRaffle = cache(async (): Promise<HomeFeaturedRaffle | null> => {
  const config = getPublicConfig();
  if (!config) return null;

  const client = createClient<Database>(config.url, config.key, {
    auth: { autoRefreshToken: false, detectSessionInUrl: false, persistSession: false },
    global: { fetch: (input, init) => fetch(input, { ...init, cache: "no-store" }) },
  });

  const now = new Date().toISOString();

  const { data: openRows, error: openError } = await client
    .from("raffles")
    .select("id,slug,title,summary,status,opens_at,closes_at,product_id")
    .eq("is_published", true)
    .eq("status", "OPEN")
    .lte("opens_at", now)
    .gt("closes_at", now)
    .order("opens_at", { ascending: true })
    .limit(1);

  if (openError) return null;

  let candidate = openRows?.[0] ?? null;

  if (!candidate) {
    const { data: scheduledRows, error: scheduledError } = await client
      .from("raffles")
      .select("id,slug,title,summary,status,opens_at,closes_at,product_id")
      .eq("is_published", true)
      .eq("status", "SCHEDULED")
      .gte("opens_at", now)
      .order("opens_at", { ascending: true })
      .limit(1);

    if (scheduledError) return null;
    candidate = scheduledRows?.[0] ?? null;
  }

  const parsed = raffleRowSchema.safeParse(candidate);
  if (!parsed.success || !parsed.data.opens_at) return null;

  let media: HomeFeaturedRaffle["media"] = null;

  if (parsed.data.product_id) {
    const { data: mediaRows, error: mediaError } = await client
      .from("product_media")
      .select("media_type,storage_path,alt_text,is_primary,sort_order")
      .eq("product_id", parsed.data.product_id)
      .eq("media_type", "image")
      .order("is_primary", { ascending: false })
      .order("sort_order", { ascending: true })
      .limit(1);

    if (!mediaError && mediaRows?.[0]) {
      const parsedMedia = mediaRowSchema.safeParse(mediaRows[0]);
      if (parsedMedia.success) {
        const src = resolvePublicMediaSource(parsedMedia.data.storage_path, config.url);
        if (src) {
          media = {
            src,
            alt: parsedMedia.data.alt_text?.trim() || `${parsed.data.title} raffle artwork`,
          };
        }
      }
    }
  }

  return {
    id: parsed.data.id,
    slug: parsed.data.slug,
    title: parsed.data.title,
    summary: parsed.data.summary,
    state: parsed.data.status === "OPEN" ? "open" : "scheduled",
    opensAt: parsed.data.opens_at,
    closesAt: parsed.data.closes_at,
    productId: parsed.data.product_id,
    media,
    entryPresentationEnabled:
      process.env.COMMERCE_RAFFLE_ENTRY_ENABLED?.trim().toLowerCase() === "true",
  };
});
