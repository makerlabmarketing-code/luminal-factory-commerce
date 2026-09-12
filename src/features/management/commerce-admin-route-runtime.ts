import "server-only";

import { createHash, randomUUID } from "node:crypto";
import { createClient } from "@supabase/supabase-js";
import { z } from "zod";
import { COMMERCE_ADMIN_SCOPES, type CommerceAdminScope } from "./commerce-admin-contract";
import { readCommerceAdminEnvironment } from "./commerce-admin-env";
import { COMMERCE_ADMIN_SECURITY_HEADERS } from "./commerce-admin-security-contract";
import { verifyCommerceAdminRequest, type CommerceAdminVerifiedIdentity } from "./commerce-admin-verifier";
import type { CommerceAdminSupabaseClient } from "./homepage-hero-admin-service";

export const COMMERCE_ADMIN_CONTRACT_VERSION = "2026-09-11" as const;
const MAX_REQUEST_BYTES = 256_000;
const requestIdSchema = z.uuid();

type PrivilegedClient = ReturnType<typeof createClient>;
type RpcClient = Readonly<{
  rpc(name: string, args: Readonly<Record<string, unknown>>): PromiseLike<{ data: unknown; error: unknown }>;
}>;

export type CommerceAdminRouteContext = Readonly<{
  identity: CommerceAdminVerifiedIdentity;
  client: CommerceAdminSupabaseClient;
  rawBodyText: string;
  requestFingerprint: string;
}>;

function responseMeta(requestId: string) {
  return { contractVersion: COMMERCE_ADMIN_CONTRACT_VERSION, requestId } as const;
}

function requestIdFrom(request: Request): string {
  const parsed = requestIdSchema.safeParse(request.headers.get(COMMERCE_ADMIN_SECURITY_HEADERS.requestId));
  return parsed.success ? parsed.data : randomUUID();
}

export function commerceAdminSuccess<T>(data: T, requestId: string, status = 200): Response {
  return Response.json({ ok: true, data, meta: responseMeta(requestId) }, { status, headers: { "Cache-Control": "no-store" } });
}

export function commerceAdminFailure(
  requestId: string,
  status: number,
  code: string,
  message: string,
  retryable = false,
): Response {
  return Response.json(
    { ok: false, error: { code, message, retryable }, meta: responseMeta(requestId) },
    { status, headers: { "Cache-Control": "no-store" } },
  );
}

function createPrivilegedClient(): PrivilegedClient {
  const supabaseUrl = String(process.env.NEXT_PUBLIC_SUPABASE_URL ?? "").trim();
  const secretKey = String(process.env.SUPABASE_SECRET_KEY ?? "").trim();
  let url: URL;
  try {
    url = new URL(supabaseUrl);
  } catch {
    throw new Error("Commerce Admin Supabase configuration is invalid.");
  }
  if (url.protocol !== "https:" || !secretKey) throw new Error("Commerce Admin Supabase configuration is invalid.");
  return createClient(url.origin, secretKey, { auth: { persistSession: false, autoRefreshToken: false } });
}

function asHomepageHeroClient(client: PrivilegedClient): CommerceAdminSupabaseClient {
  return client as unknown as CommerceAdminSupabaseClient;
}

function asRpcClient(client: PrivilegedClient | CommerceAdminSupabaseClient): RpcClient {
  return client as unknown as RpcClient;
}

function buildCredentials(environment: ReturnType<typeof readCommerceAdminEnvironment>) {
  return {
    async resolve(clientId: string, keyId: string) {
      if (!environment.enabled || clientId !== environment.clientId || !environment.audience) return null;
      const allowedScopes = new Set<CommerceAdminScope>(COMMERCE_ADMIN_SCOPES);
      if (keyId === environment.currentKeyId && environment.currentSecret) {
        return { clientId, keyId, audience: environment.audience, secret: environment.currentSecret, active: true, allowedScopes };
      }
      if (keyId === environment.previousKeyId && environment.previousSecret) {
        return { clientId, keyId, audience: environment.audience, secret: environment.previousSecret, active: true, allowedScopes };
      }
      return null;
    },
  };
}

