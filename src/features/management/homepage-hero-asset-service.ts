import "server-only";

import { randomUUID } from "node:crypto";
import { z } from "zod";
import {
  HOMEPAGE_HERO_ASSET_MAX_BYTES,
  homepageHeroModelStoragePathSchema,
  homepageHeroPosterStoragePathSchema,
} from "./commerce-admin-contract";
import type { HomepageHeroAssetUploadTicketRequestWire } from "./commerce-admin-wire-contract";
import type { CommerceAdminPrivilegedClient } from "./commerce-admin-route-runtime";

const HERO_BUCKET = "homepage-hero";
const SIGNED_UPLOAD_TTL_SECONDS = 2 * 60 * 60;

const storageObjectSchema = z
  .object({
    id: z.string().nullable().optional(),
    name: z.string().min(1),
    updated_at: z.string().nullable().optional(),
    metadata: z
      .object({
        size: z.number().int().positive().optional(),
        mimetype: z.string().min(1).optional(),
      })
      .passthrough()
      .nullable()
      .optional(),
  })
  .passthrough();

type AssetKind = "model" | "poster";

export type HomepageHeroAssetPresentation = Readonly<{
  kind: AssetKind;
  path: string;
  fileName: string;
  contentType: string;
  sizeBytes: number;
  updatedAt: string | null;
  publicUrl: string;
}>;

export type HomepageHeroAssetUploadTicket = Readonly<{
  kind: AssetKind;
  path: string;
  contentType: string;
  sizeBytes: number;
  signedUrl: string;
  token: string;
  publicUrl: string;
  expiresInSeconds: typeof SIGNED_UPLOAD_TTL_SECONDS;
}>;

export class HomepageHeroAssetServiceError extends Error {
  constructor(
    public readonly code:
      | "HERO_NOT_FOUND"
      | "ASSET_NOT_FOUND"
      | "ASSET_INVALID"
      | "STORAGE_UNAVAILABLE",
    message: string,
  ) {
    super(message);
    this.name = "HomepageHeroAssetServiceError";
  }
}

function assetFolder(kind: AssetKind): "models" | "posters" {
  return kind === "model" ? "models" : "posters";
}

function getExtension(fileName: string): string {
  const dot = fileName.lastIndexOf(".");
  return dot >= 0 ? fileName.slice(dot).toLowerCase() : "";
}

function isAcceptedAsset(
  kind: AssetKind,
  path: string,
  contentType: string,
  sizeBytes: number,
): boolean {
  if (sizeBytes < 1 || sizeBytes > HOMEPAGE_HERO_ASSET_MAX_BYTES) return false;

  if (kind === "model") {
    return (
      homepageHeroModelStoragePathSchema.safeParse(path).success &&
      (contentType === "model/gltf-binary" || contentType === "application/octet-stream")
    );
  }

  if (!homepageHeroPosterStoragePathSchema.safeParse(path).success) return false;
  if (path.toLowerCase().endsWith(".webp")) return contentType === "image/webp";
  if (path.toLowerCase().endsWith(".avif")) return contentType === "image/avif";
  if (path.toLowerCase().endsWith(".png")) return contentType === "image/png";
  return false;
}

function publicUrl(client: CommerceAdminPrivilegedClient, path: string): string {
  return client.storage.from(HERO_BUCKET).getPublicUrl(path).data.publicUrl;
}

async function listFolder(
  client: CommerceAdminPrivilegedClient,
  kind: AssetKind,
): Promise<HomepageHeroAssetPresentation[]> {
  const folder = assetFolder(kind);
  const { data, error } = await client.storage.from(HERO_BUCKET).list(folder, {
    limit: 100,
    sortBy: { column: "updated_at", order: "desc" },
  });

  if (error) {
    throw new HomepageHeroAssetServiceError("STORAGE_UNAVAILABLE", "Không thể đọc Homepage Hero Storage.");
  }

  const parsed = z.array(storageObjectSchema).safeParse(data ?? []);
  if (!parsed.success) {
    throw new HomepageHeroAssetServiceError("STORAGE_UNAVAILABLE", "Homepage Hero Storage trả dữ liệu không hợp lệ.");
  }

  return parsed.data.flatMap((object) => {
    const metadata = object.metadata ?? null;
    const sizeBytes = metadata?.size ?? 0;
    const contentType = String(metadata?.mimetype ?? "").toLowerCase();
    const path = `${folder}/${object.name}`;

    if (!object.id || !isAcceptedAsset(kind, path, contentType, sizeBytes)) return [];

    return [{
      kind,
      path,
      fileName: object.name,
      contentType,
      sizeBytes,
      updatedAt: object.updated_at ?? null,
      publicUrl: publicUrl(client, path),
    }];
  });
}

export async function listHomepageHeroAssets(
  client: CommerceAdminPrivilegedClient,
): Promise<HomepageHeroAssetPresentation[]> {
  const [models, posters] = await Promise.all([
    listFolder(client, "model"),
    listFolder(client, "poster"),
  ]);
  return [...models, ...posters];
}

