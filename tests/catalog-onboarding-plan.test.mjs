import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

const specification = readFileSync("specs/catalog/catalog-onboarding-specification.md", "utf8");
const runbook = readFileSync("specs/catalog/catalog-onboarding-production-runbook.md", "utf8");
const tasks = readFileSync("specs/catalog/catalog-onboarding-tasks.md", "utf8");
const combined = `${specification}\n${runbook}\n${tasks}`;

test("catalog onboarding records the completed Production gate separately from Cart smoke", () => {
  assert.match(specification, /COMPLETED_EXISTING_PRODUCTION_VALIDATED/);
  assert.match(runbook, /CATALOG-PROD-ONBOARDING-01/);
  assert.match(specification, /CART-INTEGRATED-SMOKE-01/);
  assert.match(specification, /Cart\/Auth runtime remains disabled/i);
  assert.match(tasks, /CART-INTEGRATED-SMOKE-01.*blocked/i);
});

test("Production record keeps one permanent Meowhe variant with exact USD price and media", () => {
  assert.match(specification, /Meowhe Lolipop/);
  assert.match(specification, /LF-MEOWHE-LOLIPOP-01/);
  assert.match(specification, /7000.*\$70\.00/);
  assert.match(specification, /\/images\/home\/gallery\/lolipop-candy-stones\.webp/);
  assert.match(specification, /artisan_keycap/);
  assert.match(runbook, /'published', 'direct'/);
  assert.match(runbook, /select product_id, id, 'USD', 7000, true/);
  assert.match(runbook, /select product_id, id, 'image', :media_path, :alt_text, 0, true/);
});

test("runbook neither repurposes the Hero bucket nor expands runtime authority", () => {
  assert.match(runbook, /Do not upload it to `homepage-hero`/i);
  assert.doesNotMatch(runbook, /insert into public\.(?:inventory_items|customers|carts|orders|payments|refunds|raffles|raffle_entries)/i);
  assert.doesNotMatch(runbook, /(?:create|alter) policy|grant (?:insert|update|delete|all)/i);
  assert.doesNotMatch(runbook, /COMMERCE_[A-Z_]+\s*=\s*true/);
});

test("rollback is exact and destructive broad cleanup is prohibited", () => {
  assert.match(runbook, /where id = :recorded_product_id/);
  assert.match(runbook, /and slug = :recorded_slug/);
  assert.match(runbook, /Never truncate, delete by time range/i);
  assert.doesNotMatch(runbook, /truncate\s+table/i);
});
