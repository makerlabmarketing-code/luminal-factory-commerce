import assert from "node:assert/strict";
import fs from "node:fs";
import test from "node:test";

const migration = fs.readFileSync("supabase/migrations/20260910103000_create_homepage_hero_presentations.sql", "utf8");
const publishGuardMigration = fs.readFileSync("supabase/migrations/20260911094500_guard_homepage_hero_publish_assets.sql", "utf8");
const publishRpcMigration = fs.readFileSync("supabase/migrations/20260911101000_add_homepage_hero_publish_rpc.sql", "utf8");
const adapter = fs.readFileSync("src/features/home/hero-model-data.ts", "utf8");
const config = fs.readFileSync("src/features/home/hero-model-config.ts", "utf8");
const home = fs.readFileSync("src/features/home/home-page.tsx", "utf8");

test("homepage Hero schema is public-read only and bounded", () => {
  assert.match(migration, /create table public\.homepage_hero_presentations/);
  assert.match(migration, /enable row level security/);
  assert.match(migration, /revoke all on public\.homepage_hero_presentations from public, anon, authenticated/);
  assert.match(migration, /grant select on public\.homepage_hero_presentations to anon, authenticated/);
  assert.match(migration, /grant all on public\.homepage_hero_presentations to service_role/);
  assert.match(migration, /is_active and published_at is not null and published_at <= now\(\)/);
  assert.match(migration, /homepage_hero_one_active_uidx/);
  assert.match(migration, /homepage_hero_tint_hex/);
  assert.doesNotMatch(migration, /security definer/i);
});

test("homepage Hero Storage bucket is public for delivery but not public for writes", () => {
  assert.match(migration, /'homepage-hero'/);
  assert.match(migration, /10485760/);
  assert.match(migration, /model\/gltf-binary/);
  assert.match(migration, /application\/octet-stream/);
  assert.doesNotMatch(migration, /create policy[\s\S]*storage\.objects/i);
  assert.doesNotMatch(migration, /grant (insert|update|delete)[\s\S]*storage/i);
});

test("homepage Hero cannot publish a Storage path that does not exist", () => {
  assert.match(publishGuardMigration, /from storage\.objects/);
  assert.match(publishGuardMigration, /bucket_id = 'homepage-hero'/);
  assert.match(publishGuardMigration, /name = model_path/);
  assert.match(publishGuardMigration, /poster_path is null/);
  assert.match(publishGuardMigration, /new\.is_active or new\.published_at is not null/);
  assert.match(publishGuardMigration, /errcode = '23514'/);
  assert.match(publishGuardMigration, /before insert or update of model_storage_path, poster_storage_path, is_active, published_at/);
  assert.match(publishGuardMigration, /grant execute on function public\.homepage_hero_assets_ready\(text, text\) to service_role/);
  assert.doesNotMatch(publishGuardMigration, /security definer/i);
});

test("homepage Hero publish switch is atomic and service-role only", () => {
  assert.match(publishRpcMigration, /create or replace function public\.publish_homepage_hero\(target_id uuid\)/);
  assert.match(publishRpcMigration, /lock table public\.homepage_hero_presentations in share row exclusive mode/);
  assert.match(publishRpcMigration, /set is_active = false/);
  assert.match(publishRpcMigration, /set is_active = true,[\s\S]*published_at = now\(\)/);
  assert.match(publishRpcMigration, /grant execute on function public\.publish_homepage_hero\(uuid\) to service_role/);
  assert.match(publishRpcMigration, /grant execute on function public\.unpublish_homepage_hero\(uuid\) to service_role/);
  assert.doesNotMatch(publishRpcMigration, /security definer/i);
  assert.doesNotMatch(publishRpcMigration, /grant execute[\s\S]*to (anon|authenticated)/i);
});

test("homepage reads one active Hero through a server-only validated adapter", () => {
  assert.match(adapter, /import "server-only"/);
  assert.match(adapter, /heroRowsSchema\.safeParse/);
  assert.match(adapter, /is_active", "eq\.true/);
  assert.match(adapter, /published_at/);
  assert.match(adapter, /AbortSignal\.timeout\(HERO_CONFIG_TIMEOUT_MS\)/);
  assert.match(adapter, /storage\/v1\/object\/public\/\$\{HERO_BUCKET\}/);
  assert.match(adapter, /defaultHeroModelPresentation/);
  assert.match(home, /await getHeroModelPresentation\(\)/);
  assert.match(home, /presentation=\{heroPresentation\}/);
});

test("local GLB remains the fallback and Google Drive is not a runtime media origin", () => {
  assert.match(config, /modelSrc: "\/models\/meowhe-hero\.glb"/);
  assert.equal(fs.existsSync("public/models/meowhe-hero.glb"), true);
  assert.doesNotMatch(adapter, /drive\.google\.com|docs\.google\.com/i);
  assert.doesNotMatch(config, /drive\.google\.com|docs\.google\.com/i);
});
