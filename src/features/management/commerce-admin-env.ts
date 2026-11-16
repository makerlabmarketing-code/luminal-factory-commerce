import "server-only";

import { z } from "zod";

import { COMMERCE_ADMIN_MIN_SECRET_BYTES } from "./commerce-admin-security-contract";
import { COMMERCE_ADMIN_SCOPES, type CommerceAdminScope } from "./commerce-admin-contract";

const safeToken = z.string().trim().min(1).max(128).regex(/^[A-Za-z0-9._:-]+$/);

const commerceAdminEnvironmentSchema = z
  .object({
    enabled: z.boolean(),
    clientId: safeToken.optional(),
    audience: safeToken.optional(),
    currentKeyId: safeToken.optional(),
    currentSecretBase64: z.string().trim().min(1).optional(),
    currentAllowedScopes: z.string().optional(),
    previousKeyId: safeToken.optional(),
    previousSecretBase64: z.string().trim().min(1).optional(),
    previousAllowedScopes: z.string().optional(),
  })
  .strict()
  .superRefine((value, context) => {
    if (!value.enabled) return;

    for (const [field, present] of [
      ["clientId", Boolean(value.clientId)],
      ["audience", Boolean(value.audience)],
      ["currentKeyId", Boolean(value.currentKeyId)],
      ["currentSecretBase64", Boolean(value.currentSecretBase64)],
    ] as const) {
      if (!present) {
        context.addIssue({ code: "custom", path: [field], message: `${field} is required when Commerce Admin integration is enabled.` });
      }
    }

    const hasPreviousKey = Boolean(value.previousKeyId);
    const hasPreviousSecret = Boolean(value.previousSecretBase64);
    if (hasPreviousKey !== hasPreviousSecret) {
      context.addIssue({ code: "custom", message: "Previous HMAC key id and secret must be configured together." });
    }
    if (value.previousAllowedScopes !== undefined && !value.previousKeyId) {
      context.addIssue({ code: "custom", path: ["previousAllowedScopes"], message: "Previous key scopes require a configured previous key." });
    }
    if (value.previousKeyId && value.previousKeyId === value.currentKeyId) {
      context.addIssue({ code: "custom", path: ["previousKeyId"], message: "Previous and current HMAC key ids must differ." });
    }
  });

export type CommerceAdminEnvironment = Readonly<{
  enabled: boolean;
  clientId?: string;
  audience?: string;
  currentKeyId?: string;
  currentSecret?: Uint8Array;
  currentAllowedScopes?: ReadonlySet<CommerceAdminScope>;
  previousKeyId?: string;
  previousSecret?: Uint8Array;
  previousAllowedScopes?: ReadonlySet<CommerceAdminScope>;
}>;


// Legacy credentials keep their existing permissions until a reviewed allowlist
// is configured. Explicit empty, unknown or duplicate scopes always fail closed.
function parseAllowedScopes(
  rawValue: string | undefined,
  fallback: ReadonlySet<CommerceAdminScope>,
): ReadonlySet<CommerceAdminScope> {
  if (rawValue === undefined) return new Set(fallback);

  const names = rawValue.split(",").map((scope) => scope.trim());
  const known = new Set<string>(COMMERCE_ADMIN_SCOPES);
  if (names.some((scope) => !scope || !known.has(scope)) || new Set(names).size !== names.length) {
    throw new Error("Commerce Admin HMAC scope allowlist is invalid.");
  }

  return new Set(names as CommerceAdminScope[]);
}

function decodeSecretBase64(value: string | undefined): Uint8Array | undefined {
  if (!value) return undefined;
  if (!/^[A-Za-z0-9+/]+={0,2}$/.test(value) || value.length % 4 !== 0) {
    throw new Error("Commerce Admin HMAC secret must be canonical base64.");
  }

  const decoded = Buffer.from(value, "base64");
  if (decoded.byteLength < COMMERCE_ADMIN_MIN_SECRET_BYTES) {
    throw new Error(`Commerce Admin HMAC secret must decode to at least ${COMMERCE_ADMIN_MIN_SECRET_BYTES} bytes.`);
  }
  if (decoded.toString("base64") !== value) {
    throw new Error("Commerce Admin HMAC secret must use canonical base64 encoding.");
  }

  return new Uint8Array(decoded);
}

export function readCommerceAdminEnvironment(env: NodeJS.ProcessEnv = process.env): CommerceAdminEnvironment {
  const parsed = commerceAdminEnvironmentSchema.parse({
    enabled: env.COMMERCE_ADMIN_INTEGRATION_ENABLED === "true",
    clientId: env.COMMERCE_ADMIN_HMAC_CLIENT_ID,
    audience: env.COMMERCE_ADMIN_HMAC_AUDIENCE,
    currentKeyId: env.COMMERCE_ADMIN_HMAC_CURRENT_KEY_ID,
    currentSecretBase64: env.COMMERCE_ADMIN_HMAC_CURRENT_SECRET_BASE64,
    currentAllowedScopes: env.COMMERCE_ADMIN_HMAC_CURRENT_ALLOWED_SCOPES,
    previousKeyId: env.COMMERCE_ADMIN_HMAC_PREVIOUS_KEY_ID,
    previousSecretBase64: env.COMMERCE_ADMIN_HMAC_PREVIOUS_SECRET_BASE64,
    previousAllowedScopes: env.COMMERCE_ADMIN_HMAC_PREVIOUS_ALLOWED_SCOPES,
  });

  if (!parsed.enabled) return { enabled: false };

  const currentAllowedScopes = parseAllowedScopes(
    parsed.currentAllowedScopes,
    new Set(COMMERCE_ADMIN_SCOPES),
  );
  const previousAllowedScopes = parsed.previousKeyId
    ? parseAllowedScopes(parsed.previousAllowedScopes, currentAllowedScopes)
    : undefined;
  if (previousAllowedScopes && [...previousAllowedScopes].some((scope) => !currentAllowedScopes.has(scope))) {
    throw new Error("Previous HMAC key scopes must not exceed the current key allowlist.");
  }

  return {
    enabled: true,
    clientId: parsed.clientId,
    audience: parsed.audience,
    currentKeyId: parsed.currentKeyId,
    currentSecret: decodeSecretBase64(parsed.currentSecretBase64),
    currentAllowedScopes,
    previousKeyId: parsed.previousKeyId,
    previousSecret: decodeSecretBase64(parsed.previousSecretBase64),
    previousAllowedScopes,
  };
}
