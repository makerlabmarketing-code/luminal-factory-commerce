/**
 * Strict same-origin request guard for a state-changing, cookie-authenticated
 * account operation. No caller-controlled identity or JSON body is accepted.
 */
export function isRaffleHistoryLinkRequestAllowed(
  request: Request,
  allowedOrigins: ReadonlySet<string>,
): boolean {
  if (request.method !== "POST") return false;
  const url = new URL(request.url);
  const origin = request.headers.get("origin");
  if (!origin || origin !== url.origin || !allowedOrigins.has(origin)) return false;
  if (request.headers.get("x-luminal-history-link") !== "1") return false;
  const site = request.headers.get("sec-fetch-site");
  if (site !== null && site !== "same-origin") return false;

  // This action has an intentionally empty request body. Reject unexpected
  // payload framing, including chunked bodies and malformed Content-Length.
  if (request.headers.has("transfer-encoding")) return false;
  const contentLength = request.headers.get("content-length");
  if (contentLength !== null && contentLength !== "0") return false;
  return true;
}
