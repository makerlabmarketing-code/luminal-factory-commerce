import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

const contentPath = new URL("../src/features/archive/archive-content.ts", import.meta.url);
const collectionPath = new URL("../src/features/archive/archive-collection.tsx", import.meta.url);
const detailPath = new URL("../src/features/archive/archive-detail.tsx", import.meta.url);
const routePath = new URL("../src/app/archive/[slug]/page.tsx", import.meta.url);

async function source(path) {
  return readFile(path, "utf8");
}

test("archive presentation source exposes stable detail routes and slug lookup", async () => {
  const text = await source(contentPath);

  assert.match(text, /href: `\/archive\/\$\{string\}`/);
  assert.match(text, /getArchiveEntryBySlug/);
  assert.match(text, /\/archive\/object-study-01/);
  assert.match(text, /historicalNotes/);
  assert.match(text, /facts/);
});

test("archive index cards navigate to detail routes", async () => {
  const text = await source(collectionPath);

  assert.match(text, /<Link href=\{entry\.href\}/);
  assert.doesNotMatch(text, /href:\s*"\/archive#/);
});

test("archive detail route is static and returns not found for unknown slugs", async () => {
  const text = await source(routePath);

  assert.match(text, /generateStaticParams/);
  assert.match(text, /generateMetadata/);
  assert.match(text, /getArchiveEntryBySlug/);
  assert.match(text, /notFound\(\)/);
});

test("archive detail remains historical and non-transactional", async () => {
  const text = await source(detailPath);

  assert.match(text, /Historical editorial record/);
  assert.match(text, /What this record can truthfully say/);
  assert.match(text, /Quay lại Archive/);
  assert.doesNotMatch(text, /Add to Cart|Buy Now|checkout|payment provider|stock quantity/i);
});
