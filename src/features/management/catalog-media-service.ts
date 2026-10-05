import 'server-only';
import sharp from 'sharp';
import type { CommerceAdminPrivilegedClient } from './commerce-admin-route-runtime';
import { CatalogRaffleAdminServiceError } from './catalog-raffle-admin-service';
import { MEDIA_BUCKET, MEDIA_MAX_BYTES, mediaManifestSchema, mediaPath, type MediaAsset, type MediaManifest, type MediaTarget } from './catalog-media-contract';
type MediaRpc = { rpc(name: string, args: Record<string, unknown>): PromiseLike<{ data: unknown; error: { code?: string } | null }> };
function fail(code?: string): never {
  if (code === 'P0002') throw new CatalogRaffleAdminServiceError('NOT_FOUND', 'Không tìm thấy sản phẩm hoặc phối màu.');
  if (['40001','22023','23505','23514'].includes(code ?? '')) throw new CatalogRaffleAdminServiceError('CONFLICT', 'Bộ ảnh đã thay đổi hoặc không còn là bản nháp. Tải lại trước khi lưu.');
  throw new CatalogRaffleAdminServiceError('PERSISTENCE_FAILED', 'Chưa thể truy cập bộ ảnh.');
}
async function rpc(client: CommerceAdminPrivilegedClient, name: string, args: Record<string, unknown>) {
  const { data, error } = await (client as unknown as MediaRpc).rpc(name, args);
  if (error) fail(error.code);
  return data;
}
function manifest(data: unknown, target: MediaTarget): MediaManifest {
  const parsed = mediaManifestSchema.safeParse(data);
  if (!parsed.success || parsed.data.productId !== target.productId || parsed.data.variantId !== target.variantId) fail();
  return parsed.data;
}
export async function readMediaManifest(client: CommerceAdminPrivilegedClient, target: MediaTarget) {
  return manifest(await rpc(client, 'read_catalog_media_draft', { p_product_id: target.productId, p_variant_id: target.variantId }), target);
}
async function assertWritable(client: CommerceAdminPrivilegedClient, target: MediaTarget) {
  const parent = await client.from('products').select('status').eq('id', target.productId).maybeSingle();
  if (parent.error) fail(); if (!parent.data) fail('P0002'); if (parent.data.status !== 'draft') fail('22023');
  if (target.variantId) {
    const variant = await client.from('product_variants').select('is_active').eq('id', target.variantId).eq('product_id', target.productId).maybeSingle();
    if (variant.error) fail(); if (!variant.data) fail('P0002'); if (variant.data.is_active) fail('22023');
  }
}
export async function createMediaTicket(client: CommerceAdminPrivilegedClient, target: MediaTarget, input: { assetId: string; fileName: string; sizeBytes: number }) {
  await assertWritable(client, target);
  const current = await readMediaManifest(client, target);
  if (current.assets.filter(a => !a.removed).length >= 20 && !current.assets.some(a => a.id === input.assetId)) fail('22023');
  if (current.assets.length >= 120 && !current.assets.some(a => a.id === input.assetId)) fail('22023');
  const path = mediaPath(target, input.assetId);
  const { data, error } = await client.storage.from(MEDIA_BUCKET).createSignedUploadUrl(path, { upsert: false });
  if (error || !data?.signedUrl) fail();
  return { assetId: input.assetId, path, signedUrl: data.signedUrl, sizeBytes: input.sizeBytes, expiresInSeconds: 7200 };
}
export async function presentMedia(client: CommerceAdminPrivilegedClient, value: MediaManifest) {
  if (!value.assets.length) return { ...value, previews: [] };
  const { data, error } = await client.storage.from(MEDIA_BUCKET).createSignedUrls(value.assets.map(a => a.path), 300);
  if (error || !data || data.length !== value.assets.length || data.some(a => !a.signedUrl || a.error)) fail();
  return { ...value, previews: value.assets.map(a => ({ id: a.id, url: data.find(s => s.path === a.path)?.signedUrl ?? '' })) };
}
export async function saveMedia(client: CommerceAdminPrivilegedClient, target: MediaTarget, action: 'append' | 'update', input: { operationId: string; expectedRevision: number; asset?: MediaAsset; assets?: { id: string; alt: string; removed: boolean }[]; primaryId?: string | null }, identity: { clientId: string; requestFingerprint: string }) {
  await assertWritable(client, target);
  if (action === 'append') {
    const asset = input.asset!;
    if (asset.path !== mediaPath(target, asset.id)) fail('22023');
    // Metadata is untrusted: verify the actual object, decode it and bound pixels before attachment.
    const { data, error } = await client.storage.from(MEDIA_BUCKET).download(asset.path);
    if (error || !data || data.size !== asset.sizeBytes || data.size > MEDIA_MAX_BYTES) fail('22023');
    try {
      const image = sharp(Buffer.from(await data.arrayBuffer()), { limitInputPixels: 2048 * 2048 });
      const meta = await image.metadata();
      if (meta.format !== 'webp' || meta.width !== asset.width || meta.height !== asset.height || (meta.pages ?? 1) > 1) fail('22023');
      await image.resize(1, 1).raw().toBuffer();
    } catch { fail('22023'); }
  }
  const payload = action === 'append' ? { asset: input.asset } : { assets: input.assets, primaryId: input.primaryId };
  return manifest(await rpc(client, 'save_catalog_media_draft', {
    p_product_id: target.productId, p_variant_id: target.variantId, p_action: action, p_operation_id: input.operationId,
    p_client_id: identity.clientId, p_request_fingerprint: identity.requestFingerprint, p_expected_revision: input.expectedRevision, p_payload: payload,
  }), target);
}
