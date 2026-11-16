import assert from "node:assert/strict";
import { createRequire } from "node:module";
import { readFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { runInThisContext } from "node:vm";
import test from "node:test";
import ts from "typescript";
import { signHandshakeRequest } from "../scripts/verify-commerce-admin-handshake.mjs";

// Tests the actual production TypeScript parser and verifier without browser,
// Supabase, Vercel credentials, external HTTP or network requests.
const nodeRequire = createRequire(import.meta.url);
const modules = new Map();
function loadSource(path) {
  if (modules.has(path)) return modules.get(path).exports;
  const scriptModule = { exports: {} };
  modules.set(path, scriptModule);
  const javascript = ts.transpileModule(readFileSync(path, "utf8"), {
    compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022 },
  }).outputText;
  const execute = runInThisContext("(function(require, module, exports) { " + javascript + "\n})", { filename: path });
  execute(
    (name) => name === "server-only" ? {} : name.startsWith(".")
      ? loadSource(resolve(dirname(path), name + ".ts"))
      : nodeRequire(name),
    scriptModule,
    scriptModule.exports,
  );
  return scriptModule.exports;
}

const { readCommerceAdminEnvironment } = loadSource(resolve("src/features/management/commerce-admin-env.ts"));
const { verifyCommerceAdminRequest } = loadSource(resolve("src/features/management/commerce-admin-verifier.ts"));
const runtime = readFileSync("src/features/management/commerce-admin-route-runtime.ts", "utf8");
const secretA = Buffer.alloc(32, 29).toString("base64");
const secretB = Buffer.alloc(32, 37).toString("base64");

const baseline = {
  COMMERCE_ADMIN_INTEGRATION_ENABLED: "true",
  COMMERCE_ADMIN_HMAC_CLIENT_ID: "ci-erp",
  COMMERCE_ADMIN_HMAC_AUDIENCE: "ci-commerce",
  COMMERCE_ADMIN_HMAC_CURRENT_KEY_ID: "current-ci",
  COMMERCE_ADMIN_HMAC_CURRENT_SECRET_BASE64: secretA,
};
function read(overrides = {}) {
  return readCommerceAdminEnvironment({ ...baseline, ...overrides });
}
function scopes(value) {
  return [...value].sort();
}

test("key policies remain backward compatible until an explicit opt-in", () => {
  const cfg = read();
  assert.equal(cfg.enabled, true);
  assert.equal(cfg.currentAllowedScopes.size, 14);
  assert.equal(cfg.currentAllowedScopes.has("commerce.raffle.payment.manage"), true);
  assert.equal(read({ COMMERCE_ADMIN_INTEGRATION_ENABLED: "false" }).enabled, false);
});

test("current key scope allowlist is strict, bounded to known scopes and de-duplicated", () => {
  const cfg = read({ COMMERCE_ADMIN_HMAC_CURRENT_ALLOWED_SCOPES: " commerce.hero.read,commerce.hero.write " });
  assert.deepEqual(scopes(cfg.currentAllowedScopes), ["commerce.hero.read", "commerce.hero.write"]);
  for (const bad of [
    "", " ", "commerce.hero.read,", ",commerce.hero.read",
    "commerce.hero.read,commerce.hero.read", "commerce.hero.read,unknown", "*",
    "commerce.raffle.payment.manage;commerce.hero.read",
  ]) {
    assert.throws(() => read({ COMMERCE_ADMIN_HMAC_CURRENT_ALLOWED_SCOPES: bad }),
      /Commerce Admin HMAC scope allowlist is invalid/);
  }
});

test("previous HMAC key inherits the current allowlist during overlap", () => {
  const cfg = read({
    COMMERCE_ADMIN_HMAC_PREVIOUS_KEY_ID: "previous-ci",
    COMMERCE_ADMIN_HMAC_PREVIOUS_SECRET_BASE64: secretB,
    COMMERCE_ADMIN_HMAC_CURRENT_ALLOWED_SCOPES: "commerce.hero.read",
  });
  assert.deepEqual(scopes(cfg.currentAllowedScopes), ["commerce.hero.read"]);
  assert.deepEqual(scopes(cfg.previousAllowedScopes), ["commerce.hero.read"]);
});

test("previous key may be narrower, but cannot be broader than the current key", () => {
  const withPrevious = {
    COMMERCE_ADMIN_HMAC_PREVIOUS_KEY_ID: "previous-ci",
    COMMERCE_ADMIN_HMAC_PREVIOUS_SECRET_BASE64: secretB,
    COMMERCE_ADMIN_HMAC_CURRENT_ALLOWED_SCOPES: "commerce.hero.read,commerce.hero.write",
  };
  const narrow = read({
    ...withPrevious,
    COMMERCE_ADMIN_HMAC_PREVIOUS_ALLOWED_SCOPES: "commerce.hero.read",
  });
  assert.deepEqual(scopes(narrow.previousAllowedScopes), ["commerce.hero.read"]);
  assert.throws(() => read({
    ...withPrevious,
    COMMERCE_ADMIN_HMAC_PREVIOUS_ALLOWED_SCOPES: "commerce.hero.publish",
  }), /Previous HMAC key scopes must not exceed/);
  assert.throws(() => read({
    COMMERCE_ADMIN_HMAC_PREVIOUS_ALLOWED_SCOPES: "commerce.hero.read",
  }), /Previous key scopes require a configured previous key/);
});

test("Commerce runtime maps parsed permissions separately to current and previous credentials", () => {
  assert.match(runtime, /allowedScopes: environment\.currentAllowedScopes/);
  assert.match(runtime, /allowedScopes: environment\.previousAllowedScopes/);
  assert.doesNotMatch(runtime, /new Set<CommerceAdminScope>\(COMMERCE_ADMIN_SCOPES\)/);
});

test("signed request for excluded scope is rejected before consuming nonce", async () => {
  const cfg = read({
    COMMERCE_ADMIN_HMAC_CURRENT_ALLOWED_SCOPES: "commerce.hero.read,commerce.hero.write",
  });
  const signer = {
    clientId: cfg.clientId,
    keyId: cfg.currentKeyId,
    audience: cfg.audience,
    actorId: "ci-actor",
    workspaceId: "ci-workspace",
    secret: Buffer.from(cfg.currentSecret),
  };
  let consumes = 0;
  const dependencies = {
    credentials: {
      async resolve(clientId, keyId) {
        return clientId === signer.clientId && keyId === signer.keyId
          ? {
              clientId, keyId, audience: cfg.audience, secret: cfg.currentSecret,
              active: true, allowedScopes: cfg.currentAllowedScopes,
            }
          : null;
      },
    },
    replayStore: {
      async consume() { consumes += 1; return true; },
    },
  };
  async function check(scope, path) {
    const req = signHandshakeRequest(signer, { scope, path });
    return verifyCommerceAdminRequest({
      method: req.method,
      path: req.path,
      headers: new Headers(req.headers),
      rawBody: new TextEncoder().encode(req.rawBody),
      requiredScopes: [scope],
      expectedAudience: cfg.audience,
    }, dependencies);
  }
  const forbidden = await check("commerce.raffle.payment.manage", "/api/admin/v1/raffles/ci-test/payment");
  assert.equal(forbidden.ok, false);
  assert.equal(consumes, 0);
  const allowed = await check("commerce.hero.read", "/api/admin/v1/homepage-hero");
  assert.equal(allowed.ok, true);
  assert.equal(consumes, 1);
});
