import assert from "node:assert/strict";
import { execFileSync } from "node:child_process";
import { mkdtempSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join, resolve } from "node:path";
import test from "node:test";

test("I-006: real HTTPS loopback signs into the actual Commerce verifier without Production credentials", { timeout: 60_000 }, () => {
  const scratch = mkdtempSync(join(tmpdir(), "lf-i006-https-"));
  const key = join(scratch, "local.key");
  const cert = join(scratch, "local.pem");
  try {
    execFileSync("openssl", [
      "req", "-x509", "-newkey", "rsa:2048", "-sha256", "-nodes",
      "-days", "1", "-keyout", key, "-out", cert,
      "-subj", "/CN=localhost",
      "-addext", "subjectAltName=DNS:localhost,IP:127.0.0.1",
      "-addext", "basicConstraints=critical,CA:TRUE",
    ], { stdio: "ignore", timeout: 20_000 });

    // Extra CA is loaded at Node process startup. TLS validation stays ON.
    // No real environment-specific machine credentials are passed to the child.
    const resultText = execFileSync(process.execPath, [
      resolve("scripts/qa/run-commerce-admin-https-e2e.mjs"),
    ], {
      cwd: process.cwd(),
      encoding: "utf8",
      timeout: 40_000,
      env: {
        PATH: process.env.PATH,
        HOME: process.env.HOME,
        NODE_EXTRA_CA_CERTS: cert,
        LF_HTTPS_TEST_CERT: cert,
        LF_HTTPS_TEST_KEY: key,
      },
    });
    const result = JSON.parse(resultText.trim());
    assert.equal(result.suite, "I006_LOCAL_HTTPS");
    assert.equal(result.status, "PASS");
    assert.equal(result.signedHandshakeCases, 9);
    assert.equal(result.rotation, "PASS");
    assert.equal(result.revokedKey, "PASS");
    assert.equal(result.forbiddenPublishScope, "PASS");
    assert.equal(result.draftIdempotency, "LOCAL_FIXTURE_PASS");
    assert.equal(result.fixtureRowsAfterCleanup, 0);
    assert.equal(result.productionCalls, 0);
  } finally {
    rmSync(scratch, { recursive: true, force: true });
  }
});
