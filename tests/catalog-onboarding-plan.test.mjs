import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

const specification = readFileSync("specs/catalog/catalog-onboarding-specification.md", "utf8");
const runbook = readFileSync("specs/catalog/catalog-onboarding-production-runbook.md", "utf8");
const tasks = readFileSync("specs/catalog/catalog-onboarding-tasks.md", "utf8");
const combined = `${specification}\n${runbook}\n${tasks}`;

test("catalog onboarding has distinct planning, Production and integrated-smoke gates", () => {
  assert.match(specification, /CATALOG-ONBOARDING-01/);
  assert.match(runbook, /CATALOG-PROD-ONBOARDING-01/);
  assert.match(specification, /CART-INTEGRATED-SMOKE-01/);
  assert.match(combined, /every Commerce and raffle runtime flag remains `false`/i);
});

test("first product contract is one permanent direct variant with an exact price and media row", () => {
  assert.match(specification, /one published `products` row/);
  assert.match(specification, /one active `product_variants` row/);
  assert.match(specification, /one active variant-specific `product_prices` row/);
  assert.match(specification, /one primary image `product_media` row/);
  assert.match(runbook, /'published', 'direct'/);
  assert.match(runbook, /select product_id, id, 'VND', :amount_minor, true/);
  assert.match(runbook, /select product_id, id, 'image', :media_path, :alt_text, 0, true/);
});

test("runbook neither repurposes the Hero bucket nor expands runtime authority", () => {
  assert.match(combined, /must not be repurposed for catalog media/i);
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

