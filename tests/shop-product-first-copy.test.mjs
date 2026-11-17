import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

const read = (path) => readFileSync(path, "utf8");
const page = read("src/app/[locale]/shop/page.tsx");
const shelf = read("src/features/shop/shop-collection.tsx");
const css = read("src/app/globals.css");
const home = read("src/features/home/home-page.tsx");
const content = read("src/content/homepage.ts");
const archive = read("src/app/[locale]/archive/page.tsx");
const locale = JSON.parse(read("src/lib/i18n/copy.json"));

test("Small unfiltered live catalogs lead with real products, not search controls", () => {
  assert.match(page, /const showcaseFirst = isLiveCatalog && !hasActiveQuery && !catalog\.hasNextPage/);
  assert.match(page, /catalog\.entries\.length > 0 && catalog\.entries\.length <= 3/);
  assert.ok(page.indexOf("{showcaseFirst ? products : null}") < page.indexOf('className="shop-route-section shop-route-filters"'));
  assert.ok(page.indexOf("{!showcaseFirst ? products : null}") > page.indexOf("shop-route-filters"));
  assert.match(page, /<details className="shop-filter-disclosure" open=\{!showcaseFirst\}>/);
  assert.match(page, /<summary id="shop-filter-title"/);
  assert.match(page, /hasActiveQuery \? <Link href="\/shop">/);
  assert.match(page, /entries=\{isLiveCatalog \? catalog\.entries : \[\]\}/);
});

test("Single-product shelf prioritizes image without representing unavailable checkout", () => {
  assert.match(shelf, /const featured = entries\.length === 1/);
  assert.match(shelf, /shop-route-card--featured/);
  assert.match(shelf, /\(max-width: 900px\) 90vw, 46vw/);
  assert.match(shelf, /priority=\{featured && index === 0\}/);
  assert.match(shelf, /<Link href=\{entry\.href\}>\{entry\.title\}<\/Link>/);
  assert.match(css, /grid-template-areas: "media details" "media status" "media price" "media action"/);
  assert.match(css, /grid-template-areas: "media" "details" "status" "price" "action"/);
  assert.match(css, /\.shop-filter-disclosure > summary:focus-visible/);
  assert.doesNotMatch(page + shelf, /Buy now|Add to cart|Checkout|Pay now/i);
});

test("Product-first editorial copy is concise and existing colorways remain named", () => {
  assert.match(home, /Made with intention\./);
  assert.match(home, /Designed digitally\. Finished by hand\./);
  assert.match(home, /Three colorways\./);
  assert.match(home, /Explore Lolipop, Mictlán and Mono\./);
  assert.match(archive, /The Meowhe Archive/);
  assert.match(archive, /Three colorways\. One character\./);
  assert.match(archive, /View colorways/);
  const processCopies = [...content.matchAll(/\{ number: "\d{2}", title: "[^"]+", copy: "([^"]+)" \}/g)].map((match) => match[1]);
  assert.equal(processCopies.length, 4);
  assert.ok(processCopies.every((line) => line.length <= 48));
  for (const key of [
    "Made with intention.",
    "Designed digitally. Finished by hand.",
    "Three colorways.",
    "Explore Lolipop, Mictlán and Mono.",
    "Same independent studio. A new chapter.",
  ]) {
    assert.ok(Array.isArray(locale[key]) && locale[key].every(Boolean), "Missing EN/VI copy: " + key);
  }
});
