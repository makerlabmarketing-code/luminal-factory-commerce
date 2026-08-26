import type { NextRequest } from "next/server";
import { refreshCustomerAuthSession } from "@/lib/supabase/customer-auth-proxy";

export async function proxy(request: NextRequest) {
  return refreshCustomerAuthSession(request);
}

export const config = {
  matcher: ["/account/:path*", "/api/account/:path*"],
};
