import test from "node:test";
import assert from "node:assert/strict";
import { isRaffleHistoryLinkRequestAllowed } from "../src/features/account/raffle-history-link-guard.ts";

const origin = "https://luminalfactory.com";
const allowed = new Set([origin]);
function request(options = {}) {
  return new Request(`${origin}/api/account/raffle-history/link`, {
    method: options.method ?? "POST",
    headers: {
      origin: options.origin ?? origin,
      "x-luminal-history-link": options.marker ?? "1",
      "sec-fetch-site": options.site ?? "same-origin",
      ...(options.headers ?? {}),
    },
  });
}

test("allows same-origin empty POST with request marker", () => {
  assert.equal(isRaffleHistoryLinkRequestAllowed(request(), allowed), true);
});

test("rejects cross-account origin and unapproved origin", () => {
  assert.equal(isRaffleHistoryLinkRequestAllowed(request({ origin: "https://evil.example" }), allowed), false);
  assert.equal(isRaffleHistoryLinkRequestAllowed(request(), new Set()), false);
});

test("rejects missing marker and cross-site fetch", () => {
  assert.equal(isRaffleHistoryLinkRequestAllowed(request({ marker: "" }), allowed), false);
  assert.equal(isRaffleHistoryLinkRequestAllowed(request({ site: "cross-site" }), allowed), false);
});

test("rejects unexpected Content-Length", () => {
  assert.equal(isRaffleHistoryLinkRequestAllowed(
    request({ headers: { "content-length": "50" } }), allowed,
  ), false);
  assert.equal(isRaffleHistoryLinkRequestAllowed(
    request({ headers: { "content-length": "garbage" } }), allowed,
  ), false);
});

test("rejects chunked payload framing", () => {
  assert.equal(isRaffleHistoryLinkRequestAllowed(
    request({ headers: { "transfer-encoding": "chunked" } }), allowed,
  ), false);
});
