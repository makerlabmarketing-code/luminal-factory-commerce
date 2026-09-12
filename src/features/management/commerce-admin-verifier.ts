import { createHash, createHmac, timingSafeEqual } from "node:crypto";

import {
  COMMERCE_ADMIN_MIN_SECRET_BYTES,
  COMMERCE_ADMIN_SECURITY_HEADERS,
  COMMERCE_ADMIN_SIGNATURE_VERSION,
  buildCommerceAdminCanonicalRequest,
  commerceAdminSignedEnvelopeSchema,
  isCommerceAdminTimestampFresh,
} from "./commerce-admin-security-contract";
import { COMMERCE_ADMIN_SCOPES, type CommerceAdminScope } from "./commerce-admin-contract";

export type CommerceAdminCredential = Readonly<{
  clientId: string;
  keyId: string;
  audience: string;
  secret: Uint8Array;
  active: boolean;
  allowedScopes: ReadonlySet<CommerceAdminScope>;
}>;

export interface CommerceAdminCredentialProvider {
  resolve(clientId: string, keyId: string): Promise<CommerceAdminCredential | null>;
}

export interface CommerceAdminReplayStore {
  consume(input: Readonly<{
    keyId: string;
    nonce: string;
    requestId: string;
  }>): Promise<boolean>;
}

export type CommerceAdminVerifiedIdentity = Readonly<{
  subject: string;
  clientId: string;
  keyId: string;
  actorId: string;
  workspaceId: string;
  scope: CommerceAdminScope;
  requestId: string;
}>;

export type CommerceAdminVerificationResult =
  | Readonly<{ ok: true; identity: CommerceAdminVerifiedIdentity }>
  | Readonly<{ ok: false }>;

export type CommerceAdminVerificationInput = Readonly<{
  headers: Headers;
  method: string;
  path: string;
  rawBody: Uint8Array;
  requiredScopes: readonly CommerceAdminScope[];
  expectedAudience: string;
  nowEpochSeconds?: number;
}>;

const DUMMY_SECRET = new Uint8Array(COMMERCE_ADMIN_MIN_SECRET_BYTES);

function getHeader(headers: Headers, name: string): string | null {
  const value = headers.get(name);
  return value?.trim() || null;
}

function resolveKnownScope(value: string): CommerceAdminScope | null {
  return COMMERCE_ADMIN_SCOPES.find((scope) => scope === value) ?? null;
}

function hashesMatchHex(left: string, right: string): boolean {
  if (left.length !== right.length) return false;

  const leftBytes = Buffer.from(left, "hex");
  const rightBytes = Buffer.from(right, "hex");
  if (leftBytes.length !== rightBytes.length) return false;

  return timingSafeEqual(leftBytes, rightBytes);
}

function calculateBodySha256(rawBody: Uint8Array): string {
  return createHash("sha256").update(rawBody).digest("hex");
}

function calculateHmac(secret: Uint8Array, canonicalRequest: string): string {
  return createHmac("sha256", secret).update(canonicalRequest, "utf8").digest("hex");
}

function parseTimestamp(value: string | null): number | null {
  if (!value || !/^\d{1,16}$/.test(value)) return null;
  const parsed = Number(value);
  return Number.isSafeInteger(parsed) ? parsed : null;
}

