import assert from "node:assert/strict";
import { randomBytes } from "node:crypto";
import { readFileSync } from "node:fs";
import { createRequire } from "node:module";
import { dirname, resolve } from "node:path";
import { runInThisContext } from "node:vm";
import test from "node:test";
import ts from "typescript";
import { signHandshakeRequest, verifyHandshake, readHandshakeEnvironment } from "../scripts/verify-commerce-admin-handshake.mjs";

// Execute the actual TypeScript verifier and its contracts, not a copied HMAC implementation.
const require = createRequire(import.meta.url);
const modules = new Map();
function loadSource(file) {
  if (modules.has(file)) return modules.get(file).exports;
  const compiledModule = { exports: {} };
  modules.set(file, compiledModule);
  const code = ts.transpileModule(readFileSync(file, "utf8"), {
    compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022 },
  }).outputText;
  const execute = runInThisContext(`(function(require, module, exports) { ${code}\n})`, { filename: file });
  execute((specifier) => specifier.startsWith(".")
    ? loadSource(resolve(dirname(file), `${specifier}.ts`)) : require(specifier), compiledModule, compiledModule.exports);
  return compiledModule.exports;
}
const { verifyCommerceAdminRequest } = loadSource(resolve("src/features/management/commerce-admin-verifier.ts"));

function fixture() {
  const config = readHandshakeEnvironment({
    COMMERCE_ADMIN_SMOKE_URL: "https://localhost:3000",
    COMMERCE_ADMIN_API_CLIENT_ID: "erp-test",
    COMMERCE_ADMIN_API_KEY_ID: "current-test",
    COMMERCE_ADMIN_API_AUDIENCE: "commerce-local-test",
    COMMERCE_ADMIN_SMOKE_ACTOR_ID: "operator-test",
    COMMERCE_ADMIN_API_WORKSPACE_ID: "workspace-test",
    COMMERCE_ADMIN_API_HMAC_SECRET_BASE64: randomBytes(32).toString("base64"),
    COMMERCE_ADMIN_SMOKE_PREVIOUS_KEY_ID: "previous-test",
    COMMERCE_ADMIN_SMOKE_PREVIOUS_SECRET_BASE64: randomBytes(32).toString("base64"),
    COMMERCE_ADMIN_SMOKE_REVOKED_KEY_ID: "revoked-test",
    COMMERCE_ADMIN_SMOKE_REVOKED_SECRET_BASE64: randomBytes(32).toString("base64"),
  });
  const consumed = new Set();
  let consumeCalls = 0;
  const dependencies = {
    credentials: { async resolve(clientId, keyId) {
      const key = [config, config.previous].find((key) => key.keyId === keyId);
      return clientId === config.clientId && key ? {
        clientId, keyId, audience: config.audience, secret: key.secret, active: true,
        allowedScopes: new Set(["commerce.hero.read", "commerce.hero.write"]),
      } : null;
    } },
    replayStore: { async consume({ keyId, nonce }) {
      consumeCalls++;
      const identity = `${keyId}:${nonce}`;
      if (consumed.has(identity)) return false;
      consumed.add(identity);
      return true;
    } },
  };
  function verify(request, requiredScopes = ["commerce.hero.read"]) {
    return verifyCommerceAdminRequest({ headers: new Headers(request.headers), method: request.method,
      path: request.path, rawBody: Buffer.from(request.rawBody), requiredScopes,
      expectedAudience: config.audience }, dependencies);
  }
  return { config, verify, consumeCalls: () => consumeCalls };
}

test("handshake runner passes the production verifier including overlap and revoked keys", async () => {
  const { config, verify, consumeCalls } = fixture();
  const result = await verifyHandshake(config, async (url, request) => {
    const verified = await verify({ ...request, path: url.pathname, rawBody: request.body ?? "" },
      [request.method === "GET" ? "commerce.hero.read" : "commerce.hero.write"]);
    const requestId = request.headers["x-luminal-request-id"];
    return Response.json({ ok: verified.ok, ...(verified.ok ? { data: [] }
      : { error: { code: "AUTHENTICATION_FAILED", message: "Denied", retryable: false } }),
      meta: { requestId, contractVersion: "2026-09-11" } },
    { status: verified.ok ? 200 : 401, headers: { "cache-control": "no-store" } });
  });
  assert.equal(result.cases.length, 9);
  assert.equal(result.revocation, "REVOKED_KEY_REJECTED");
  assert.equal(consumeCalls(), 3); // Authorized read, its replay, previous-key read only.
});

test("invalid identity, audience and scope cannot consume nonce state", async () => {
  const { config, verify, consumeCalls } = fixture();
  for (const field of ["actor-id", "workspace-id", "audience", "client-id", "key-id"]) {
    const request = signHandshakeRequest(config);
    request.headers[`x-luminal-${field}`] = "tampered-test";
    assert.equal((await verify(request)).ok, false);
  }
  assert.equal((await verify(signHandshakeRequest(config, { scope: "commerce.hero.write" }))).ok, false);
  assert.equal((await verify(signHandshakeRequest(config, { scope: "commerce.hero.publish" }), ["commerce.hero.publish"])).ok, false);
  assert.equal(consumeCalls(), 0);
});

test("draft retries require a fresh nonce while signing the same operation body bytes", async () => {
  const { config, verify } = fixture();
  const rawBody = JSON.stringify({ operationId: "22222222-2222-4222-8222-222222222222", draft: { name: "Mèo hề — nháp" } });
  const input = { method: "POST", scope: "commerce.hero.write", rawBody };
  const first = signHandshakeRequest(config, input);
  const retry = signHandshakeRequest(config, input);
  assert.equal(first.rawBody, retry.rawBody);
  assert.notEqual(first.headers["x-luminal-nonce"], retry.headers["x-luminal-nonce"]);
  assert.equal((await verify(first, [input.scope])).ok, true);
  assert.equal((await verify(first, [input.scope])).reason, "replay");
  assert.equal((await verify(retry, [input.scope])).ok, true);
});

test("revoked-key setup is paired and cannot identify an accepted key", () => {
  const { config } = fixture();
  const env = {
    COMMERCE_ADMIN_SMOKE_URL: config.target.href, COMMERCE_ADMIN_API_CLIENT_ID: config.clientId,
    COMMERCE_ADMIN_API_KEY_ID: config.keyId, COMMERCE_ADMIN_API_AUDIENCE: config.audience,
    COMMERCE_ADMIN_SMOKE_ACTOR_ID: config.actorId, COMMERCE_ADMIN_API_WORKSPACE_ID: config.workspaceId,
    COMMERCE_ADMIN_API_HMAC_SECRET_BASE64: config.secret.toString("base64"),
    COMMERCE_ADMIN_SMOKE_REVOKED_KEY_ID: config.keyId,
  };
  assert.throws(() => readHandshakeEnvironment(env), /together/);
  assert.throws(() => readHandshakeEnvironment({ ...env,
    COMMERCE_ADMIN_SMOKE_REVOKED_SECRET_BASE64: config.revoked.secret.toString("base64") }), /must differ/);
});
