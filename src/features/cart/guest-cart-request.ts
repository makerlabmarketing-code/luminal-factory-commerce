import { createHmac } from "node:crypto";
import { isIP } from "node:net";
import { z } from "zod";

export const GUEST_CART_REQUEST_HEADER = "x-luminal-cart-request";
export const GUEST_CART_REQUEST_HEADER_VALUE = "1";
export const GUEST_CART_REQUEST_MAX_BYTES = 4 * 1024;

const guestCartRequestSchema = z.discriminatedUnion("action", [
  z.object({ action: z.literal("create") }).strict(),
  z.object({ action: z.literal("read") }).strict(),
  z.object({
    action: z.literal("set_line"),
    productId: z.string().uuid(),
    variantId: z.string().uuid().nullable().optional().default(null),
    requestedQuantity: z.number().int().min(1).max(99),
  }).strict(),
  z.object({
    action: z.literal("remove_line"),
    productId: z.string().uuid(),
    variantId: z.string().uuid().nullable().optional().default(null),
  }).strict(),
]);

type GuestCartHttpView = Readonly<{
  currency: "VND";
  expiresAt: string;
  lines: readonly Readonly<{
    productId: string;
    variantId: string | null;
    requestedQuantity: number;
  }>[];
  unavailableLineCount: number;
}>;

type GuestCartServiceFailure = Readonly<{
  ok: false;
  code:
    | "runtime_disabled"
    | "runtime_unavailable"
    | "cart_unavailable"
    | "invalid_input"
    | "catalog_selection_unavailable";
}>;

type GuestCartServiceResult = Readonly<{ ok: true; cart: GuestCartHttpView }> | GuestCartServiceFailure;

export interface GuestCartRequestService {
  create(): Promise<
    | Readonly<{ ok: true; guestToken: string; cart: GuestCartHttpView }>
    | Readonly<{ ok: false; code: "runtime_disabled" | "runtime_unavailable" }>
  >;
  read(guestToken: string): Promise<GuestCartServiceResult>;
  setLine(
    guestToken: string,
    input: Readonly<{ productId: string; variantId: string | null; requestedQuantity: number }>,
  ): Promise<GuestCartServiceResult>;
  removeLine(
    guestToken: string,
    input: Readonly<{ productId: string; variantId: string | null }>,
  ): Promise<GuestCartServiceResult>;
}

export interface GuestCartRateLimiter {
  consume(input: Readonly<{
    key: string;
    bucket: "request" | "create" | "mutation";
  }>): Promise<"allowed" | "limited" | "unavailable">;
}

export type GuestCartRequestEnvironment =
  | Readonly<{ ready: false; code: "runtime_disabled" | "runtime_unavailable" }>
  | Readonly<{
    ready: true;
    allowedOrigins: ReadonlySet<string>;
    rateLimitSecret: string;
  }>;

export type GuestCartHttpOutcome = Readonly<{
  status: number;
  body:
    | Readonly<{ ok: true; cart: GuestCartHttpView }>
    | Readonly<{
      ok: false;
      code:
        | "invalid_request"
        | "rate_limited"
        | "cart_unavailable"
        | "catalog_selection_unavailable"
        | "service_unavailable";
    }>;
  guestTokenToSet?: string;
  clearGuestToken?: boolean;
}>;

type GuestCartRequestDependencies = Readonly<{
  environment: GuestCartRequestEnvironment;
  service?: GuestCartRequestService;
  rateLimiter?: GuestCartRateLimiter;
  guestToken?: string;
  sourceIdentifier?: string;
}>;

function normalizeAllowedOrigin(value: string): string | null {
  try {
    const url = new URL(value);
    const isLocalHttp = url.protocol === "http:" && ["localhost", "127.0.0.1", "::1"].includes(url.hostname);
    if (url.protocol !== "https:" && !isLocalHttp) return null;
    if (url.username || url.password || url.pathname !== "/" || url.search || url.hash) return null;
    return url.origin;
  } catch {
    return null;
  }
}

export function getGuestCartRequestEnvironment(
  environment: Readonly<Record<string, string | undefined>> = process.env,
): GuestCartRequestEnvironment {
  if (environment.COMMERCE_GUEST_CART_ENABLED?.trim().toLowerCase() !== "true") {
    return { ready: false, code: "runtime_disabled" };
  }

  const rawOrigins = environment.COMMERCE_GUEST_CART_ALLOWED_ORIGINS?.split(",")
    .map((origin) => origin.trim())
    .filter(Boolean) ?? [];
  const normalizedOrigins = rawOrigins.map(normalizeAllowedOrigin);
  const validOrigins = normalizedOrigins.filter((origin): origin is string => origin !== null);
  const rateLimitSecret = environment.COMMERCE_GUEST_CART_RATE_LIMIT_SECRET?.trim();
  if (
    !rateLimitSecret ||
    rateLimitSecret.length < 32 ||
    validOrigins.length === 0 ||
    validOrigins.length !== normalizedOrigins.length
  ) {
    return { ready: false, code: "runtime_unavailable" };
  }

  return {
    ready: true,
    allowedOrigins: new Set(validOrigins),
    rateLimitSecret,
  };
}

export function getGuestCartSourceIdentifier(headers: Headers): string | undefined {
  const forwarded = headers.get("x-vercel-forwarded-for") ?? headers.get("x-forwarded-for");
  const candidate = forwarded?.split(",")[0]?.trim();
  return candidate && isIP(candidate) !== 0 ? candidate : undefined;
}

