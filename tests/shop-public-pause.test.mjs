import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

const read = (name) => readFileSync(name, "utf8");
const gate = read("src/features/shop/shop-public-gate.ts");
const paused = read("src/features/shop/shop-paused.tsx");
const navigation = read("src/components/layout/navigation.ts");
const home = read("src/features/home/home-page.tsx");
const content = read("src/content/homepage.ts");
const raffle = read("src/features/raffle/raffle-discovery.tsx");
const shop = read("src/app/[locale]/shop/page.tsx");
const detail = read("src/app/[locale]/shop/[slug]/page.tsx");

test("Public Shop visibility is paused without affecting management API/data", () => {
  assert.match(gate, /export const shopPublicEnabled = false/);
  assert.match(navigation, /publicNavigation = navigation\.filter\(\(item\) => item\.href !== "\/shop" \|\| shopPublicEnabled\)/);
  assert.match(shop, /if \(!shopPublicEnabled\) return <ShopPaused \/>/);
  assert.match(detail, /if \(!shopPublicEnabled\) return <ShopPaused \/>/);
  assert.match(shop, /robots: \{ index: false, follow: true \}/);
  assert.match(detail, /robots: \{ index: false, follow: true \}/);
  assert.match(paused, /data-shop-paused="true"/);
  assert.match(paused, /href="\/raffle"/);
  assert.match(paused, /href="\/archive"/);
});

test("Guest-facing navigation and home calls to action prioritize Raffle", () => {
  assert.match(content, /primaryAction: \{ label: "Explore Raffles", href: "\/raffle" \}/);
  assert.match(content, /secondaryAction: \{ label: "View Archive", href: "\/archive" \}/);
  assert.doesNotMatch(home, /href="\/shop"/);
  assert.doesNotMatch(raffle, /href="\/shop"/);
  assert.match(raffle, /No raffle releases are announced yet/);
  assert.doesNotMatch(paused, /Buy now|Checkout|Add to cart/i);
});
