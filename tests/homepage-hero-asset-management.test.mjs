import assert from "node:assert/strict";
import fs from "node:fs";
import test from "node:test";

const read = (path) => fs.readFileSync(new URL(`../${path}`, import.meta.url), "utf8");

const contract = read("src/features/management/commerce-admin-contract.ts");
const wire = read("src/features/management/commerce-admin-wire-contract.ts");
const service = read("src/features/management/homepage-hero-asset-service.ts");
const assetsRoute = read("src/app/api/admin/v1/homepage-hero/assets/route.ts");
const uploadRoute = read("src/app/api/admin/v1/homepage-hero/assets/upload-ticket/route.ts");
const publishRoute = read("src/app/api/admin/v1/homepage-hero/[id]/publish/route.ts");
const migration = read("supabase/migrations/20260925062000_restore_homepage_hero_asset_publish_guard.sql");
const spec = read("specs/integration/erp-commerce-management-boundary.md");

test("Hero asset management keeps binary upload outside the signed JSON request body", () => {
  assert.match(contract, /HOMEPAGE_HERO_ASSET_MAX_BYTES = 10 \* 1024 \* 1024/);
  assert.match(wire, /homepageHeroAssetUploadTicketRequestSchema/);
  assert.match(wire, /sizeBytes: z\.number\(\)\.int\(\)\.min\(1\)\.max\(HOMEPAGE_HERO_ASSET_MAX_BYTES\)/);
  assert.match(service, /createSignedUploadUrl\(path\)/);
  assert.match(service, /SIGNED_UPLOAD_TTL_SECONDS = 2 \* 60 \* 60/);
  assert.match(uploadRoute, /commerce\.hero\.write/);
  assert.match(uploadRoute, /homepage_hero\.asset_upload_ticket/);
  assert.doesNotMatch(uploadRoute, /SUPABASE_SECRET_KEY|service_role|NEXT_PUBLIC_/);
});

test("Hero asset listing exposes only bounded approved Storage objects", () => {
  assert.match(assetsRoute, /commerce\.hero\.read/);
  assert.match(service, /from\(HERO_BUCKET\)\.list/);
  assert.match(service, /model\/gltf-binary/);
  assert.match(service, /application\/octet-stream/);
  assert.match(service, /image\/webp/);
  assert.match(service, /image\/avif/);
  assert.match(service, /image\/png/);
  assert.match(service, /HOMEPAGE_HERO_ASSET_MAX_BYTES/);
});

test("publish validates GLB and poster bytes before invoking the idempotent publish RPC", () => {
  assert.match(service, /0x67, 0x6c, 0x54, 0x46/);
  assert.match(service, /getUint32\(4, true\) === 2/);
  assert.match(service, /getUint32\(8, true\) === bytes\.byteLength/);
  assert.match(service, /0x89, 0x50, 0x4e, 0x47/);
  assert.match(service, /0x52, 0x49, 0x46, 0x46/);
  assert.match(service, /brand === "avif" \|\| brand === "avis"/);

  const binaryGuard = publishRoute.indexOf("assertHomepageHeroAssetsPublishable");
  const mutation = publishRoute.indexOf("publishHomepageHero(context.client");
  assert.ok(binaryGuard >= 0 && mutation > binaryGuard);
  assert.match(publishRoute, /HERO_ASSET_INVALID/);
});

test("corrective DB guard checks Storage metadata before deactivating the previous active Hero", () => {
  assert.match(migration, /homepage_hero_asset_object_ready/);
  assert.match(migration, /storage\.objects/);
  assert.match(migration, /10485760/);
  assert.match(migration, /metadata->>'mimetype'/);
  assert.match(migration, /homepage_hero_require_assets_before_publish/);
  assert.match(migration, /before insert or update of model_storage_path, poster_storage_path, is_active/i);

  const readinessCheck = migration.indexOf("if not public.homepage_hero_assets_ready");
  const deactivatePrevious = migration.indexOf("set is_active = false");
  assert.ok(readinessCheck >= 0 && deactivatePrevious > readinessCheck);
  assert.match(migration, /using errcode = '23514'/);
});

test("integration spec keeps signed tickets default-off and separates asset upload from publish", () => {
  assert.match(spec, /signed upload/i);
  assert.match(spec, /valid for two hours/i);
  assert.match(spec, /binary bytes do not travel inside the HMAC JSON body/i);
  assert.match(spec, /HERO-ASSET-PUBLISH-GUARD-01/);
  assert.match(spec, /HERO-ASSET-STORAGE-01/);
  assert.match(spec, /These routes are not live yet/i);
});