export async function verifyCommerceAdminRequest(
  input: CommerceAdminVerificationInput,
  dependencies: Readonly<{
    credentials: CommerceAdminCredentialProvider;
    replayStore: CommerceAdminReplayStore;
  }>,
): Promise<CommerceAdminVerificationResult> {
  const timestamp = parseTimestamp(getHeader(input.headers, COMMERCE_ADMIN_SECURITY_HEADERS.timestamp));
  if (timestamp === null) return { ok: false };

  const parsed = commerceAdminSignedEnvelopeSchema.safeParse({
    version: getHeader(input.headers, COMMERCE_ADMIN_SECURITY_HEADERS.signatureVersion),
    clientId: getHeader(input.headers, COMMERCE_ADMIN_SECURITY_HEADERS.clientId),
    keyId: getHeader(input.headers, COMMERCE_ADMIN_SECURITY_HEADERS.keyId),
    audience: getHeader(input.headers, COMMERCE_ADMIN_SECURITY_HEADERS.audience),
    requestId: getHeader(input.headers, COMMERCE_ADMIN_SECURITY_HEADERS.requestId),
    timestamp,
    nonce: getHeader(input.headers, COMMERCE_ADMIN_SECURITY_HEADERS.nonce),
    actorId: getHeader(input.headers, COMMERCE_ADMIN_SECURITY_HEADERS.actorId),
    workspaceId: getHeader(input.headers, COMMERCE_ADMIN_SECURITY_HEADERS.workspaceId),
    scope: getHeader(input.headers, COMMERCE_ADMIN_SECURITY_HEADERS.scope),
    method: input.method.toUpperCase(),
    path: input.path,
    contentType: input.headers.get("content-type")?.trim().toLowerCase(),
    bodySha256: getHeader(input.headers, COMMERCE_ADMIN_SECURITY_HEADERS.bodySha256),
    signature: getHeader(input.headers, COMMERCE_ADMIN_SECURITY_HEADERS.signature),
  });

  if (!parsed.success) return { ok: false };
  const envelope = parsed.data;

  const scope = resolveKnownScope(envelope.scope);
  if (!scope) return { ok: false };
  if (!input.requiredScopes.includes(scope)) return { ok: false };

  const nowEpochSeconds = input.nowEpochSeconds ?? Math.floor(Date.now() / 1000);
  if (!isCommerceAdminTimestampFresh(nowEpochSeconds, envelope.timestamp)) return { ok: false };
  if (envelope.version !== COMMERCE_ADMIN_SIGNATURE_VERSION) return { ok: false };
  if (envelope.audience !== input.expectedAudience) return { ok: false };

  const receivedBodyHash = calculateBodySha256(input.rawBody);
  if (!hashesMatchHex(receivedBodyHash, envelope.bodySha256)) return { ok: false };

  const credential = await dependencies.credentials.resolve(envelope.clientId, envelope.keyId);
  const secret = credential?.secret ?? DUMMY_SECRET;
  const canonicalRequest = buildCommerceAdminCanonicalRequest({
    version: envelope.version,
    clientId: envelope.clientId,
    keyId: envelope.keyId,
    audience: envelope.audience,
    requestId: envelope.requestId,
    timestamp: envelope.timestamp,
    nonce: envelope.nonce,
    actorId: envelope.actorId,
    workspaceId: envelope.workspaceId,
    scope: envelope.scope,
    method: envelope.method,
    path: envelope.path,
    contentType: envelope.contentType,
    bodySha256: envelope.bodySha256,
  });
  const expectedSignature = calculateHmac(secret, canonicalRequest);
  const signatureMatches = hashesMatchHex(expectedSignature, envelope.signature);

  if (!credential || !signatureMatches) return { ok: false };
  if (!credential.active) return { ok: false };
  if (credential.clientId !== envelope.clientId || credential.keyId !== envelope.keyId) return { ok: false };
  if (credential.audience !== envelope.audience) return { ok: false };
  if (credential.secret.byteLength < COMMERCE_ADMIN_MIN_SECRET_BYTES) return { ok: false };
  if (!credential.allowedScopes.has(scope)) return { ok: false };

  const replayAccepted = await dependencies.replayStore.consume({
    keyId: envelope.keyId,
    nonce: envelope.nonce,
    requestId: envelope.requestId,
  });
  if (!replayAccepted) return { ok: false };

  return {
    ok: true,
    identity: {
      subject: `${envelope.clientId}:${envelope.actorId}`,
      clientId: envelope.clientId,
      keyId: envelope.keyId,
      actorId: envelope.actorId,
      workspaceId: envelope.workspaceId,
      scope,
      requestId: envelope.requestId,
    },
  };
}
