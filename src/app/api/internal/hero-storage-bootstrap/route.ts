import { createHash } from "node:crypto";
import { createClient } from "@supabase/supabase-js";
import type { Database } from "@/lib/supabase/database.types";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

const BUCKET = "homepage-hero";
const OBJECT_PATH = "models/meowhe-hero.glb";
const SOURCE_URL = "https://luminalfactory.com/models/meowhe-hero.glb";
const MAX_BYTES = 10 * 1024 * 1024;

function isGlbV2(bytes: Uint8Array): boolean {
  if (bytes.byteLength < 12) return false;
  if (bytes[0] !== 0x67 || bytes[1] !== 0x6c || bytes[2] !== 0x54 || bytes[3] !== 0x46) return false;
  const view = new DataView(bytes.buffer, bytes.byteOffset, bytes.byteLength);
  return view.getUint32(4, true) === 2 && view.getUint32(8, true) === bytes.byteLength;
}

function sha256(bytes: Uint8Array): string {
  return createHash("sha256").update(bytes).digest("hex");
}

export async function GET() {
  if (process.env.VERCEL_ENV !== "production" || process.env.VERCEL_GIT_COMMIT_REF !== "master") {
    return new Response(null, { status: 404, headers: { "Cache-Control": "no-store" } });
  }

  const supabaseUrl = String(process.env.NEXT_PUBLIC_SUPABASE_URL ?? "").trim();
  const secretKey = String(process.env.SUPABASE_SECRET_KEY ?? "").trim();
  if (!supabaseUrl || !secretKey) {
    return Response.json({ ok: false, error: "supabase_config_missing" }, { status: 503 });
  }

  const sourceResponse = await fetch(SOURCE_URL, { cache: "no-store" });
  if (!sourceResponse.ok) {
    return Response.json({ ok: false, error: "bundled_source_unavailable" }, { status: 503 });
  }

  const source = new Uint8Array(await sourceResponse.arrayBuffer());
  if (source.byteLength < 1 || source.byteLength > MAX_BYTES || !isGlbV2(source)) {
    return Response.json({ ok: false, error: "bundled_glb_invalid" }, { status: 422 });
  }

  const sourceHash = sha256(source);
  const client = createClient<Database>(supabaseUrl, secretKey, {
    auth: { persistSession: false, autoRefreshToken: false },
  });

  const { data: hero, error: heroError } = await client
    .from("homepage_hero_presentations")
    .select("id,model_storage_path,is_active")
    .order("updated_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  if (heroError || !hero) {
    return Response.json({ ok: false, error: "hero_draft_unavailable" }, { status: 503 });
  }

  if (hero.model_storage_path !== OBJECT_PATH || hero.is_active) {
    return Response.json({
      ok: false,
      error: "hero_draft_baseline_changed",
      modelStoragePath: hero.model_storage_path,
      isActive: hero.is_active,
    }, { status: 409 });
  }

  const { data: existing, error: existingError } = await client.storage.from(BUCKET).download(OBJECT_PATH);
  if (!existingError && existing) {
    const existingBytes = new Uint8Array(await existing.arrayBuffer());
    const existingHash = sha256(existingBytes);
    if (existingHash !== sourceHash || !isGlbV2(existingBytes)) {
      return Response.json({
        ok: false,
        error: "storage_object_conflict",
        sourceHash,
        existingHash,
      }, { status: 409 });
    }

    return Response.json({
      ok: true,
      state: "already_present",
      path: OBJECT_PATH,
      sizeBytes: existingBytes.byteLength,
      sha256: existingHash,
      publicUrl: client.storage.from(BUCKET).getPublicUrl(OBJECT_PATH).data.publicUrl,
      heroId: hero.id,
      published: false,
    }, { headers: { "Cache-Control": "no-store" } });
  }

  const { error: uploadError } = await client.storage.from(BUCKET).upload(
    OBJECT_PATH,
    source,
    { contentType: "model/gltf-binary", upsert: false },
  );
  if (uploadError) {
    return Response.json({ ok: false, error: "storage_upload_failed" }, { status: 503 });
  }

  const { data: stored, error: verifyError } = await client.storage.from(BUCKET).download(OBJECT_PATH);
  if (verifyError || !stored) {
    return Response.json({ ok: false, error: "storage_verify_download_failed" }, { status: 503 });
  }

  const storedBytes = new Uint8Array(await stored.arrayBuffer());
  const storedHash = sha256(storedBytes);
  if (storedHash !== sourceHash || !isGlbV2(storedBytes)) {
    return Response.json({
      ok: false,
      error: "storage_verify_mismatch",
      sourceHash,
      storedHash,
    }, { status: 500 });
  }

  return Response.json({
    ok: true,
    state: "uploaded",
    path: OBJECT_PATH,
    sizeBytes: storedBytes.byteLength,
    sha256: storedHash,
    publicUrl: client.storage.from(BUCKET).getPublicUrl(OBJECT_PATH).data.publicUrl,
    heroId: hero.id,
    published: false,
  }, { status: 201, headers: { "Cache-Control": "no-store" } });
}
