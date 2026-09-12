import "server-only";

import { cache } from "react";
import { z } from "zod";
import { defaultHeroModelPresentation, type HeroModelPresentation } from "./hero-model-config";

const HERO_BUCKET = "homepage-hero";
const HERO_CONFIG_TIMEOUT_MS = 350;
const HERO_CONFIG_REVALIDATE_SECONDS = 60;

const heroRowSchema = z.object({
  model_storage_path: z.string().trim().min(1).max(512),
  tint: z.string().regex(/^#[0-9A-Fa-f]{6}$/).nullable(),
  exposure: z.number().min(0.4).max(2.5),
  shadow_intensity: z.number().min(0).max(2),
  shadow_softness: z.number().min(0).max(1),
  auto_rotate: z.boolean(),
  auto_rotate_delay_ms: z.number().int().min(0).max(30000),
  rotation_per_second_deg: z.number().min(0).max(30),
  camera_theta_deg: z.number().min(-360).max(360),
  camera_phi_deg: z.number().min(5).max(175),
  camera_radius_percent: z.number().min(50).max(250),
  camera_intro_radius_percent: z.number().min(50).max(250),
  camera_min_radius_percent: z.number().min(40).max(250),
  camera_max_radius_percent: z.number().min(50).max(300),
  camera_field_of_view_deg: z.number().min(10).max(70),
  camera_min_field_of_view_deg: z.number().min(8).max(70),
  camera_max_field_of_view_deg: z.number().min(10).max(90),
});

const heroRowsSchema = z.array(heroRowSchema).max(1);
type HeroRow = z.infer<typeof heroRowSchema>;

const HERO_SELECT = [
  "model_storage_path",
  "tint",
  "exposure",
  "shadow_intensity",
  "shadow_softness",
  "auto_rotate",
  "auto_rotate_delay_ms",
  "rotation_per_second_deg",
  "camera_theta_deg",
  "camera_phi_deg",
  "camera_radius_percent",
  "camera_intro_radius_percent",
  "camera_min_radius_percent",
  "camera_max_radius_percent",
  "camera_field_of_view_deg",
  "camera_min_field_of_view_deg",
  "camera_max_field_of_view_deg",
].join(",");

function getPublicSupabaseConfig() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL?.trim();
  const publishableKey =
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY?.trim() ||
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY?.trim();

  if (!url || !publishableKey) return null;

  try {
    const parsedUrl = new URL(url);
    if (parsedUrl.protocol !== "https:") return null;
    return { url: parsedUrl.origin, publishableKey };
  } catch {
    return null;
  }
}

function isSafeStoragePath(path: string): boolean {
  return (
    !path.startsWith("/") &&
    !path.includes("//") &&
    !path.split("/").includes("..") &&
    path.toLowerCase().endsWith(".glb")
  );
}

function buildPublicStorageUrl(projectOrigin: string, storagePath: string): string | null {
  if (!isSafeStoragePath(storagePath)) return null;
  const encodedPath = storagePath.split("/").map(encodeURIComponent).join("/");
  return `${projectOrigin}/storage/v1/object/public/${HERO_BUCKET}/${encodedPath}`;
}

function mapHeroRow(row: HeroRow, projectOrigin: string): HeroModelPresentation | null {
  const modelSrc = buildPublicStorageUrl(projectOrigin, row.model_storage_path);
  if (!modelSrc) return null;

  if (
    row.camera_min_radius_percent > row.camera_radius_percent ||
    row.camera_radius_percent > row.camera_max_radius_percent ||
    row.camera_min_field_of_view_deg > row.camera_field_of_view_deg ||
    row.camera_field_of_view_deg > row.camera_max_field_of_view_deg
  ) {
    return null;
  }

  return {
    modelSrc,
    tint: row.tint,
    exposure: row.exposure,
    shadowIntensity: row.shadow_intensity,
    shadowSoftness: row.shadow_softness,
    autoRotate: row.auto_rotate,
    autoRotateDelayMs: row.auto_rotate_delay_ms,
    rotationPerSecondDeg: row.rotation_per_second_deg,
    camera: {
      thetaDeg: row.camera_theta_deg,
      phiDeg: row.camera_phi_deg,
      radiusPercent: row.camera_radius_percent,
      introRadiusPercent: row.camera_intro_radius_percent,
      minRadiusPercent: row.camera_min_radius_percent,
      maxRadiusPercent: row.camera_max_radius_percent,
      fieldOfViewDeg: row.camera_field_of_view_deg,
      minFieldOfViewDeg: row.camera_min_field_of_view_deg,
      maxFieldOfViewDeg: row.camera_max_field_of_view_deg,
    },
  };
}

async function requestActiveHero(): Promise<HeroModelPresentation | null> {
  const config = getPublicSupabaseConfig();
  if (!config) return null;

  const endpoint = new URL(`${config.url}/rest/v1/homepage_hero_presentations`);
  endpoint.searchParams.set("select", HERO_SELECT);
  endpoint.searchParams.set("is_active", "eq.true");
  endpoint.searchParams.set("order", "updated_at.desc");
  endpoint.searchParams.set("limit", "1");

  try {
    const response = await fetch(endpoint, {
      headers: {
        Accept: "application/json",
        apikey: config.publishableKey,
      },
      next: { revalidate: HERO_CONFIG_REVALIDATE_SECONDS },
      signal: AbortSignal.timeout(HERO_CONFIG_TIMEOUT_MS),
    });

    if (!response.ok) return null;
    const payload: unknown = await response.json();
    const parsedRows = heroRowsSchema.safeParse(payload);
    if (!parsedRows.success || !parsedRows.data[0]) return null;
    return mapHeroRow(parsedRows.data[0], config.url);
  } catch {
    return null;
  }
}

export const getHeroModelPresentation = cache(async (): Promise<HeroModelPresentation> => {
  return (await requestActiveHero()) ?? defaultHeroModelPresentation;
});
