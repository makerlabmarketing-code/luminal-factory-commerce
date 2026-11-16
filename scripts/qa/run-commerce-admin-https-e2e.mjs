import assert from "node:assert/strict";
import { randomBytes, randomUUID } from "node:crypto";
import { readFileSync } from "node:fs";
import { createServer } from "node:https";
import { createRequire } from "node:module";
import { dirname, resolve } from "node:path";
import { runInThisContext } from "node:vm";
import ts from "typescript";
import {
  readHandshakeEnvironment,
  signHandshakeRequest,
  verifyHandshake,
} from "../verify-commerce-admin-handshake.mjs";

// Isolated test harness: actual Commerce HMAC verifier + actual HTTPS wire.
// No Supabase client, public endpoint, Production credential or Production row.
const require = createRequire(import.meta.url);
const sourceModules = new Map();
function loadTypeScript(filePath) {
  if (sourceModules.has(filePath)) return sourceModules.get(filePath).exports;
  const transpiledModule = { exports: {} };
  sourceModules.set(filePath, transpiledModule);
  const compiled = ts.transpileModule(readFileSync(filePath, "utf8"), {
    compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022 },
  }).outputText;
  const execute = runInThisContext(
    "(function(require, module, exports) { " + compiled + "\n})",
    { filename: filePath },
  );
  execute(
    (specifier) => specifier.startsWith(".")
      ? loadTypeScript(resolve(dirname(filePath), specifier + ".ts"))
      : require(specifier),
    transpiledModule,
    transpiledModule.exports,
  );
  return transpiledModule.exports;
}

const { verifyCommerceAdminRequest } = loadTypeScript(
  resolve("src/features/management/commerce-admin-verifier.ts"),
);

const testKey = randomBytes(32);
const previousKey = randomBytes(32);
const revokedKey = randomBytes(32);
const nonceSet = new Set();
const draftReceipts = new Map();
const counters = { nonceConsumes: 0, draftsCreated: 0, rejectedScope: 0 };
const server = createServer({
  key: readFileSync(process.env.LF_HTTPS_TEST_KEY),
  cert: readFileSync(process.env.LF_HTTPS_TEST_CERT),
}, async (request, response) => {
  const reply = (status, data) => {
    response.writeHead(status, {
      "content-type": "application/json",
      "cache-control": "no-store",
    });
    response.end(JSON.stringify(data));
  };
  try {
    const bodyParts = [];
    for await (const chunk of request) bodyParts.push(chunk);
    const rawBody = Buffer.concat(bodyParts);
    const requestPath = new URL(request.url, "https://127.0.0.1").pathname;
    const requestId = request.headers["x-luminal-request-id"];
    const meta = { contractVersion: "2026-09-11", requestId };
    const isPublish = requestPath.endsWith("/publish");
    const requiredScopes = isPublish ? ["commerce.hero.publish"]
      : request.method === "POST" ? ["commerce.hero.write"]
      : ["commerce.hero.read"];
    const verification = await verifyCommerceAdminRequest({
      headers: new Headers(request.headers),
      method: request.method,
      path: requestPath,
      rawBody,
      requiredScopes,
      expectedAudience: "commerce-local-ci",
    }, {
      credentials: {
        async resolve(clientId, keyId) {
          const accepted = keyId === "current-ci" ? testKey
            : keyId === "previous-ci" ? previousKey : null;
          return clientId === "erp-local-ci" && accepted ? {
            clientId,
            keyId,
            audience: "commerce-local-ci",
            secret: new Uint8Array(accepted),
            active: true,
            allowedScopes: new Set(["commerce.hero.read", "commerce.hero.write"]),
          } : null;
        },
      },
      replayStore: {
        async consume({ keyId, nonce }) {
          counters.nonceConsumes += 1;
          const token = keyId + ":" + nonce;
          if (nonceSet.has(token)) return false;
          nonceSet.add(token);
          return true;
        },
      },
    });
    if (!verification.ok) {
      if (isPublish) counters.rejectedScope += 1;
      reply(401, {
        ok: false,
        error: { code: "AUTHENTICATION_FAILED", message: "Denied", retryable: false },
        meta,
      });
      return;
    }
    if (request.method === "GET") {
      reply(200, { ok: true, data: [], meta });
      return;
    }
    // A local draft-only fixture, never a real Commerce RPC or published Hero.
    if (request.method !== "POST" || requestPath !== "/api/admin/v1/homepage-hero") {
      reply(404, { ok: false, error: { code: "NOT_FOUND" }, meta });
      return;
    }
    let parsed;
    try { parsed = JSON.parse(rawBody.toString("utf8")); }
    catch { parsed = null; }
    if (!parsed || typeof parsed.operationId !== "string"
      || !parsed.draft || typeof parsed.draft.name !== "string") {
      reply(400, { ok: false, error: { code: "INVALID_DRAFT" }, meta });
      return;
    }
    const fingerprint = JSON.stringify(parsed.draft);
    const prior = draftReceipts.get(parsed.operationId);
    if (prior && prior.fingerprint !== fingerprint) {
      reply(409, { ok: false, error: { code: "IDEMPOTENCY_CONFLICT" }, meta });
      return;
    }
    const receipt = prior ?? { id: randomUUID(), fingerprint };
    if (!prior) {
      draftReceipts.set(parsed.operationId, receipt);
      counters.draftsCreated += 1;
    }
    reply(prior ? 200 : 201, {
      ok: true, data: { draftId: receipt.id, reused: Boolean(prior) }, meta,
    });
  } catch {
    reply(500, {
      ok: false,
      error: { code: "LOCAL_FIXTURE_ERROR" },
      meta: { contractVersion: "2026-09-11", requestId: randomUUID() },
    });
  }
});

