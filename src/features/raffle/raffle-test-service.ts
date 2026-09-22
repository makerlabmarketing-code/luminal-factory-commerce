import "server-only";

import { cache } from "react";
import { timingSafeEqual } from "node:crypto";
import { createClient } from "@supabase/supabase-js";
import { z } from "zod";
import type { Database } from "@/lib/supabase/database.types";
import type { PublicRaffleDetail } from "./raffle-detail-service";

const testRaffleRowSchema = z.object({
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
  is_test: z.literal(true),
});

function safeTokenEqual(actual: string, expected: string): boolean {
  const actualBuffer = Buffer.from(actual);
  const expectedBuffer = Buffer.from(expected);
  return actualBuffer.length === expectedBuffer.length && timingSafeEqual(actualBuffer, expectedBuffer);
}

export function isRaffleTestAccessAuthorized(
  token: string | undefined,
  environment: Readonly<Record<string, string | undefined>> = process.env,
): boolean {
  if (environment.COMMERCE_RAFFLE_TEST_ENABLED?.trim().toLowerCase() !== "true") return false;
  const expected = environment.COMMERCE_RAFFLE_TEST_ACCESS_TOKEN?.trim();
  if (!token || !expected || expected.length < 32) return false;
  return safeTokenEqual(token, expected);
}

export const getPublishedTestRaffleBySlug = cache(async (slug: string): Promise<PublicRaffleDetail | null> => {
  if (!/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(slug) || slug.length > 120) return null;
  if (process.env.COMMERCE_RAFFLE_TEST_ENABLED?.trim().toLowerCase() !== "true") return null;

  const url = process.env.NEXT_PUBLIC_SUPABASE_URL?.trim();
  const secret = process.env.SUPABASE_SECRET_KEY?.trim();
  if (!url || !secret) return null;

  const client = createClient<Database>(url, secret, {
    auth: { autoRefreshToken: false, detectSessionInUrl: false, persistSession: false },
    global: { fetch: (input, init) => fetch(input, { ...init, cache: "no-store" }) },
  });

  const { data, error } = await client
    .from("raffles")
    .select("id,slug,title,summary,rules_summary,status,rules_version,opens_at,closes_at,published_at,product_id,is_test")
    .eq("slug", slug)
    .eq("is_test", true)
    .eq("is_published", true)
    .maybeSingle();

  if (error || !data) return null;
  const parsed = testRaffleRowSchema.safeParse(data);
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
