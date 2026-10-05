import { z } from 'zod';
export const MEDIA_BUCKET = 'catalog-media-drafts';
export const MEDIA_MAX_BYTES = 2 * 1024 * 1024;
export const MEDIA_MAX_COUNT = 20;
export const mediaTargetSchema = z.object({ productId: z.uuid(), variantId: z.uuid().nullable() }).strict();
export type MediaTarget = z.infer<typeof mediaTargetSchema>;
export const mediaAssetSchema = z.object({
  id: z.uuid(), fileName: z.string().trim().min(1).max(180).regex(/^[^\\/]+$/),
  path: z.string().regex(/^[0-9a-f-]{36}\/(product|[0-9a-f-]{36})\/[0-9a-f-]{36}\.webp$/),
  sizeBytes: z.number().int().positive().max(MEDIA_MAX_BYTES),
  width: z.number().int().positive().max(2048), height: z.number().int().positive().max(2048),
  alt: z.string().trim().max(500), removed: z.boolean(),
}).strict();
export type MediaAsset = z.infer<typeof mediaAssetSchema>;
export const mediaManifestSchema = mediaTargetSchema.extend({
  revision: z.number().int().nonnegative(), assets: z.array(mediaAssetSchema).max(120), primaryId: z.uuid().nullable(),
}).superRefine((m, ctx) => {
  if (new Set(m.assets.map(a => a.id)).size !== m.assets.length || (m.assets.every(a => a.removed) ? m.primaryId !== null : !m.assets.some(a => a.id === m.primaryId && !a.removed)) || m.assets.filter(a => !a.removed).length > MEDIA_MAX_COUNT || m.assets.some(a => a.path !== mediaPath(m, a.id))) ctx.addIssue({ code: 'custom', message: 'Invalid media manifest' });
});
export type MediaManifest = z.infer<typeof mediaManifestSchema>;
export const mediaTicketInputSchema = z.object({ assetId: z.uuid(), fileName: mediaAssetSchema.shape.fileName, sizeBytes: mediaAssetSchema.shape.sizeBytes }).strict();
export const mediaAppendSchema = z.object({ operationId: z.uuid(), expectedRevision: z.number().int().nonnegative(), asset: mediaAssetSchema }).strict();
export const mediaUpdateSchema = z.object({ operationId: z.uuid(), expectedRevision: z.number().int().nonnegative(), assets: z.array(z.object({ id: z.uuid(), alt: z.string().trim().max(500), removed: z.boolean() }).strict()).max(120), primaryId: z.uuid().nullable() }).strict();
export function mediaPath(target: MediaTarget, assetId: string) { return `${target.productId}/${target.variantId ?? 'product'}/${assetId}.webp`; }