await new Promise((resolveReady, reject) => {
  server.once("error", reject);
  server.listen(0, "127.0.0.1", resolveReady);
});

try {
  const address = server.address();
  const endpoint = "https://127.0.0.1:" + address.port + "/";
  const config = readHandshakeEnvironment({
    COMMERCE_ADMIN_SMOKE_URL: endpoint,
    COMMERCE_ADMIN_API_CLIENT_ID: "erp-local-ci",
    COMMERCE_ADMIN_API_KEY_ID: "current-ci",
    COMMERCE_ADMIN_API_AUDIENCE: "commerce-local-ci",
    COMMERCE_ADMIN_API_WORKSPACE_ID: "workspace-local-ci",
    COMMERCE_ADMIN_SMOKE_ACTOR_ID: "operator-local-ci",
    COMMERCE_ADMIN_API_HMAC_SECRET_BASE64: testKey.toString("base64"),
    COMMERCE_ADMIN_SMOKE_PREVIOUS_KEY_ID: "previous-ci",
    COMMERCE_ADMIN_SMOKE_PREVIOUS_SECRET_BASE64: previousKey.toString("base64"),
    COMMERCE_ADMIN_SMOKE_REVOKED_KEY_ID: "revoked-ci",
    COMMERCE_ADMIN_SMOKE_REVOKED_SECRET_BASE64: revokedKey.toString("base64"),
  });
  const outcome = await verifyHandshake(config);
  assert.equal(outcome.cases.length, 9);
  assert.ok(outcome.cases.every((item) => item.status === "PASS"));
  assert.equal(outcome.rotation, "PREVIOUS_KEY_ACCEPTED");
  assert.equal(outcome.revocation, "REVOKED_KEY_REJECTED");
  assert.equal(outcome.draftIdempotency, "NOT_RUN");

  async function sendSigned(request) {
    const response = await fetch(new URL(request.path, endpoint), {
      method: request.method,
      headers: request.headers,
      body: request.method === "GET" ? undefined : request.rawBody,
      redirect: "manual",
      signal: AbortSignal.timeout(10_000),
    });
    assert.equal(response.headers.get("cache-control"), "no-store");
    return { status: response.status, body: await response.json() };
  }

  const beforeForbidden = counters.nonceConsumes;
  const forbidden = signHandshakeRequest(config, {
    method: "POST",
    path: "/api/admin/v1/homepage-hero/" + randomUUID() + "/publish",
    scope: "commerce.hero.publish",
    rawBody: "{}",
  });
  const refused = await sendSigned(forbidden);
  assert.equal(refused.status, 401);
  assert.equal(counters.nonceConsumes, beforeForbidden);
  assert.equal(counters.rejectedScope, 1);

  const operationId = randomUUID();
  const body = JSON.stringify({
    operationId,
    draft: { name: "LOCAL E2E DRAFT, NEVER PUBLISH" },
  });
  const draftRequest = { method: "POST", scope: "commerce.hero.write", rawBody: body };
  const original = signHandshakeRequest(config, draftRequest);
  const first = await sendSigned(original);
  assert.equal(first.status, 201);
  assert.equal(first.body.ok, true);
  assert.equal(first.body.data.reused, false);

  const retry = signHandshakeRequest(config, draftRequest);
  assert.notEqual(retry.headers["x-luminal-nonce"], original.headers["x-luminal-nonce"]);
  const second = await sendSigned(retry);
  assert.equal(second.status, 200);
  assert.equal(second.body.data.draftId, first.body.data.draftId);
  assert.equal(second.body.data.reused, true);
  assert.equal(counters.draftsCreated, 1);
  const replay = await sendSigned(original);
  assert.equal(replay.status, 401);
  assert.equal(counters.draftsCreated, 1);

  const changed = signHandshakeRequest(config, {
    ...draftRequest,
    rawBody: JSON.stringify({ operationId, draft: { name: "CHANGED LOCAL DRAFT" } }),
  });
  const conflict = await sendSigned(changed);
  assert.equal(conflict.status, 409);
  assert.equal(counters.draftsCreated, 1);
  assert.equal(draftReceipts.size, 1);
  draftReceipts.clear();
  assert.equal(draftReceipts.size, 0);

  // Only aggregate local test outcomes can leave this process.
  process.stdout.write(JSON.stringify({
    suite: "I006_LOCAL_HTTPS",
    status: "PASS",
    signedHandshakeCases: outcome.cases.length,
    rotation: "PASS",
    revokedKey: "PASS",
    forbiddenPublishScope: "PASS",
    draftIdempotency: "LOCAL_FIXTURE_PASS",
    fixtureRowsAfterCleanup: draftReceipts.size,
    productionCalls: 0,
  }) + "\n");
} finally {
  draftReceipts.clear();
  nonceSet.clear();
  await new Promise((resolveClose) => server.close(resolveClose));
}
