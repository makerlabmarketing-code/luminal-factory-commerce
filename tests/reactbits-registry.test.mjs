import assert from "node:assert/strict";
import fs from "node:fs";
import test from "node:test";

const components = JSON.parse(fs.readFileSync("components.json", "utf8"));

test("React Bits Pro registries use the license environment variable without committing a credential", () => {
  const starter = components.registries?.["@reactbits-starter"];
  const pro = components.registries?.["@reactbits-pro"];

  assert.equal(starter?.url, "https://pro.reactbits.dev/api/r/starter/{name}.json");
  assert.equal(pro?.url, "https://pro.reactbits.dev/api/r/pro/{name}.json");
  assert.equal(starter?.headers?.Authorization, "Bearer ${REACTBITS_LICENSE_KEY}");
  assert.equal(pro?.headers?.Authorization, "Bearer ${REACTBITS_LICENSE_KEY}");

  const serialized = JSON.stringify(components);
  assert.doesNotMatch(serialized, /Bearer rb_[A-Za-z0-9_-]+/);
});
