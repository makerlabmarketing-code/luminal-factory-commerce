import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

const read = (path) => readFileSync(path, "utf8");

test("direct apply authenticates publish scope and only updates the current active version", () => {
  const route = read("src/app/api/admin/v1/homepage-hero/[id]/apply/route.ts");
  assert.match(route, /authorizeCommerceAdminRoute\(request, \["commerce\.hero\.publish"\]\)/);
  assert.match(route, /homepageHeroApplyMutationSchema\.safeParse\(raw\)/);
  assert.match(route, /\.eq\("id", id\.data\)/);
  assert.match(route, /\.eq\("is_active", true\)/);
  assert.match(route, /\.eq\("updated_at", mutation\.data\.expectedUpdatedAt\)/);
  assert.match(route, /\.update\(\{ \.\.\.validated, updated_at: new Date\(\)\.toISOString\(\) \}\)/);
  assert.match(route, /revalidateTag\("homepage-hero", \{ expire: 0 \}\)/);
  assert.match(route, /revalidatePath\("\/"\)/);
  assert.doesNotMatch(route, /create_draft|\.insert\(/);
});

test("direct apply validates incoming GLB asset without editing any old version", () => {
  const route = read("src/app/api/admin/v1/homepage-hero/[id]/apply/route.ts");
  const assets = read("src/features/management/homepage-hero-asset-service.ts");
  assert.match(route, /assertHomepageHeroInputAssetsPublishable\(context\.privilegedClient/);
  assert.match(assets, /export async function assertHomepageHeroInputAssetsPublishable/);
  assert.match(assets, /isValidGlb\(modelBytes\)/);
});

test("old versions can be removed but active presentations and GLB storage remain protected", () => {
  const route = read("src/app/api/admin/v1/homepage-hero/[id]/delete/route.ts");
  assert.match(route, /authorizeCommerceAdminRoute\(request, \["commerce\.hero\.write"\]\)/);
  assert.match(route, /\.eq\("is_active", false\)/);
  assert.doesNotMatch(route, /\.is\("published_at", null\)/);
  assert.doesNotMatch(route, /storage\.from|\.storage\.remove/);
});
