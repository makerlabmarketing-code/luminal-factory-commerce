import { createHmac } from "node:crypto";
import { isIP } from "node:net";
import { z } from "zod";

export const CUSTOMER_AUTH_REQUEST_HEADER = "x-luminal-auth-request";
export const CUSTOMER_AUTH_REQUEST_HEADER_VALUE = "1";
export const CUSTOMER_AUTH_REQUEST_MAX_BYTES = 4 * 1024;

const customerAuthRequestSchema = z.discriminatedUnion("action", [
  z.object({
    action: z.literal("request_otp"),
    email: z.email().max(254).transform((value) => value.trim().toLowerCase()),
    captchaToken: z.string().trim().min(16).max(4096),
  }).strict(),
  z.object({
    action: z.literal("verify_otp"),
    email: z.email().max(254).transform((value) => value.trim().toLowerCase()),
    token: z.string().regex(/^\d{6}$/),
  }).strict(),
  z.object({ action: z.literal("sign_out") }).strict(),
]);

export interface CustomerAuthService {
  requestOtp(input: Readonly<{ email: string; captchaToken: string }>): Promise<boolean>;
  verifyOtp(input: Readonly<{ email: string; token: string }>): Promise<boolean>;
  signOut(): Promise<boolean>;
}

export type CustomerAuthRateLimitBucket = "otp_email_15m" | "otp_source_hour" | "verify_source_15m";

export interface CustomerAuthRateLimiter {
  consume(input: Readonly<{
    key: string;
    bucket: CustomerAuthRateLimitBucket;
  }>): Promise<"allowed" | "limited" | "unavailable">;
}

export type CustomerAuthEnvironment =
  | Readonly<{ ready: false; code: "runtime_disabled" | "runtime_unavailable" }>
  | Readonly<{
    ready: true;
    allowedOrigins: ReadonlySet<string>;
    rateLimitSecret: string;
  }>;

export type CustomerAuthHttpOutcome = Readonly<{
  status: number;
  body:
    | Readonly<{ ok: true; state: "otp_sent" | "authenticated" | "signed_out" }>
    | Readonly<{
      ok: false;
      code: "auth_unavailable" | "invalid_request" | "invalid_or_expired_otp" | "rate_limited";
    }>;
}>;

