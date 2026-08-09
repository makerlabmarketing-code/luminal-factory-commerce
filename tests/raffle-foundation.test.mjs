import assert from "node:assert/strict";
import { existsSync, readFileSync } from "node:fs";
import test from "node:test";

const read = (path) => readFileSync(path, "utf8");

test("raffle route foundation exists with one h1 and typed presentation boundary", () => {
  assert.equal(existsSync("src/app/raffle/page.tsx"), true);
  assert.equal(existsSync("src/features/raffle/raffle-content.ts"), true);
  assert.equal(existsSync("src/features/raffle/raffle-discovery.tsx"), true);

  const route = read("src/app/raffle/page.tsx");
  const discovery = read("src/features/raffle/raffle-discovery.tsx");
  const content = read("src/features/raffle/raffle-content.ts");

  assert.equal((discovery.match(/<h1\b/g) ?? []).length, 1);
  assert.match(route, /getRafflePresentation/);
  assert.match(route, /<RaffleDiscovery content=\{content\}/);
  assert.match(content, /export type RafflePresentationState/);
  assert.match(content, /presentationState: "upcoming"/);
  assert.match(content, /Asia\/Ho_Chi_Minh/);
});

test("raffle navigation is a real route and keeps raffle first", () => {
  const navigation = read("src/components/layout/navigation.ts");
  assert.match(navigation, /href: "\/raffle", label: "Raffle", isAvailable: true/);
  assert.match(navigation, /Raffle[\s\S]*Archive[\s\S]*Shop[\s\S]*Commission[\s\S]*About/);
});

test("raffle first slice stays truthful, static, and non-transactional", () => {
  const source = [
    read("src/app/raffle/page.tsx"),
    read("src/features/raffle/raffle-content.ts"),
    read("src/features/raffle/raffle-discovery.tsx"),
  ].join("\n");

  assert.match(source, /Đợt raffle tiếp theo đang được chuẩn bị/);
  assert.match(source, /không phải order|not an order/i);
  assert.doesNotMatch(source, /<form|type=["'](?:file|email|password)["']|onSubmit=|createOrder|payment provider/i);
  assert.doesNotMatch(source, /supabase\.|from\(["'`]|create table|service_role/i);
  assert.doesNotMatch(source, /setInterval|setTimeout|Date\.now\(|winnerCount|slotCount|price:/i);
});

test("raffle technical plan keeps detail and entry flow separately gated", () => {
  const plan = read("specs/raffle/raffle-discovery-foundation-technical-plan.md");
  assert.match(plan, /Owner approval: `2026-08-09`/);
  assert.match(plan, /NOT_APPLICABLE_NO_DATA_CHANGE/);
  assert.match(plan, /\/raffle\/\[slug\]/);
  assert.match(plan, /entry submission/);
});
