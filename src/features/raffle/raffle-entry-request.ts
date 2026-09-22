import { createHash, createHmac } from "node:crypto";
import { isIP } from "node:net";
import { z } from "zod";
import {
  RAFFLE_ENTRY_REQUEST_HEADER,
  RAFFLE_ENTRY_REQUEST_HEADER_VALUE,
  type RaffleEntryClientResponse,
} from "./raffle-entry-contract";

export const RAFFLE_ENTRY_REQUEST_MAX_BYTES = 12 * 1024;

const raffleEntryRequestSchema = z.object({
  raffleId: z.string().uuid(),
  requestId: z.string().uuid(),
  email: z.email().max(254).transform((value) => value.trim().toLowerCase()),
  displayName: z.string().trim().min(2).max(120),
  recipientName: z.string().trim().min(2).max(120),
  addressLine1: z.string().trim().min(3).max(240),
  addressLine2: z.string().trim().max(240),
  city: z.string().trim().min(1).max(120),
  stateProvince: z.string().trim().min(1).max(120),
  postalCode: z.string().trim().max(32),
  countryCode: z.string().trim().length(2).transform((value) => value.toUpperCase()),
  phone: z.string().trim().max(32),
  rulesVersion: z.string().trim().min(1).max(64),
  rulesAccepted: z.literal(true),
  captchaToken: z.string().trim().min(16).max(4096),
}).strict();

export type RaffleEntryServiceResult =
  | Readonly<{ state: "submitted"; entryReference: string }>
  | Readonly<{ state: "already_entered" | "raffle_not_open" | "ineligible" }>;

export interface RaffleEntryService {
  submit(input: Readonly<{
    raffleId: string;
    email: string;
    displayName: string;
    recipientName: string;
    addressLine1: string;
    addressLine2: string;
    city: string;
    stateProvince: string;
    postalCode: string;
    countryCode: string;
    phone: string;
    rulesVersion: string;
    requestTokenHash: string;
    requestFingerprintHash: string;
  }>): Promise<RaffleEntryServiceResult | null>;
}

export type RaffleEntryRateLimitBucket = "source_hour" | "email_raffle_15m";

export interface RaffleEntryRateLimiter {
  consume(input: Readonly<{
    key: string;
    bucket: RaffleEntryRateLimitBucket;
  }>): Promise<"allowed" | "limited" | "unavailable">;
}

export interface RaffleEntryCaptchaVerifier {
  verify(input: Readonly<{
    token: string;
    sourceIdentifier: string;
    expectedHostname: string;
  }>): Promise<boolean>;
}

export type RaffleEntryEnvironment =
  | Readonly<{ ready: false; code: "runtime_disabled" | "runtime_unavailable" }>
  | Readonly<{
    ready: true;
    allowedOrigins: ReadonlySet<string>;
    rateLimitSecret: string;
  }>;

export type RaffleEntryHttpOutcome = Readonly<{
  status: number;
  body: RaffleEntryClientResponse;
}>;