type CustomerAuthRequestDependencies = Readonly<{
  environment: CustomerAuthEnvironment;
  service?: CustomerAuthService;
  rateLimiter?: CustomerAuthRateLimiter;
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

export function getCustomerAuthEnvironment(
  environment: Readonly<Record<string, string | undefined>> = process.env,
): CustomerAuthEnvironment {
  if (environment.COMMERCE_CUSTOMER_AUTH_ENABLED?.trim().toLowerCase() !== "true") {
    return { ready: false, code: "runtime_disabled" };
  }

  const rawOrigins = environment.COMMERCE_CUSTOMER_AUTH_ALLOWED_ORIGINS?.split(",")
    .map((origin) => origin.trim())
    .filter(Boolean) ?? [];
  const normalizedOrigins = rawOrigins.map(normalizeAllowedOrigin);
  const validOrigins = normalizedOrigins.filter((origin): origin is string => origin !== null);
  const supabaseUrl = environment.NEXT_PUBLIC_SUPABASE_URL?.trim();
  const supabaseKey = (
    environment.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY ?? environment.NEXT_PUBLIC_SUPABASE_ANON_KEY
  )?.trim();
  const turnstileSiteKey = environment.NEXT_PUBLIC_CLOUDFLARE_TURNSTILE_SITE_KEY?.trim();
  const rateLimitSecret = environment.COMMERCE_CUSTOMER_AUTH_RATE_LIMIT_SECRET?.trim();

  if (
    !supabaseUrl ||
    !supabaseKey ||
    !turnstileSiteKey ||
    !rateLimitSecret ||
    rateLimitSecret.length < 32 ||
    validOrigins.length === 0 ||
    validOrigins.length !== normalizedOrigins.length
  ) {
    return { ready: false, code: "runtime_unavailable" };
  }

  try {
    const url = new URL(supabaseUrl);
    if (url.protocol !== "https:" || url.username || url.password || url.pathname !== "/") {
      return { ready: false, code: "runtime_unavailable" };
    }
  } catch {
    return { ready: false, code: "runtime_unavailable" };
  }

  return { ready: true, allowedOrigins: new Set(validOrigins), rateLimitSecret };
}

export function getCustomerAuthSourceIdentifier(headers: Headers): string | undefined {
  const forwarded = headers.get("x-vercel-forwarded-for") ?? headers.get("x-forwarded-for");
  const candidate = forwarded?.split(",")[0]?.trim();
  return candidate && isIP(candidate) !== 0 ? candidate : undefined;
}

export function createCustomerAuthRateLimitKey(
  secret: string,
  scope: "email" | "source",
  value: string,
): string {
  return createHmac("sha256", secret).update(`${scope}:${value}`).digest("hex");
}

function failure(
  status: number,
  code: Extract<CustomerAuthHttpOutcome["body"], { ok: false }>["code"],
): CustomerAuthHttpOutcome {
  return { status, body: { ok: false, code } };
}

async function parseRequestBody(request: Request): Promise<z.infer<typeof customerAuthRequestSchema> | null> {
  const contentLength = Number.parseInt(request.headers.get("content-length") ?? "0", 10);
  if (Number.isFinite(contentLength) && contentLength > CUSTOMER_AUTH_REQUEST_MAX_BYTES) return null;

  try {
    const text = await request.text();
    if (Buffer.byteLength(text, "utf8") > CUSTOMER_AUTH_REQUEST_MAX_BYTES) return null;
    const parsed: unknown = JSON.parse(text);
    const result = customerAuthRequestSchema.safeParse(parsed);
    return result.success ? result.data : null;
  } catch {
    return null;
  }
}

async function consumeRateLimit(
  rateLimiter: CustomerAuthRateLimiter,
  key: string,
  bucket: CustomerAuthRateLimitBucket,
): Promise<CustomerAuthHttpOutcome | null> {
  try {
    const result = await rateLimiter.consume({ key, bucket });
    if (result === "limited") return failure(429, "rate_limited");
    if (result === "unavailable") return failure(503, "auth_unavailable");
    return null;
  } catch {
    return failure(503, "auth_unavailable");
  }
}

export async function handleCustomerAuthRequest(
  request: Request,
  dependencies: CustomerAuthRequestDependencies,
): Promise<CustomerAuthHttpOutcome> {
  if (!dependencies.environment.ready) {
    return dependencies.environment.code === "runtime_disabled"
      ? failure(404, "auth_unavailable")
      : failure(503, "auth_unavailable");
  }

  const contentType = request.headers.get("content-type")?.split(";", 1)[0]?.trim().toLowerCase() ?? "";
  const origin = request.headers.get("origin");
  const fetchSite = request.headers.get("sec-fetch-site");
  if (
    contentType !== "application/json" ||
    !origin ||
    !dependencies.environment.allowedOrigins.has(origin) ||
    request.headers.get(CUSTOMER_AUTH_REQUEST_HEADER) !== CUSTOMER_AUTH_REQUEST_HEADER_VALUE ||
    (fetchSite !== null && fetchSite !== "same-origin")
  ) {
    return failure(403, "invalid_request");
  }

  if (!dependencies.service) {
    return failure(503, "auth_unavailable");
  }
  const body = await parseRequestBody(request);
  if (!body) return failure(400, "invalid_request");

  try {
    if (body.action === "sign_out") {
      const signedOut = await dependencies.service.signOut();
      return signedOut
        ? { status: 200, body: { ok: true, state: "signed_out" } }
        : failure(503, "auth_unavailable");
    }

    if (!dependencies.rateLimiter || !dependencies.sourceIdentifier) {
      return failure(503, "auth_unavailable");
    }
    const sourceKey = createCustomerAuthRateLimitKey(
      dependencies.environment.rateLimitSecret,
      "source",
      dependencies.sourceIdentifier,
    );
    if (body.action === "request_otp") {
      const sourceLimit = await consumeRateLimit(dependencies.rateLimiter, sourceKey, "otp_source_hour");
      if (sourceLimit) return sourceLimit;
      const emailKey = createCustomerAuthRateLimitKey(
        dependencies.environment.rateLimitSecret,
        "email",
        body.email,
      );
      const emailLimit = await consumeRateLimit(dependencies.rateLimiter, emailKey, "otp_email_15m");
      if (emailLimit) return emailLimit;
      const accepted = await dependencies.service.requestOtp({
        email: body.email,
        captchaToken: body.captchaToken,
      });
      return accepted
        ? { status: 202, body: { ok: true, state: "otp_sent" } }
        : failure(503, "auth_unavailable");
    }

    const verificationLimit = await consumeRateLimit(
      dependencies.rateLimiter,
      sourceKey,
      "verify_source_15m",
    );
    if (verificationLimit) return verificationLimit;
    const verified = await dependencies.service.verifyOtp({ email: body.email, token: body.token });
    return verified
      ? { status: 200, body: { ok: true, state: "authenticated" } }
      : failure(400, "invalid_or_expired_otp");
  } catch {
    return failure(503, "auth_unavailable");
  }
}
