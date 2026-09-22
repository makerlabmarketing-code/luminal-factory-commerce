import assert from "node:assert/strict";
import { existsSync, readFileSync } from "node:fs";
import test from "node:test";

const read = (path) => readFileSync(path, "utf8");

test("Home raffle spotlight is a bounded client interaction over a server raffle adapter", () => {
  assert.equal(existsSync("src/features/raffle/raffle-home-service.ts"), true);
  assert.equal(existsSync("src/features/home/home-raffle-spotlight.tsx"), true);
  assert.equal(existsSync("src/features/home/home-raffle-spotlight.module.css"), true);

  const home = read("src/features/home/home-page.tsx");
  const service = read("src/features/raffle/raffle-home-service.ts");
  const spotlight = read("src/features/home/home-raffle-spotlight.tsx");

  assert.match(home, /getHomeFeaturedRaffle/);
  assert.match(home, /<HomeRaffleSpotlight raffle=\{featuredRaffle\}/);
  assert.match(service, /import "server-only"/);
  assert.match(spotlight, /"use client"/);
  assert.doesNotMatch(spotlight, /createClient|\.from\(|SUPABASE_SECRET_KEY/);
});

test("Home raffle discovery stays independently default-off", () => {
  const service = read("src/features/raffle/raffle-home-service.ts");
  assert.match(service, /COMMERCE_HOME_RAFFLE_ENABLED/);
  assert.match(service, /COMMERCE_RAFFLE_DETAIL_ENABLED/);
  assert.match(service, /trim\(\)\.toLowerCase\(\) !== "true"/);
});

test("Home selects an authoritative open raffle before the nearest scheduled raffle", () => {
  const service = read("src/features/raffle/raffle-home-service.ts");
  assert.match(service, /\.eq\("status", "OPEN"\)/);
  assert.match(service, /\.lte\("opens_at", now\)/);
  assert.match(service, /\.gt\("closes_at", now\)/);
  assert.match(service, /\.eq\("status", "SCHEDULED"\)/);
  assert.match(service, /\.gte\("opens_at", now\)/);
  assert.match(service, /\.order\("opens_at", \{ ascending: true \}\)/);
});

test("scheduled teaser keeps entry closed until server state is reconciled", () => {
  const spotlight = read("src/features/home/home-raffle-spotlight.tsx");

  assert.match(spotlight, />\?</);
  assert.match(spotlight, /Opening countdown/);
  assert.match(spotlight, /router\.refresh\(\)/);
  assert.match(spotlight, /OPEN_REVALIDATION_INTERVAL_MS/);
  assert.match(spotlight, /raffle\.state === "open"/);
  assert.match(spotlight, /raffle\.entryPresentationEnabled/);
  assert.match(spotlight, /Enter raffle/);
  assert.doesNotMatch(spotlight, /submitRaffleEntry|createOrder|reserveInventory/);
});

test("countdown is not the authoritative eligibility boundary", () => {
  const service = read("src/features/raffle/raffle-home-service.ts");
  const spotlight = read("src/features/home/home-raffle-spotlight.tsx");

  assert.match(service, /status === "OPEN"/);
  assert.match(spotlight, /Đang đồng bộ trạng thái mở raffle từ máy chủ/);
  assert.match(spotlight, /aria-hidden="true"/);
  assert.match(spotlight, /sr-only/);
});