type RaffleEntryDependencies = Readonly<{
  environment: RaffleEntryEnvironment;
  service?: RaffleEntryService;
  rateLimiter?: RaffleEntryRateLimiter;
  captchaVerifier?: RaffleEntryCaptchaVerifier;
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

export function getRaffleEntryEnvironment(
  environment: Readonly<Record<string, string | undefined>> = process.env,
): RaffleEntryEnvironment {
  if (environment.COMMERCE_RAFFLE_ENTRY_ENABLED?.trim().toLowerCase() !== "true") {
    return { ready: false, code: "runtime_disabled" };
  }

  const rawOrigins = environment.COMMERCE_RAFFLE_ENTRY_ALLOWED_ORIGINS?.split(",")
    .map((origin) => origin.trim())
    .filter(Boolean) ?? [];
  const normalizedOrigins = rawOrigins.map(normalizeAllowedOrigin);
  const validOrigins = normalizedOrigins.filter((origin): origin is string => origin !== null);
  const rateLimitSecret = environment.COMMERCE_RAFFLE_ENTRY_RATE_LIMIT_SECRET?.trim();
  const turnstileSecret = environment.COMMERCE_RAFFLE_ENTRY_TURNSTILE_SECRET?.trim();
  const supabaseUrl = environment.NEXT_PUBLIC_SUPABASE_URL?.trim();
  const supabaseSecret = environment.SUPABASE_SECRET_KEY?.trim();

  if (
    !rateLimitSecret ||
    rateLimitSecret.length < 32 ||
    !turnstileSecret ||
    !supabaseUrl ||
    !supabaseSecret ||
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

export function getRaffleEntrySourceIdentifier(headers: Headers): string | undefined {
  const forwarded = headers.get("x-vercel-forwarded-for") ?? headers.get("x-forwarded-for");
  const candidate = forwarded?.split(",")[0]?.trim();
  return candidate && isIP(candidate) !== 0 ? candidate : undefined;
}

export function createRaffleEntryKey(secret: string, scope: string, value: string): string {
  return createHmac("sha256", secret).update(`${scope}:${value}`).digest("hex");
}

function createRequestFingerprint(input: z.infer<typeof raffleEntryRequestSchema>): string {
  return createHash("sha256")
    .update(JSON.stringify({
      raffleId: input.raffleId,
      email: input.email,
      displayName: input.displayName,
      recipientName: input.recipientName,
      addressLine1: input.addressLine1,
      addressLine2: input.addressLine2,
      city: input.city,
      stateProvince: input.stateProvince,
      postalCode: input.postalCode,
      countryCode: input.countryCode,
      phone: input.phone,
      rulesVersion: input.rulesVersion,
      rulesAccepted: input.rulesAccepted,
    }))
    .digest("hex");
}

function createRequestTokenHash(requestId: string): string {
  return createHash("sha256").update(requestId).digest("hex");
}

function failure(
  status: number,
  code: Extract<RaffleEntryHttpOutcome["body"], { ok: false }>["code"],
): RaffleEntryHttpOutcome {
  return { status, body: { ok: false, code } };
}

async function parseBody(request: Request): Promise<z.infer<typeof raffleEntryRequestSchema> | null> {
  const contentLength = Number.parseInt(request.headers.get("content-length") ?? "0", 10);
  if (Number.isFinite(contentLength) && contentLength > RAFFLE_ENTRY_REQUEST_MAX_BYTES) return null;

  try {
    const text = await request.text();
    if (Buffer.byteLength(text, "utf8") > RAFFLE_ENTRY_REQUEST_MAX_BYTES) return null;
    const parsed: unknown = JSON.parse(text);
    const result = raffleEntryRequestSchema.safeParse(parsed);
    return result.success ? result.data : null;
  } catch {
    return null;
  }
}

async function consumeLimit(
  rateLimiter: RaffleEntryRateLimiter,
  key: string,
  bucket: RaffleEntryRateLimitBucket,
): Promise<RaffleEntryHttpOutcome | null> {
  try {
    const result = await rateLimiter.consume({ key, bucket });
    if (result === "limited") return failure(429, "rate_limited");
    if (result === "unavailable") return failure(503, "entry_unavailable");
    return null;
  } catch {
    return failure(503, "entry_unavailable");
  }
}

export async function handleRaffleEntryRequest(
  request: Request,
  dependencies: RaffleEntryDependencies,
): Promise<RaffleEntryHttpOutcome> {
  if (!dependencies.environment.ready) {
    return failure(
      dependencies.environment.code === "runtime_disabled" ? 404 : 503,
      "entry_unavailable",
    );
  }

  const contentType = request.headers.get("content-type")?.split(";", 1)[0]?.trim().toLowerCase() ?? "";
  const origin = request.headers.get("origin");
  const fetchSite = request.headers.get("sec-fetch-site");
  if (
    contentType !== "application/json" ||
    !origin ||
    !dependencies.environment.allowedOrigins.has(origin) ||
    request.headers.get(RAFFLE_ENTRY_REQUEST_HEADER) !== RAFFLE_ENTRY_REQUEST_HEADER_VALUE ||
    (fetchSite !== null && fetchSite !== "same-origin")
  ) {
    return failure(403, "invalid_request");
  }

  if (
    !dependencies.service ||
    !dependencies.rateLimiter ||
    !dependencies.captchaVerifier ||
    !dependencies.sourceIdentifier
  ) {
    return failure(503, "entry_unavailable");
  }

  const sourceKey = createRaffleEntryKey(
    dependencies.environment.rateLimitSecret,
    "source",
    dependencies.sourceIdentifier,
  );
  const sourceLimit = await consumeLimit(dependencies.rateLimiter, sourceKey, "source_hour");
  if (sourceLimit) return sourceLimit;

  const input = await parseBody(request);
  if (!input) return failure(400, "invalid_request");

  let captchaAccepted = false;
  try {
    captchaAccepted = await dependencies.captchaVerifier.verify({
      token: input.captchaToken,
      sourceIdentifier: dependencies.sourceIdentifier,
      expectedHostname: new URL(origin).hostname,
    });
  } catch {
    return failure(503, "entry_unavailable");
  }
  if (!captchaAccepted) return failure(400, "invalid_request");

  const emailKey = createRaffleEntryKey(
    dependencies.environment.rateLimitSecret,
    "email-raffle",
    `${input.raffleId}:${input.email}`,
  );
  const emailLimit = await consumeLimit(dependencies.rateLimiter, emailKey, "email_raffle_15m");
  if (emailLimit) return emailLimit;

  try {
    const result = await dependencies.service.submit({
      raffleId: input.raffleId,
      email: input.email,
      displayName: input.displayName,
      recipientName: input.recipientName,
      addressLine1: input.addressLine1,
      addressLine2: input.addressLine2,
      city: input.city,
      stateProvince: input.stateProvince,
      postalCode: input.postalCode,
      countryCode: input.countryCode,
      phone: input.phone,
      rulesVersion: input.rulesVersion,
      requestTokenHash: createRequestTokenHash(input.requestId),
      requestFingerprintHash: createRequestFingerprint(input),
    });

    if (!result) return failure(503, "entry_unavailable");
    if (result.state === "submitted") {
      return { status: 201, body: { ok: true, state: "submitted", entryReference: result.entryReference } };
    }
    if (result.state === "already_entered") {
      return { status: 202, body: { ok: true, state: "already_entered" } };
    }
    if (result.state === "raffle_not_open") return failure(409, "raffle_not_open");
    return failure(403, "ineligible");
  } catch {
    return failure(503, "entry_unavailable");
  }
}