export async function createHomepageHeroAssetUploadTicket(
  client: CommerceAdminPrivilegedClient,
  input: HomepageHeroAssetUploadTicketRequestWire,
): Promise<HomepageHeroAssetUploadTicket> {
  const extension = getExtension(input.fileName);
  const path = `${assetFolder(input.kind)}/${randomUUID()}${extension}`;

  if (!isAcceptedAsset(input.kind, path, input.contentType, input.sizeBytes)) {
    throw new HomepageHeroAssetServiceError("ASSET_INVALID", "Homepage Hero asset không hợp lệ.");
  }

  const { data, error } = await client.storage.from(HERO_BUCKET).createSignedUploadUrl(path);
  if (error || !data?.signedUrl || !data.token) {
    throw new HomepageHeroAssetServiceError("STORAGE_UNAVAILABLE", "Không thể cấp quyền upload Homepage Hero.");
  }

  return {
    kind: input.kind,
    path,
    contentType: input.contentType,
    sizeBytes: input.sizeBytes,
    signedUrl: data.signedUrl,
    token: data.token,
    publicUrl: publicUrl(client, path),
    expiresInSeconds: SIGNED_UPLOAD_TTL_SECONDS,
  };
}

function hasPrefix(bytes: Uint8Array, expected: readonly number[], offset = 0): boolean {
  return expected.every((value, index) => bytes[offset + index] === value);
}

function isValidGlb(bytes: Uint8Array): boolean {
  if (bytes.byteLength < 12 || !hasPrefix(bytes, [0x67, 0x6c, 0x54, 0x46])) return false;
  const view = new DataView(bytes.buffer, bytes.byteOffset, bytes.byteLength);
  return view.getUint32(4, true) === 2 && view.getUint32(8, true) === bytes.byteLength;
}

function isValidPoster(path: string, bytes: Uint8Array): boolean {
  const normalized = path.toLowerCase();

  if (normalized.endsWith(".png")) {
    return hasPrefix(bytes, [0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]);
  }

  if (normalized.endsWith(".webp")) {
    return (
      bytes.byteLength >= 12 &&
      hasPrefix(bytes, [0x52, 0x49, 0x46, 0x46]) &&
      hasPrefix(bytes, [0x57, 0x45, 0x42, 0x50], 8)
    );
  }

  if (normalized.endsWith(".avif")) {
    if (bytes.byteLength < 12 || !hasPrefix(bytes, [0x66, 0x74, 0x79, 0x70], 4)) return false;
    const brand = String.fromCharCode(...bytes.slice(8, 12));
    return brand === "avif" || brand === "avis";
  }

  return false;
}

async function readStorageAsset(
  client: CommerceAdminPrivilegedClient,
  path: string,
): Promise<Uint8Array> {
  const { data, error } = await client.storage.from(HERO_BUCKET).download(path);
  if (error || !data) {
    throw new HomepageHeroAssetServiceError("ASSET_NOT_FOUND", "Homepage Hero asset không tồn tại.");
  }
  if (data.size < 1 || data.size > HOMEPAGE_HERO_ASSET_MAX_BYTES) {
    throw new HomepageHeroAssetServiceError("ASSET_INVALID", "Homepage Hero asset vượt giới hạn cho phép.");
  }
  return new Uint8Array(await data.arrayBuffer());
}

export async function assertHomepageHeroAssetsPublishable(
  client: CommerceAdminPrivilegedClient,
  heroId: string,
): Promise<void> {
  const { data: hero, error } = await client
    .from("homepage_hero_presentations")
    .select("model_storage_path,poster_storage_path")
    .eq("id", heroId)
    .maybeSingle();

  if (error) {
    throw new HomepageHeroAssetServiceError("STORAGE_UNAVAILABLE", "Không thể kiểm tra Homepage Hero.");
  }
  if (!hero) {
    throw new HomepageHeroAssetServiceError("HERO_NOT_FOUND", "Homepage Hero không tồn tại.");
  }

  const modelPath = homepageHeroModelStoragePathSchema.safeParse(hero.model_storage_path);
  const posterPath = hero.poster_storage_path === null
    ? null
    : homepageHeroPosterStoragePathSchema.safeParse(hero.poster_storage_path);

  if (!modelPath.success || (posterPath && !posterPath.success)) {
    throw new HomepageHeroAssetServiceError("ASSET_INVALID", "Homepage Hero asset path không hợp lệ.");
  }

  const modelBytes = await readStorageAsset(client, modelPath.data);
  if (!isValidGlb(modelBytes)) {
    throw new HomepageHeroAssetServiceError("ASSET_INVALID", "Homepage Hero GLB không hợp lệ.");
  }

  if (posterPath?.success) {
    const posterBytes = await readStorageAsset(client, posterPath.data);
    if (!isValidPoster(posterPath.data, posterBytes)) {
      throw new HomepageHeroAssetServiceError("ASSET_INVALID", "Homepage Hero poster không hợp lệ.");
    }
  }
}