export async function authorizeCommerceAdminRoute(
  request: Request,
  requiredScopes: readonly CommerceAdminScope[],
): Promise<CommerceAdminRouteContext | Response> {
  const requestId = requestIdFrom(request);
  let environment: ReturnType<typeof readCommerceAdminEnvironment>;
  try {
    environment = readCommerceAdminEnvironment();
  } catch {
    return commerceAdminFailure(requestId, 503, "CONFIGURATION_INVALID", "Commerce Admin API chưa được cấu hình hợp lệ.");
  }
  if (!environment.enabled) {
    return commerceAdminFailure(requestId, 503, "INTEGRATION_DISABLED", "Commerce Admin API đang tắt.");
  }

  if (new URL(request.url).search) {
    return commerceAdminFailure(requestId, 400, "REQUEST_INVALID", "Commerce Admin API v1 không hỗ trợ query string.");
  }
  const contentLength = Number(request.headers.get("content-length") ?? 0);
  if (Number.isFinite(contentLength) && contentLength > MAX_REQUEST_BYTES) {
    return commerceAdminFailure(requestId, 413, "REQUEST_TOO_LARGE", "Commerce Admin request quá lớn.");
  }

  let rawBody: Uint8Array;
  try {
    rawBody = new Uint8Array(await request.arrayBuffer());
  } catch {
    return commerceAdminFailure(requestId, 400, "REQUEST_INVALID", "Không thể đọc Commerce Admin request.");
  }
  if (rawBody.byteLength > MAX_REQUEST_BYTES) {
    return commerceAdminFailure(requestId, 413, "REQUEST_TOO_LARGE", "Commerce Admin request quá lớn.");
  }

  let privilegedClient: PrivilegedClient;
  try {
    privilegedClient = createPrivilegedClient();
  } catch {
    return commerceAdminFailure(requestId, 503, "CONFIGURATION_INVALID", "Commerce Admin API chưa được cấu hình hợp lệ.");
  }

  const replayClient = asRpcClient(privilegedClient);
  const verification = await verifyCommerceAdminRequest(
    {
      headers: request.headers,
      method: request.method,
      path: new URL(request.url).pathname,
      rawBody,
      requiredScopes,
      expectedAudience: environment.audience ?? "",
    },
    {
      credentials: buildCredentials(environment),
      replayStore: {
        async consume(input) {
          const { data, error } = await replayClient.rpc("consume_commerce_admin_nonce", {
            p_key_id: input.keyId,
            p_nonce: input.nonce,
            p_request_id: input.requestId,
          });
          if (error) throw new Error("Commerce Admin replay persistence failed.");
          return data === true;
        },
      },
    },
  ).catch(() => null);

  if (!verification?.ok) {
    return commerceAdminFailure(requestId, 401, "AUTHENTICATION_FAILED", "Commerce Admin request authentication failed.");
  }

  const rawBodyText = new TextDecoder().decode(rawBody);
  const bodyHash = request.headers.get(COMMERCE_ADMIN_SECURITY_HEADERS.bodySha256) ?? "";
  const requestFingerprint = createHash("sha256")
    .update(`${request.method.toUpperCase()}\n${new URL(request.url).pathname}\n${bodyHash}`, "utf8")
    .digest("hex");

  return { identity: verification.identity, client: asHomepageHeroClient(privilegedClient), rawBodyText, requestFingerprint };
}

export async function recordCommerceAdminAudit(
  context: CommerceAdminRouteContext,
  input: Readonly<{
    operation: string;
    targetId: string | null;
    outcome: "succeeded" | "failed";
    httpStatus: number;
    failureCode?: string | null;
  }>,
): Promise<void> {
  const { error } = await asRpcClient(context.client).rpc("record_commerce_admin_audit_event", {
    p_request_id: context.identity.requestId,
    p_client_id: context.identity.clientId,
    p_key_id: context.identity.keyId,
    p_actor_id: context.identity.actorId,
    p_workspace_id: context.identity.workspaceId,
    p_scope: context.identity.scope,
    p_operation: input.operation,
    p_target_type: "homepage_hero",
    p_target_id: input.targetId,
    p_outcome: input.outcome,
    p_http_status: input.httpStatus,
    p_failure_code: input.failureCode ?? null,
  });
  if (error) throw new Error("Commerce Admin audit persistence failed.");
}

export function parseCommerceAdminJson(rawBodyText: string): unknown {
  if (!rawBodyText) return null;
  return JSON.parse(rawBodyText) as unknown;
}
