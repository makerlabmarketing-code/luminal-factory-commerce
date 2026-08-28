import "server-only";
import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";
import type { Database } from "@/lib/supabase/database.types";

export async function refreshCustomerAuthSession(request: NextRequest): Promise<NextResponse> {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL?.trim();
  const supabaseKey = (
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY ?? process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
  )?.trim();
  if (
    process.env.COMMERCE_CUSTOMER_AUTH_ENABLED?.trim().toLowerCase() !== "true" ||
    !supabaseUrl ||
    !supabaseKey
  ) {
    return NextResponse.next({ request });
  }

  let response = NextResponse.next({ request });
  const client = createServerClient<Database>(supabaseUrl, supabaseKey, {
    cookies: {
      getAll: () => request.cookies.getAll(),
      setAll: (cookiesToSet, headersToSet) => {
        for (const cookie of cookiesToSet) request.cookies.set(cookie.name, cookie.value);
        response = NextResponse.next({ request });
        for (const cookie of cookiesToSet) response.cookies.set(cookie.name, cookie.value, cookie.options);
        for (const [name, value] of Object.entries(headersToSet)) response.headers.set(name, value);
      },
    },
  });

  await client.auth.getClaims();
  return response;
}
