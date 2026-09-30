import { createHash, createHmac, randomBytes, randomUUID } from "node:crypto";
import { pathToFileURL } from "node:url";

const HERO_PATH = "/api/admin/v1/homepage-hero";
const VERSION = "lfc-hmac-v1";
const CONTRACT = "2026-09-11";

function required(env, name) {
  const value = env[name]?.trim();
  if (!value) throw new Error(`${name} is required.`);
  return value;
}

function token(value, name) {
  if (!/^[A-Za-z0-9._:-]{1,128}$/.test(value)) throw new Error(`${name} is invalid.`);
  return value;
}

function secret(value) {
  const decoded = Buffer.from(value, "base64");
  if (decoded.length < 32 || decoded.toString("base64") !== value) {
    throw new Error("The HMAC secret must be canonical base64 of at least 32 bytes.");
  }
  return decoded;
}

export function readHandshakeEnvironment(env = process.env) {
  let target;
  try { target = new URL(required(env, "COMMERCE_ADMIN_SMOKE_URL")); }
  catch { throw new Error("COMMERCE_ADMIN_SMOKE_URL must be a local HTTPS origin."); }
  // The no-cost test topology is a local process, never a Production alias.
  if (target.protocol !== "https:" || !["localhost", "127.0.0.1", "[::1]"].includes(target.hostname)
    || target.username || target.password || target.pathname !== "/" || target.search || target.hash) {
    throw new Error("COMMERCE_ADMIN_SMOKE_URL must be a local HTTPS origin.");
  }
  if (env.NODE_TLS_REJECT_UNAUTHORIZED === "0") throw new Error("TLS certificate verification must remain enabled.");
  const config = {
    target,
    clientId: token(required(env, "COMMERCE_ADMIN_API_CLIENT_ID"), "Client ID"),
    keyId: token(required(env, "COMMERCE_ADMIN_API_KEY_ID"), "Key ID"),
    audience: token(required(env, "COMMERCE_ADMIN_API_AUDIENCE"), "Audience"),
    actorId: token(required(env, "COMMERCE_ADMIN_SMOKE_ACTOR_ID"), "Actor ID"),
    workspaceId: token(required(env, "COMMERCE_ADMIN_API_WORKSPACE_ID"), "Workspace ID"),
    secret: secret(required(env, "COMMERCE_ADMIN_API_HMAC_SECRET_BASE64")),
  };
  const previousKeyId = env.COMMERCE_ADMIN_SMOKE_PREVIOUS_KEY_ID?.trim();
  const previousSecret = env.COMMERCE_ADMIN_SMOKE_PREVIOUS_SECRET_BASE64?.trim();
  if (Boolean(previousKeyId) !== Boolean(previousSecret)) throw new Error("Both previous-key test variables are required together.");
  if (previousKeyId) {
    if (previousKeyId === config.keyId) throw new Error("Previous and current key IDs must differ.");
    config.previous = { keyId: token(previousKeyId, "Previous key ID"), secret: secret(previousSecret) };
  }
  const revokedKeyId = env.COMMERCE_ADMIN_SMOKE_REVOKED_KEY_ID?.trim();
  const revokedSecret = env.COMMERCE_ADMIN_SMOKE_REVOKED_SECRET_BASE64?.trim();
  if (Boolean(revokedKeyId) !== Boolean(revokedSecret)) throw new Error("Both revoked-key test variables are required together.");
  if (revokedKeyId) {
    if ([config.keyId, previousKeyId].includes(revokedKeyId)) throw new Error("Revoked and accepted key IDs must differ.");
    config.revoked = { keyId: token(revokedKeyId, "Revoked key ID"), secret: secret(revokedSecret) };
  }
  return config;
}

