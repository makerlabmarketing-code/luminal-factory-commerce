import assert from "node:assert/strict";
import { existsSync, readFileSync } from "node:fs";
import test from "node:test";

const read = (path) => readFileSync(path, "utf8");

test("commission route foundation exists with one h1 and typed content boundary", () => {
  assert.equal(existsSync("src/app/commission/page.tsx"), true);
  assert.equal(existsSync("src/features/commission/commission-content.ts"), true);
  assert.equal(existsSync("src/features/commission/commission-discovery.tsx"), true);

  const route = read("src/app/commission/page.tsx");
  const discovery = read("src/features/commission/commission-discovery.tsx");
  const content = read("src/features/commission/commission-content.ts");

  assert.equal((discovery.match(/<h1\b/g) ?? []).length, 1);
  assert.match(route, /getCommissionPresentation/);
  assert.match(route, /<CommissionDiscovery content=\{content\}/);
  assert.match(content, /export type CommissionPresentation/);
  assert.match(content, /availabilityMode: "coming-soon"/);
});

test("commission navigation is real and keeps approved raffle-first order", () => {
  const navigation = read("src/components/layout/navigation.ts");
  assert.match(navigation, /Raffle[\s\S]*Archive[\s\S]*Shop[\s\S]*Commission[\s\S]*About/);
  assert.match(navigation, /href: "\/commission", label: "Commission", isAvailable: true/);
});

test("commission first slice stays discovery-only and non-transactional", () => {
  const source = [
    read("src/app/commission/page.tsx"),
    read("src/features/commission/commission-content.ts"),
    read("src/features/commission/commission-discovery.tsx"),
  ].join("\n");

  assert.match(source, /không phải checkout tức thì|không tự động trở thành order/i);
  assert.doesNotMatch(source, /supabase\.|from\(["'`]|create table|service_role/i);
  assert.doesNotMatch(source, /<form|type=["']file["']|upload|checkout|payment provider|createOrder/i);
  assert.doesNotMatch(source, /price:|turnaround|slotCount/i);
});

test("commission approval and technical plan keep future request flow separately gated", () => {
  const script = read("docs/page-scripts/commission-experience-script-draft.md");
  const spec = read("specs/commission/commission-page-specification.md");
  const plan = read("specs/commission/commission-discovery-foundation-technical-plan.md");

  assert.match(script, /OWNER_APPROVED_FOR_FIRST_IMPLEMENTATION_SLICE/);
  assert.match(spec, /APPROVED.*IMPLEMENTATION_READY/);
  assert.match(plan, /NOT_APPLICABLE_NO_DATA_CHANGE/);
  assert.match(plan, /future request form|inquiry form/i);
});
