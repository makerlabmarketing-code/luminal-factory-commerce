import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";
import { createServerClient } from "@supabase/ssr";
import type { Database } from "@/lib/supabase/database.types";
import { getCustomerAuthEnvironment } from "@/features/auth/customer-auth-request";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

export async function GET(request: NextRequest) {
  const env = getCustomerAuthEnvironment();
  if (!env.ready || process.env.COMMERCE_CUSTOMER_GOOGLE_AUTH_ENABLED !== "true") {
    return new NextResponse(null, { status: 404, headers: { "Cache-Control": "private, no-store" } });
  }
  const origin = request.nextUrl.origin;
  if (!env.allowedOrigins.has(origin)) {
    return new NextResponse(null, { status: 403, headers: { "Cache-Control": "private, no-store" } });
  }
  const accountUrl = new URL("/en/account", origin);
  const code = request.nextUrl.searchParams.get("code");
  if (!code || code.length > 2048) {
    accountUrl.searchParams.set("auth_error", "google");
    return NextResponse.redirect(accountUrl);
  }

  const url = process.env.NEXT_PUBLIC_SUPABASE_URL?.trim();
  const key = (process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY ??
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY)?.trim();
  if (!url || !key) return new NextResponse(null, { status: 503 });

  const cookieStore = await cookies();
  const client = createServerClient<Database>(url, key, {
    cookies: {
      getAll: () => cookieStore.getAll(),
      setAll: (values) => {
        for (const value of values) cookieStore.set(value.name, value.value, value.options);
      },
    },
  });
  const exchanged = await client.auth.exchangeCodeForSession(code);
  if (exchanged.error) {
    accountUrl.searchParams.set("auth_error", "google");
    const response = NextResponse.redirect(accountUrl);
    response.headers.set("Cache-Control", "private, no-store");
    return response;
  }
  const verified = await client.auth.getUser();
  if (verified.error || !verified.data.user?.email_confirmed_at) {
    await client.auth.signOut({ scope: "local" });
    accountUrl.searchParams.set("auth_error", "google");
  }
  const response = NextResponse.redirect(accountUrl);
  response.headers.set("Cache-Control", "private, no-store");
  response.headers.set("Vary", "Cookie");
  return response;
}
