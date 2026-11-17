import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";
import { createServerClient } from "@supabase/ssr";
import type { Database } from "@/lib/supabase/database.types";
import { getCustomerAuthEnvironment } from "@/features/auth/customer-auth-request";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

/**
 * A separate, default-off Google OAuth route. Supabase SSR stores the PKCE
 * verifier in cookies, and the callback exchanges the code on this origin.
 */
export async function GET(request: NextRequest) {
  const environment = getCustomerAuthEnvironment();
  if (!environment.ready || process.env.COMMERCE_CUSTOMER_GOOGLE_AUTH_ENABLED !== "true") {
    return new NextResponse(null, { status: 404, headers: { "Cache-Control": "private, no-store" } });
  }
  const origin = request.nextUrl.origin;
  if (!environment.allowedOrigins.has(origin)) {
    return new NextResponse(null, { status: 403, headers: { "Cache-Control": "private, no-store" } });
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
  const result = await client.auth.signInWithOAuth({
    provider: "google",
    options: { redirectTo: `${origin}/api/account/google/callback`, skipBrowserRedirect: true },
  });
  if (result.error || !result.data.url) {
    return new NextResponse(null, { status: 503, headers: { "Cache-Control": "private, no-store" } });
  }
  // OAuth provider URL is returned by Supabase Auth, never by an end-user field.
  const response = NextResponse.redirect(result.data.url, 302);
  response.headers.set("Cache-Control", "private, no-store");
  return response;
}
