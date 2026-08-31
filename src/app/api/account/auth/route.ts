import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import {
  getCustomerAuthEnvironment,
  getCustomerAuthSourceIdentifier,
  handleCustomerAuthRequest,
  type CustomerAuthHttpOutcome,
} from "@/features/auth/customer-auth-request";
import {
  createGuestCartCookieRemoval,
  GUEST_CART_COOKIE_NAME,
} from "@/features/cart/guest-cart-service";
import { createServerCustomerAuthService } from "@/lib/supabase/customer-auth-server";
import { getServerCustomerAuthRateLimiter } from "@/lib/supabase/customer-auth-rate-limit-server";
import { getServerCustomerCartMergeService } from "@/lib/supabase/customer-cart-merge-server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const responseHeaders = {
  "Cache-Control": "private, no-store, max-age=0",
  Pragma: "no-cache",
  Vary: "Cookie, Origin",
  "X-Content-Type-Options": "nosniff",
} as const;

function createResponse(outcome: CustomerAuthHttpOutcome): NextResponse {
  const response = NextResponse.json(outcome.body, { status: outcome.status, headers: responseHeaders });
  if (outcome.clearGuestToken) {
    const cookie = createGuestCartCookieRemoval();
    response.cookies.set(cookie.name, cookie.value, cookie.options);
  }
  return response;
}

export async function POST(request: Request) {
  const environment = getCustomerAuthEnvironment();
  if (!environment.ready) {
    return createResponse(await handleCustomerAuthRequest(request, { environment }));
  }

  const cookieStore = await cookies();
  return createResponse(await handleCustomerAuthRequest(request, {
    environment,
    service: createServerCustomerAuthService(cookieStore),
    rateLimiter: getServerCustomerAuthRateLimiter(),
    sourceIdentifier: getCustomerAuthSourceIdentifier(request.headers),
    guestToken: cookieStore.get(GUEST_CART_COOKIE_NAME)?.value,
    mergeGuestCart: (identity, guestToken) => getServerCustomerCartMergeService().merge(identity, guestToken),
  }));
}
