import "server-only";

import { z } from "zod";
import { homepageHeroManagementInputSchema } from "./commerce-admin-contract";
import type { HomepageHeroDraftMutationWire, HomepageHeroPublishMutationWire } from "./commerce-admin-wire-contract";

const heroRowSchema = z.object({
  id: z.uuid(),
  name: z.string(),
  model_storage_path: z.string(),
  poster_storage_path: z.string().nullable(),
  tint: z.string().nullable(),
  exposure: z.number(),
  shadow_intensity: z.number(),
  shadow_softness: z.number(),
  auto_rotate: z.boolean(),
  auto_rotate_delay_ms: z.number(),
  rotation_per_second_deg: z.number(),
  camera_theta_deg: z.number(),
  camera_phi_deg: z.number(),
  camera_radius_percent: z.number(),
  camera_intro_radius_percent: z.number(),
  camera_min_radius_percent: z.number(),
  camera_max_radius_percent: z.number(),
  camera_field_of_view_deg: z.number(),
  camera_min_field_of_view_deg: z.number(),
  camera_max_field_of_view_deg: z.number(),
  is_active: z.boolean(),
  published_at: z.string().nullable(),
  created_at: z.string(),
  updated_at: z.string(),
});

export type HomepageHeroPresentationWire = Readonly<{
  id: string;
  name: string;
  modelStoragePath: string;
  posterStoragePath: string | null;
  settings: Readonly<{
    tint: string | null;
    exposure: number;
    shadowIntensity: number;
    shadowSoftness: number;
    autoRotate: boolean;
    autoRotateDelayMs: number;
    rotationPerSecondDeg: number;
    cameraThetaDeg: number;
    cameraPhiDeg: number;
    cameraRadiusPercent: number;
    cameraIntroRadiusPercent: number;
    cameraMinRadiusPercent: number;
    cameraMaxRadiusPercent: number;
    cameraFieldOfViewDeg: number;
    cameraMinFieldOfViewDeg: number;
    cameraMaxFieldOfViewDeg: number;
  }>;
  status: "DRAFT" | "PUBLISHED";
  publishedAt: string | null;
  createdAt: string;
  updatedAt: string;
}>;

type SupabaseError = Readonly<{ code?: string; message?: string }>;
type QueryResponse = PromiseLike<{ data: unknown; error: SupabaseError | null }>;

export interface CommerceAdminSupabaseClient {
  from(table: "homepage_hero_presentations"): {
    select(columns: string): {
      order(column: string, options: Readonly<{ ascending: boolean }>): {
        limit(count: number): QueryResponse;
      };
    };
  };
  rpc(name: "manage_homepage_hero", args: Readonly<Record<string, unknown>>): QueryResponse;
}

export class HomepageHeroAdminServiceError extends Error {
  constructor(public readonly code: "HERO_NOT_FOUND" | "HERO_CONFLICT" | "PERSISTENCE_FAILED", message: string) {
    super(message);
    this.name = "HomepageHeroAdminServiceError";
  }
}

