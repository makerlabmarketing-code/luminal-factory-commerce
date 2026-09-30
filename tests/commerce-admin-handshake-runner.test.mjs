import assert from "node:assert/strict";
import { createHash, createHmac } from "node:crypto";
import { readFileSync } from "node:fs";
import test from "node:test";
import { readHandshakeEnvironment, signHandshakeRequest, verifyHandshake } from "../scripts/verify-commerce-admin-handshake.mjs";

const vector = JSON.parse(readFileSync("specs/integration/lfc-hmac-v1-test-vector.json", "utf8"));
const env = {
  COMMERCE_ADMIN_SMOKE_URL: "https://localhost:3000",
  COMMERCE_ADMIN_API_CLIENT_ID: vector.request.clientId,
  COMMERCE_ADMIN_API_KEY_ID: vector.request.keyId,
  COMMERCE_ADMIN_API_AUDIENCE: vector.request.audience,
  COMMERCE_ADMIN_SMOKE_ACTOR_ID: vector.request.actorId,
  COMMERCE_ADMIN_API_WORKSPACE_ID: vector.request.workspaceId,
  COMMERCE_ADMIN_API_HMAC_SECRET_BASE64: Buffer.from(vector.test_secret_utf8).toString("base64"),
};

function fixtureServer(config) {
  const nonces = new Set();
  const calls = [];
  const fetchRequest = async (url, request) => {
    calls.push({ url, request });
    assert.equal(request.redirect, "manual");
    const h = request.headers;
    const hash = createHash("sha256").update(request.body ?? "").digest("hex");
    const canonical = [h["x-luminal-signature-version"], h["x-luminal-client-id"], h["x-luminal-key-id"],
      h["x-luminal-audience"], h["x-luminal-request-id"], h["x-luminal-timestamp"], h["x-luminal-nonce"],
      h["x-luminal-actor-id"], h["x-luminal-workspace-id"], h["x-luminal-scope"], request.method,
      url.pathname, h["content-type"], hash].join("\n");
    const key = h["x-luminal-key-id"] === config.keyId ? config.secret : config.previous?.secret;
    const signature = key && createHmac("sha256", key).update(canonical).digest("hex");
    const authenticated = signature === h["x-luminal-signature"] && hash === h["x-luminal-body-sha256"]
      && Math.abs(Math.floor(Date.now() / 1000) - Number(h["x-luminal-timestamp"])) <= 90;
    const accepted = authenticated && !nonces.has(h["x-luminal-nonce"]);
    if (accepted) nonces.add(h["x-luminal-nonce"]);
    if (accepted) assert.equal(request.method, "GET", "A mutation must never pass this probe.");
    return Response.json({ ok: accepted, ...(accepted ? { data: { privateFixture: "must-not-appear" } }
      : { error: { code: "AUTHENTICATION_FAILED" } }),
    meta: { contractVersion: "2026-09-11", requestId: h["x-luminal-request-id"] } },
    { status: accepted ? 200 : 401, headers: { "cache-control": "no-store" } });
  };
  return { fetchRequest, calls };
}

test("handshake signer matches the shared ERP/Commerce compatibility vector", () => {
  const signed = signHandshakeRequest(readHandshakeEnvironment(env), {
    ...vector.request, rawBody: vector.request.rawBodyUtf8,
  });
  assert.equal(signed.headers["x-luminal-signature"], vector.expectedHmacSha256Hex);
});

test("handshake runs bounded tamper/replay cases without an authorized mutation or output disclosure", async () => {
  const config = readHandshakeEnvironment(env);
  const server = fixtureServer(config);
  const result = await verifyHandshake(config, server.fetchRequest);
  assert.equal(server.calls.length, 7);
  assert.ok(result.cases.every((item) => item.status === "PASS"));
  assert.equal(result.draftIdempotency, "NOT_RUN");
  assert.equal(result.erpSession, "NOT_RUN");
  assert.equal(result.rotation, "NOT_RUN");
  assert.doesNotMatch(JSON.stringify(result), /must-not-appear|x-luminal|user_erp/);
  assert.ok(!JSON.stringify(result).includes(env.COMMERCE_ADMIN_API_HMAC_SECRET_BASE64));
});

test("local target guard rejects Production, insecure transport, URL credentials and disabled TLS", () => {
  for (const url of ["https://luminalfactory.com", "https://deployment.vercel.app", "http://localhost:3000",
    "https://user:password@localhost:3000", "https://localhost:3000/?token=secret", "https://localhost:3000/api"] ) {
    assert.throws(() => readHandshakeEnvironment({ ...env, COMMERCE_ADMIN_SMOKE_URL: url }), /local HTTPS origin/);
  }
  assert.throws(() => readHandshakeEnvironment({ ...env, NODE_TLS_REJECT_UNAUTHORIZED: "0" }), /verification/);
  for (const key of ["short", Buffer.from("too short").toString("base64"), `${env.COMMERCE_ADMIN_API_HMAC_SECRET_BASE64}=`]) {
    assert.throws(() => readHandshakeEnvironment({ ...env, COMMERCE_ADMIN_API_HMAC_SECRET_BASE64: key }), /canonical base64/);
  }
});

test("disabled runtime stops immediately and is not treated as a handshake pass", async () => {
  let calls = 0;
  await assert.rejects(verifyHandshake(readHandshakeEnvironment(env), async () => {
    calls += 1;
    return Response.json({ ok: false, error: { code: "INTEGRATION_DISABLED" } },
      { status: 503, headers: { "cache-control": "no-store" } });
  }), /local test runtime is disabled/);
  assert.equal(calls, 1);
});

test("rotation is reported separately and requires a matching previous-key pair", async () => {
  assert.throws(() => readHandshakeEnvironment({ ...env, COMMERCE_ADMIN_SMOKE_PREVIOUS_KEY_ID: "previous" }), /together/);
  const config = readHandshakeEnvironment({ ...env, COMMERCE_ADMIN_SMOKE_PREVIOUS_KEY_ID: "previous",
    COMMERCE_ADMIN_SMOKE_PREVIOUS_SECRET_BASE64: Buffer.alloc(32, 7).toString("base64") });
  const server = fixtureServer(config);
  const result = await verifyHandshake(config, server.fetchRequest);
  assert.equal(server.calls.length, 8);
  assert.equal(result.rotation, "PREVIOUS_KEY_ACCEPTED");
});

test("redirects and malformed remote replies fail without printing their content", async () => {
  for (const response of [new Response("private payload", { status: 302, headers: { location: "https://elsewhere.invalid" } }),
    Response.json({ secret: "private payload" }, { headers: { "cache-control": "no-store" } })]) {
    await assert.rejects(verifyHandshake(readHandshakeEnvironment(env), async () => response),
      (error) => !error.message.includes("private payload"));
  }
});
