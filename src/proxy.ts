import { NextResponse, type NextRequest } from "next/server";
import { refreshCustomerAuthSession } from "@/lib/supabase/customer-auth-proxy";

export async function proxy(request: NextRequest) {
  const response = request.nextUrl.pathname.startsWith("/account")
    ? await refreshCustomerAuthSession(request)
    : NextResponse.next({ request });

  if (request.nextUrl.pathname === "/cart") {
    response.headers.set("Cache-Control", "private, no-store, max-age=0");
    response.headers.set("Pragma", "no-cache");
    response.headers.set("Vary", "Cookie");
  }
  return response;
}

export const config = {
  matcher: ["/account/:path*", "/api/account/:path*", "/cart"],
};