function toWire(rowValue: unknown): HomepageHeroPresentationWire {
  const row = heroRowSchema.parse(rowValue);
  return {
    id: row.id,
    name: row.name,
    modelStoragePath: row.model_storage_path,
    posterStoragePath: row.poster_storage_path,
    settings: {
      tint: row.tint,
      exposure: row.exposure,
      shadowIntensity: row.shadow_intensity,
      shadowSoftness: row.shadow_softness,
      autoRotate: row.auto_rotate,
      autoRotateDelayMs: row.auto_rotate_delay_ms,
      rotationPerSecondDeg: row.rotation_per_second_deg,
      cameraThetaDeg: row.camera_theta_deg,
      cameraPhiDeg: row.camera_phi_deg,
      cameraRadiusPercent: row.camera_radius_percent,
      cameraIntroRadiusPercent: row.camera_intro_radius_percent,
      cameraMinRadiusPercent: row.camera_min_radius_percent,
      cameraMaxRadiusPercent: row.camera_max_radius_percent,
      cameraFieldOfViewDeg: row.camera_field_of_view_deg,
      cameraMinFieldOfViewDeg: row.camera_min_field_of_view_deg,
      cameraMaxFieldOfViewDeg: row.camera_max_field_of_view_deg,
    },
    status: row.is_active ? "PUBLISHED" : "DRAFT",
    publishedAt: row.published_at,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

function normalizeDraft(input: HomepageHeroDraftMutationWire["draft"]) {
  const settings = input.settings ?? {};
  return homepageHeroManagementInputSchema.parse({
    name: input.name,
    model_storage_path: input.modelStoragePath,
    poster_storage_path: input.posterStoragePath ?? null,
    tint: settings.tint ?? null,
    exposure: settings.exposure,
    shadow_intensity: settings.shadowIntensity,
    shadow_softness: settings.shadowSoftness,
    auto_rotate: settings.autoRotate,
    auto_rotate_delay_ms: settings.autoRotateDelayMs,
    rotation_per_second_deg: settings.rotationPerSecondDeg,
    camera_theta_deg: settings.cameraThetaDeg,
    camera_phi_deg: settings.cameraPhiDeg,
    camera_radius_percent: settings.cameraRadiusPercent,
    camera_intro_radius_percent: settings.cameraIntroRadiusPercent,
    camera_min_radius_percent: settings.cameraMinRadiusPercent,
    camera_max_radius_percent: settings.cameraMaxRadiusPercent,
    camera_field_of_view_deg: settings.cameraFieldOfViewDeg,
    camera_min_field_of_view_deg: settings.cameraMinFieldOfViewDeg,
    camera_max_field_of_view_deg: settings.cameraMaxFieldOfViewDeg,
  });
}

function persistenceFailure(error: SupabaseError | null): never {
  if (error?.code === "P0002") throw new HomepageHeroAdminServiceError("HERO_NOT_FOUND", "Homepage Hero không tồn tại.");
  if (error?.code === "23505" || error?.code === "22023" || error?.code === "55P03") {
    throw new HomepageHeroAdminServiceError("HERO_CONFLICT", "Homepage Hero operation conflicts with existing state.");
  }
  throw new HomepageHeroAdminServiceError("PERSISTENCE_FAILED", "Homepage Hero persistence failed.");
}

export async function listHomepageHeroPresentations(client: CommerceAdminSupabaseClient): Promise<HomepageHeroPresentationWire[]> {
  const { data, error } = await client
    .from("homepage_hero_presentations")
    .select("id,name,model_storage_path,poster_storage_path,tint,exposure,shadow_intensity,shadow_softness,auto_rotate,auto_rotate_delay_ms,rotation_per_second_deg,camera_theta_deg,camera_phi_deg,camera_radius_percent,camera_intro_radius_percent,camera_min_radius_percent,camera_max_radius_percent,camera_field_of_view_deg,camera_min_field_of_view_deg,camera_max_field_of_view_deg,is_active,published_at,created_at,updated_at")
    .order("updated_at", { ascending: false })
    .limit(100);
  if (error) persistenceFailure(error);
  return z.array(heroRowSchema).parse(data ?? []).map(toWire);
}

async function executeMutation(
  client: CommerceAdminSupabaseClient,
  input: Readonly<{
    operationId: string;
    clientId: string;
    action: "create_draft" | "update_draft" | "publish" | "unpublish";
    targetId: string | null;
    requestFingerprint: string;
    hero: unknown;
  }>,
): Promise<HomepageHeroPresentationWire> {
  const { data, error } = await client.rpc("manage_homepage_hero", {
    p_operation_id: input.operationId,
    p_client_id: input.clientId,
    p_action: input.action,
    p_target_id: input.targetId,
    p_request_fingerprint: input.requestFingerprint,
    p_hero: input.hero,
  });
  if (error || !data) persistenceFailure(error);
  return toWire(data);
}

export function createHomepageHeroDraft(
  client: CommerceAdminSupabaseClient,
  mutation: HomepageHeroDraftMutationWire,
  context: Readonly<{ clientId: string; requestFingerprint: string }>,
) {
  return executeMutation(client, {
    operationId: mutation.operationId,
    clientId: context.clientId,
    action: "create_draft",
    targetId: null,
    requestFingerprint: context.requestFingerprint,
    hero: normalizeDraft(mutation.draft),
  });
}

export function updateHomepageHeroDraft(
  client: CommerceAdminSupabaseClient,
  heroId: string,
  mutation: HomepageHeroDraftMutationWire,
  context: Readonly<{ clientId: string; requestFingerprint: string }>,
) {
  return executeMutation(client, {
    operationId: mutation.operationId,
    clientId: context.clientId,
    action: "update_draft",
    targetId: heroId,
    requestFingerprint: context.requestFingerprint,
    hero: normalizeDraft(mutation.draft),
  });
}

export function publishHomepageHero(
  client: CommerceAdminSupabaseClient,
  heroId: string,
  mutation: HomepageHeroPublishMutationWire,
  context: Readonly<{ clientId: string; requestFingerprint: string }>,
) {
  return executeMutation(client, { operationId: mutation.operationId, clientId: context.clientId, action: "publish", targetId: heroId, requestFingerprint: context.requestFingerprint, hero: null });
}

export function unpublishHomepageHero(
  client: CommerceAdminSupabaseClient,
  heroId: string,
  mutation: HomepageHeroPublishMutationWire,
  context: Readonly<{ clientId: string; requestFingerprint: string }>,
) {
  return executeMutation(client, { operationId: mutation.operationId, clientId: context.clientId, action: "unpublish", targetId: heroId, requestFingerprint: context.requestFingerprint, hero: null });
}
