import { NextResponse, type NextRequest } from "next/server";
import { refreshCustomerAuthSession } from "@/lib/supabase/customer-auth-proxy";

export async function proxy(request: NextRequest) {
  const usesCustomerSession =
    request.nextUrl.pathname.startsWith("/account") ||
    request.nextUrl.pathname === "/cart" ||
    request.nextUrl.pathname === "/api/cart";
  const response = usesCustomerSession
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
  matcher: ["/account/:path*", "/api/account/:path*", "/cart", "/api/cart"],
};