export function signHandshakeRequest(config, input = {}) {
  const method = input.method ?? "GET";
  const path = input.path ?? HERO_PATH;
  const rawBody = input.rawBody ?? "";
  const scope = input.scope ?? "commerce.hero.read";
  const requestId = input.requestId ?? randomUUID();
  const timestamp = input.timestamp ?? Math.floor(Date.now() / 1000);
  const nonce = input.nonce ?? randomBytes(24).toString("base64url");
  const bodySha256 = createHash("sha256").update(rawBody, "utf8").digest("hex");
  const canonical = [VERSION, config.clientId, config.keyId, config.audience, requestId, String(timestamp), nonce,
    config.actorId, config.workspaceId, scope, method, path, "application/json", bodySha256].join("\n");
  const headers = {
    "content-type": "application/json",
    "x-luminal-signature-version": VERSION,
    "x-luminal-client-id": config.clientId,
    "x-luminal-key-id": config.keyId,
    "x-luminal-audience": config.audience,
    "x-luminal-request-id": requestId,
    "x-luminal-timestamp": String(timestamp),
    "x-luminal-nonce": nonce,
    "x-luminal-actor-id": config.actorId,
    "x-luminal-workspace-id": config.workspaceId,
    "x-luminal-scope": scope,
    "x-luminal-body-sha256": bodySha256,
    "x-luminal-signature": createHmac("sha256", config.secret).update(canonical, "utf8").digest("hex"),
  };
  return { method, path, rawBody, headers };
}

export async function verifyHandshake(config, fetchRequest = fetch) {
  const cases = [];
  async function check(name, request, expectedStatus) {
    let response;
    try {
      response = await fetchRequest(new URL(request.path, config.target), {
        method: request.method, headers: request.headers,
        ...(request.method === "GET" ? {} : { body: request.rawBody }),
        redirect: "manual", signal: AbortSignal.timeout(10_000),
      });
    } catch { throw new Error(`${name}: HTTPS request failed; check local server and trusted certificate.`); }
    if (!response.headers.get("content-type")?.includes("application/json")
      || !/(?:^|,)\s*no-store\s*(?:,|$)/i.test(response.headers.get("cache-control") ?? "")) {
      throw new Error(`${name}: expected a no-store application JSON response.`);
    }
    let body;
    try { body = await response.json(); }
    catch { throw new Error(`${name}: invalid application response.`); }
    if (body?.error?.code === "INTEGRATION_DISABLED") {
      throw new Error("The local test runtime is disabled. Keep Production disabled; enable only the local test process.");
    }
    if (response.status !== expectedStatus || body?.meta?.contractVersion !== CONTRACT
      || body.meta.requestId !== request.headers["x-luminal-request-id"]
      || (expectedStatus === 200 ? body.ok !== true : body.ok !== false || body.error?.code !== "AUTHENTICATION_FAILED")) {
      throw new Error(`${name}: unexpected status or application contract.`);
    }
    // Never return remote Hero data, headers, identities or credential material.
    cases.push({ name, status: "PASS" });
  }
  const valid = signHandshakeRequest(config);
  await check("authorized_read", valid, 200);
  await check("nonce_replay", valid, 401);
  const signature = signHandshakeRequest(config);
  signature.headers["x-luminal-signature"] = "0".repeat(64);
  await check("signature_tamper", signature, 401);
  const path = signHandshakeRequest(config);
  path.path = `${HERO_PATH}/assets`;
  await check("path_tamper", path, 401);
  const scope = signHandshakeRequest(config);
  scope.headers["x-luminal-scope"] = "commerce.hero.write";
  await check("scope_tamper", scope, 401);
  const body = signHandshakeRequest(config, { method: "POST", rawBody: "{}", scope: "commerce.hero.write" });
  // Both bodies are invalid drafts even if a broken verifier lets them through.
  body.rawBody = '{"tampered":true}';
  await check("body_tamper", body, 401);
  await check("expired_timestamp", signHandshakeRequest(config, { timestamp: Math.floor(Date.now() / 1000) - 300 }), 401);
  if (config.previous) {
    await check("previous_key_read", signHandshakeRequest({ ...config, ...config.previous }), 200);
  }
  if (config.revoked) {
    await check("revoked_key_rejected", signHandshakeRequest({ ...config, ...config.revoked }), 401);
  }
  return { status: "HANDSHAKE_ONLY_PASS", cases, rotation: config.previous ? "PREVIOUS_KEY_ACCEPTED" : "NOT_RUN",
    revocation: config.revoked ? "REVOKED_KEY_REJECTED" : "NOT_RUN",
    draftIdempotency: "NOT_RUN", erpSession: "NOT_RUN", productionActivation: "NOT_RUN" };
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  try { process.stdout.write(`${JSON.stringify(await verifyHandshake(readHandshakeEnvironment()), null, 2)}\n`); }
  catch (error) {
    process.stderr.write(`${error instanceof Error ? error.message : "Handshake verification failed."}\n`);
    process.exitCode = 1;
  }
}
