import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import {
  getCustomerAuthEnvironment,
  getCustomerAuthSourceIdentifier,
  handleCustomerAuthRequest,
  type CustomerAuthHttpOutcome,
} from "@/features/auth/customer-auth-request";
import { createServerCustomerAuthService } from "@/lib/supabase/customer-auth-server";
import { getServerCustomerAuthRateLimiter } from "@/lib/supabase/customer-auth-rate-limit-server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const responseHeaders = {
  "Cache-Control": "private, no-store, max-age=0",
  Pragma: "no-cache",
  Vary: "Cookie, Origin",
  "X-Content-Type-Options": "nosniff",
} as const;

function createResponse(outcome: CustomerAuthHttpOutcome): NextResponse {
  return NextResponse.json(outcome.body, { status: outcome.status, headers: responseHeaders });
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
  }));
}
