import { NextRequest, NextResponse } from "next/server";
import {
  getRaffleEntryEnvironment,
  getRaffleEntrySourceIdentifier,
  handleRaffleEntryRequest,
  type RaffleEntryHttpOutcome,
} from "@/features/raffle/raffle-entry-request";
import {
  getServerRaffleEntryCaptchaVerifier,
  getServerRaffleEntryRateLimiter,
  getServerRaffleEntryService,
} from "@/lib/supabase/raffle-entry-server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const responseHeaders = {
  "Cache-Control": "private, no-store, max-age=0",
  Pragma: "no-cache",
  Vary: "Origin",
  "X-Content-Type-Options": "nosniff",
} as const;

function createResponse(outcome: RaffleEntryHttpOutcome): NextResponse {
  return NextResponse.json(outcome.body, { status: outcome.status, headers: responseHeaders });
}
export async function POST(request: NextRequest) {
  const environment = getRaffleEntryEnvironment();
  if (!environment.ready) {
    return createResponse(await handleRaffleEntryRequest(request, { environment }));
  }

  return createResponse(await handleRaffleEntryRequest(request, {
    environment,
    service: getServerRaffleEntryService(),
    rateLimiter: getServerRaffleEntryRateLimiter(),
    captchaVerifier: getServerRaffleEntryCaptchaVerifier(),
    sourceIdentifier: getRaffleEntrySourceIdentifier(request.headers),
  }));
}
