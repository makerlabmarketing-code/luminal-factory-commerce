import { z } from "zod";

export const COMMERCE_ADMIN_SIGNATURE_VERSION = "lfc-hmac-v1" as const;
export const COMMERCE_ADMIN_SIGNATURE_ALGORITHM = "HMAC-SHA256" as const;
export const COMMERCE_ADMIN_MAX_CLOCK_SKEW_SECONDS = 90;
export const COMMERCE_ADMIN_MIN_SECRET_BYTES = 32;

export const COMMERCE_ADMIN_SECURITY_HEADERS = {
  audience: "x-luminal-audience",
  bodySha256: "x-luminal-body-sha256",
  clientId: "x-luminal-client-id",
  keyId: "x-luminal-key-id",
  nonce: "x-luminal-nonce",
  requestId: "x-luminal-request-id",
  signature: "x-luminal-signature",
  signatureVersion: "x-luminal-signature-version",
  timestamp: "x-luminal-timestamp",
  actorId: "x-luminal-actor-id",
  workspaceId: "x-luminal-workspace-id",
  scope: "x-luminal-scope",
} as const;

const safeToken = z.string().trim().min(1).max(128).regex(/^[A-Za-z0-9._:-]+$/);
const sha256Hex = z.string().regex(/^[a-f0-9]{64}$/);
const hmacSha256Hex = z.string().regex(/^[a-f0-9]{64}$/);
const nonce = z.string().min(22).max(128).regex(/^[A-Za-z0-9_-]+$/);
const requestPath = z
  .string()
  .min(1)
  .max(2048)
  .refine((value) => value.startsWith("/api/admin/v1/"), "Management request path must stay inside the v1 admin route family.")
  .refine((value) => !value.includes("#"), "Fragments are not valid in signed request targets.")
  .refine((value) => !/(^|\/)\.\.?(\/|$)/.test(value), "Signed request targets must not contain dot segments.");

export const commerceAdminSignedEnvelopeSchema = z
  .object({
    version: z.literal(COMMERCE_ADMIN_SIGNATURE_VERSION),
    clientId: safeToken,
    keyId: safeToken,
    audience: safeToken,
    requestId: z.uuid(),
    timestamp: z.number().int().nonnegative(),
    nonce,
    actorId: safeToken,
    workspaceId: safeToken,
    scope: safeToken,
    method: z.enum(["GET", "POST", "PUT", "PATCH", "DELETE"]),
    path: requestPath,
    contentType: z.literal("application/json"),
    bodySha256: sha256Hex,
    signature: hmacSha256Hex,
  })
  .strict();

export type CommerceAdminSignedEnvelope = z.infer<typeof commerceAdminSignedEnvelopeSchema>;

export type CommerceAdminCanonicalRequestInput = Readonly<
  Omit<CommerceAdminSignedEnvelope, "signature">
>;

export function buildCommerceAdminCanonicalRequest(input: CommerceAdminCanonicalRequestInput): string {
  return [
    input.version,
    input.clientId,
    input.keyId,
    input.audience,
    input.requestId,
    String(input.timestamp),
    input.nonce,
    input.actorId,
    input.workspaceId,
    input.scope,
    input.method,
    input.path,
    input.contentType,
    input.bodySha256,
  ].join("\n");
}

export function isCommerceAdminTimestampFresh(nowEpochSeconds: number, requestEpochSeconds: number): boolean {
  return Math.abs(nowEpochSeconds - requestEpochSeconds) <= COMMERCE_ADMIN_MAX_CLOCK_SKEW_SECONDS;
}