export function createGuestCartRateLimitKey(secret: string, sourceIdentifier: string): string {
  return createHmac("sha256", secret).update(sourceIdentifier).digest("hex");
}

function failure(
  status: number,
  code: Extract<GuestCartHttpOutcome["body"], { ok: false }>["code"],
  clearGuestToken = false,
): GuestCartHttpOutcome {
  return { status, body: { ok: false, code }, ...(clearGuestToken ? { clearGuestToken: true } : {}) };
}

function mapServiceResult(result: GuestCartServiceResult, hasGuestToken: boolean): GuestCartHttpOutcome {
  if (result.ok) return { status: 200, body: { ok: true, cart: result.cart } };
  if (result.code === "cart_unavailable") return failure(404, "cart_unavailable", hasGuestToken);
  if (result.code === "invalid_input") return failure(400, "invalid_request");
  if (result.code === "catalog_selection_unavailable") return failure(409, "catalog_selection_unavailable");
  if (result.code === "runtime_disabled") return failure(404, "cart_unavailable");
  return failure(503, "service_unavailable");
}

async function parseRequestBody(request: Request): Promise<z.infer<typeof guestCartRequestSchema> | null> {
  const contentLength = Number.parseInt(request.headers.get("content-length") ?? "0", 10);
  if (Number.isFinite(contentLength) && contentLength > GUEST_CART_REQUEST_MAX_BYTES) return null;

  try {
    const text = await request.text();
    if (Buffer.byteLength(text, "utf8") > GUEST_CART_REQUEST_MAX_BYTES) return null;
    const parsed: unknown = JSON.parse(text);
    const result = guestCartRequestSchema.safeParse(parsed);
    return result.success ? result.data : null;
  } catch {
    return null;
  }
}

async function consumeRateLimit(
  rateLimiter: GuestCartRateLimiter,
  key: string,
  bucket: "request" | "create" | "mutation",
): Promise<GuestCartHttpOutcome | null> {
  let result: Awaited<ReturnType<GuestCartRateLimiter["consume"]>>;
  try {
    result = await rateLimiter.consume({ key, bucket });
  } catch {
    return failure(503, "service_unavailable");
  }
  if (result === "limited") return failure(429, "rate_limited");
  if (result === "unavailable") return failure(503, "service_unavailable");
  return null;
}

export async function handleGuestCartRequest(
  request: Request,
  dependencies: GuestCartRequestDependencies,
): Promise<GuestCartHttpOutcome> {
  if (!dependencies.environment.ready) {
    return dependencies.environment.code === "runtime_disabled"
      ? failure(404, "cart_unavailable")
      : failure(503, "service_unavailable");
  }

  const contentType = request.headers.get("content-type")?.split(";", 1)[0]?.trim().toLowerCase() ?? "";
  const origin = request.headers.get("origin");
  const fetchSite = request.headers.get("sec-fetch-site");
  if (
    contentType !== "application/json" ||
    !origin ||
    !dependencies.environment.allowedOrigins.has(origin) ||
    request.headers.get(GUEST_CART_REQUEST_HEADER) !== GUEST_CART_REQUEST_HEADER_VALUE ||
    (fetchSite !== null && fetchSite !== "same-origin")
  ) {
    return failure(403, "invalid_request");
  }

  if (!dependencies.service || !dependencies.rateLimiter || !dependencies.sourceIdentifier) {
    return failure(503, "service_unavailable");
  }

  const rateLimitKey = createGuestCartRateLimitKey(
    dependencies.environment.rateLimitSecret,
    dependencies.sourceIdentifier,
  );
  const requestLimit = await consumeRateLimit(dependencies.rateLimiter, rateLimitKey, "request");
  if (requestLimit) return requestLimit;

  const body = await parseRequestBody(request);
  if (!body) return failure(400, "invalid_request");

  const actionBucket = body.action === "create" ? "create" : body.action === "read" ? null : "mutation";
  if (actionBucket) {
    const actionLimit = await consumeRateLimit(dependencies.rateLimiter, rateLimitKey, actionBucket);
    if (actionLimit) return actionLimit;
  }

  try {
    const guestToken = dependencies.guestToken;
    if (body.action === "create") {
      if (guestToken) {
        const existing = await dependencies.service.read(guestToken);
        if (existing.ok) return { status: 200, body: { ok: true, cart: existing.cart } };
        if (existing.code === "runtime_unavailable") return failure(503, "service_unavailable");
        if (existing.code === "runtime_disabled") return failure(404, "cart_unavailable");
      }

      const created = await dependencies.service.create();
      if (!created.ok) {
        return created.code === "runtime_disabled"
          ? failure(404, "cart_unavailable")
          : failure(503, "service_unavailable");
      }
      return {
        status: 201,
        body: { ok: true, cart: created.cart },
        guestTokenToSet: created.guestToken,
      };
    }

    if (!guestToken) return failure(404, "cart_unavailable");
    if (body.action === "read") {
      return mapServiceResult(await dependencies.service.read(guestToken), true);
    }
    if (body.action === "set_line") {
      return mapServiceResult(
        await dependencies.service.setLine(guestToken, {
          productId: body.productId,
          variantId: body.variantId,
          requestedQuantity: body.requestedQuantity,
        }),
        true,
      );
    }
    return mapServiceResult(
      await dependencies.service.removeLine(guestToken, {
        productId: body.productId,
        variantId: body.variantId,
      }),
      true,
    );
  } catch {
    return failure(503, "service_unavailable");
  }
}
