import { NextRequest, NextResponse } from "next/server";
import {
  getGuestCartRequestEnvironment,
  getGuestCartSourceIdentifier,
  handleGuestCartRequest,
  type GuestCartHttpOutcome,
} from "@/features/cart/guest-cart-request";
import {
  createGuestCartCookie,
  createGuestCartCookieRemoval,
  GUEST_CART_COOKIE_NAME,
} from "@/features/cart/guest-cart-service";
import { getServerGuestCartService } from "@/lib/supabase/guest-cart-server";
import { getServerGuestCartRateLimiter } from "@/lib/supabase/guest-cart-rate-limit-server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const responseHeaders = {
  "Cache-Control": "private, no-store, max-age=0",
  Pragma: "no-cache",
  Vary: "Cookie, Origin",
  "X-Content-Type-Options": "nosniff",
} as const;

function createResponse(outcome: GuestCartHttpOutcome): NextResponse {
  const response = NextResponse.json(outcome.body, {
    status: outcome.status,
    headers: responseHeaders,
  });

  if (outcome.guestTokenToSet) {
    const cookie = createGuestCartCookie(outcome.guestTokenToSet);
    response.cookies.set(cookie.name, cookie.value, cookie.options);
  } else if (outcome.clearGuestToken) {
    const cookie = createGuestCartCookieRemoval();
    response.cookies.set(cookie.name, cookie.value, cookie.options);
  }

  return response;
}

export async function POST(request: NextRequest) {
  const environment = getGuestCartRequestEnvironment();
  if (!environment.ready) {
    return createResponse(await handleGuestCartRequest(request, { environment }));
  }

  const outcome = await handleGuestCartRequest(request, {
    environment,
    service: getServerGuestCartService(),
    rateLimiter: getServerGuestCartRateLimiter(),
    guestToken: request.cookies.get(GUEST_CART_COOKIE_NAME)?.value,
    sourceIdentifier: getGuestCartSourceIdentifier(request.headers),
  });
  return createResponse(outcome);
}
