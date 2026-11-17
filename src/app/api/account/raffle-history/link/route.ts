import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";
import { createServerClient } from "@supabase/ssr";
import { createClient } from "@supabase/supabase-js";
import { z } from "zod";
import { getCustomerAuthEnvironment } from "@/features/auth/customer-auth-request";
import type { Database } from "@/lib/supabase/database.types";
import { isRaffleHistoryLinkRequestAllowed } from "@/features/account/raffle-history-link-guard";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
const headers = {
  "Cache-Control": "private, no-store, max-age=0",
  Pragma: "no-cache",
  "X-Content-Type-Options": "nosniff",
} as const;
const resultSchema = z.object({
  linked_customer_id: z.string().uuid(),
  linked_entries: z.number().int().min(0),
});

function reply(status: number, body: Record<string, unknown>) {
  return NextResponse.json(body, { status, headers });
}

/**
 * Explicit verified-email history claim. Never claim on page GET or via
 * a caller-supplied email/userId. The migration RPC has service_role-only EXECUTE.
 */
export async function POST(request: NextRequest) {
  const env = getCustomerAuthEnvironment();
  if (!env.ready || process.env.COMMERCE_CUSTOMER_RAFFLE_HISTORY_ENABLED !== "true") {
    return reply(404, { ok: false, code: "unavailable" });
  }
  if (!isRaffleHistoryLinkRequestAllowed(request, env.allowedOrigins)) {
    return reply(403, { ok: false, code: "invalid_request" });
  }

  const url = process.env.NEXT_PUBLIC_SUPABASE_URL?.trim();
  const publicKey = (process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY ??
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY)?.trim();
  const secret = process.env.SUPABASE_SECRET_KEY?.trim();
  if (!url || !publicKey || !secret) return reply(503, { ok: false, code: "unavailable" });

  try {
    const cookieStore = await cookies();
    const session = createServerClient<Database>(url, publicKey, {
      cookies: {
        getAll: () => cookieStore.getAll(),
        setAll: () => { /* Proxy manages cookie refresh. */ },
      },
    });
    const { data, error } = await session.auth.getUser();
    const user = data.user;
    const email = user?.email?.trim().toLowerCase();
    if (error || !user || !email || !user.email_confirmed_at) {
      return reply(401, { ok: false, code: "authentication_required" });
    }
    const admin = createClient(url, secret, {
      auth: { persistSession: false, autoRefreshToken: false, detectSessionInUrl: false },
    });
    const { data: claimed, error: claimError } = await admin.rpc(
      "claim_verified_customer_raffle_history",
      { p_auth_user_id: user.id, p_verified_email: email },
    );
    if (claimError || !Array.isArray(claimed) || claimed.length !== 1) {
      return reply(409, { ok: false, code: "link_unavailable" });
    }
    const parsed = resultSchema.safeParse(claimed[0]);
    if (!parsed.success) return reply(503, { ok: false, code: "unavailable" });
    return reply(200, { ok: true, state: "linked", entriesLinked: parsed.data.linked_entries });
  } catch {
    return reply(503, { ok: false, code: "unavailable" });
  }
}
