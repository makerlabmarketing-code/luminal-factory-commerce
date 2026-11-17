import "server-only";

import { cookies } from "next/headers";
import { createServerClient } from "@supabase/ssr";
import { createClient } from "@supabase/supabase-js";
import { z } from "zod";
import { resolveRaffleHistory, type RaffleHistoryItem } from "./raffle-history-policy";

const raffleSchema = z.object({
  id: z.string().uuid(),
  created_at: z.string(),
  raffles: z.object({
    title: z.string().min(1),
    slug: z.string(),
    is_test: z.boolean(),
    is_published: z.boolean(),
    results_published_at: z.string().nullable(),
    status: z.string(),
  }),
});
const allocationSchema = z.object({
  raffle_entry_id: z.string().uuid(),
  status: z.string(),
});

export type CustomerRaffleHistoryItem = RaffleHistoryItem;

/**
 * Read-only, feature-gated customer history. Never accept an email from the
 * client: a verified Supabase Auth user bound to customers.id owns entries.
 * Do not expose address/contact fields or unpublished selection decisions.
 */
export async function getCustomerRaffleHistory(): Promise<
  { state: "disabled" | "signed_out" | "ready" | "unavailable"; items: CustomerRaffleHistoryItem[] }
> {
  // Requires rollout of the reviewed customer_id schema migration first.
  if (process.env.COMMERCE_CUSTOMER_RAFFLE_HISTORY_ENABLED !== "true" ||
      process.env.COMMERCE_CUSTOMER_AUTH_ENABLED !== "true") {
    return { state: "disabled", items: [] };
  }

  const url = process.env.NEXT_PUBLIC_SUPABASE_URL?.trim();
  const publicKey = (process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY ??
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY)?.trim();
  const secret = process.env.SUPABASE_SECRET_KEY?.trim();
  if (!url || !publicKey || !secret) return { state: "unavailable", items: [] };

  try {
    const cookieStore = await cookies();
    const authClient = createServerClient(url, publicKey, {
      cookies: {
        getAll: () => cookieStore.getAll(),
        setAll: () => {
          // The account proxy refreshes auth cookies.
        },
      },
    });
    const { data: auth, error: authError } = await authClient.auth.getUser();
    const user = auth.user;
    const email = user?.email?.trim().toLowerCase();
    if (authError || !user || !email || !user.email_confirmed_at) {
      return { state: "signed_out", items: [] };
    }

    const admin = createClient(url, secret, {
      auth: { persistSession: false, autoRefreshToken: false, detectSessionInUrl: false },
    });
    // Stable ownership: resolve the currently verified Auth user to exactly
    // one customer. Never grant history using email equality alone.
    const { data: customer, error: customerError } = await admin.from("customers")
      .select("id,email")
      .eq("auth_user_id", user.id)
      .maybeSingle();
    if (customerError) return { state: "unavailable", items: [] };
    if (!customer) return { state: "ready", items: [] };
    if (customer.email.trim().toLowerCase() !== email) {
      // Account email changed. Ownership needs explicit re-verification,
      // never silently bind guest entries belonging to an old email.
      return { state: "unavailable", items: [] };
    }

    const { data, error } = await admin.from("raffle_entries")
      .select("id,created_at,raffles!inner(title,slug,is_test,is_published,results_published_at,status)")
      .eq("customer_id", customer.id)
      .eq("raffles.is_test", false)
      .eq("raffles.is_published", true)
      .order("created_at", { ascending: false })
      .limit(100);
    if (error || !data) return { state: "unavailable", items: [] };

    const records = z.array(raffleSchema).safeParse(data);
    if (!records.success) return { state: "unavailable", items: [] };
    const now = Date.now();
    const visible = records.data;
    const announced = visible.filter((entry) => {
      const date = entry.raffles.results_published_at;
      return date !== null && Number.isFinite(Date.parse(date)) && Date.parse(date) <= now;
    });
    let allocations: z.infer<typeof allocationSchema>[] = [];
    if (announced.length) {
      const result = await admin.from("raffle_winner_allocations")
        .select("raffle_entry_id,status")
        .in("raffle_entry_id", announced.map((item) => item.id))
        .limit(100);
      if (result.error || !result.data) return { state: "unavailable", items: [] };
      const parsed = z.array(allocationSchema).safeParse(result.data);
      if (!parsed.success) return { state: "unavailable", items: [] };
      allocations = parsed.data;
    }
    return { state: "ready", items: resolveRaffleHistory(visible, allocations, now) };

  } catch {
    return { state: "unavailable", items: [] };
  }
}
