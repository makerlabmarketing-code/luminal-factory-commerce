import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

const source = readFileSync("src/features/home/hero-model-data.ts", "utf8");

test("homepage Hero config is revalidated instead of fetched no-store on every request", () => {
  assert.match(source, /HERO_CONFIG_REVALIDATE_SECONDS = 60/);
  assert.match(source, /next: \{ revalidate: HERO_CONFIG_REVALIDATE_SECONDS \}/);
  assert.doesNotMatch(source, /cache:\s*["']no-store["']/);
});

test("homepage Hero config keeps a tight failure budget and stable cache key", () => {
  assert.match(source, /HERO_CONFIG_TIMEOUT_MS = 350/);
  assert.match(source, /AbortSignal\.timeout\(HERO_CONFIG_TIMEOUT_MS\)/);
  assert.doesNotMatch(source, /new Date\(\)\.toISOString\(\)/);
  assert.doesNotMatch(source, /published_at/);
});

test("homepage Hero still fails safely to the bundled presentation", () => {
  assert.match(source, /return \(await requestActiveHero\(\)\) \?\? defaultHeroModelPresentation/);
  assert.match(source, /if \(!response\.ok\) return null/);
  assert.match(source, /catch \{[\s\S]*return null;[\s\S]*\}/);
});
