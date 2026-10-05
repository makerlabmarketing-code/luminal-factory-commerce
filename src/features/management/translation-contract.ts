import { z } from "zod";

export const translationLocaleSchema = z.enum(["en", "vi"]);
export const translationContentSchema = z.object({
  title: z.string().trim().max(160).nullable().transform(value => value || null),
  description: z.string().trim().max(5000).nullable().transform(value => value || null),
  story: z.string().trim().max(8000).nullable().transform(value => value || null),
  seoTitle: z.string().trim().max(180).nullable().transform(value => value || null),
  seoDescription: z.string().trim().max(500).nullable().transform(value => value || null),
  primaryMediaAlt: z.string().trim().max(500).nullable().transform(value => value || null),
}).strict();
export const translationDraftSchema = z.object({
  content: translationContentSchema,
  ready: z.boolean(),
}).strict().refine(value => !value.ready || Boolean(value.content.title?.trim() && value.content.description?.trim()), {
  message: "Bản dịch cần tên và mô tả trước khi gửi duyệt.",
});
export const translationMutationSchema = z.object({
  operationId: z.uuid(), expectedRevision: z.number().int().min(0).max(2147483646),
  draft: translationDraftSchema,
}).strict();
export const translationRecordSchema = z.object({
  productId: z.uuid(), variantId: z.uuid().nullable().transform(value => value || null), locale: translationLocaleSchema,
  revision: z.number().int().min(1).max(2147483647),
  content: translationContentSchema, ready: z.boolean(), updatedAt: z.iso.datetime({ offset: true }),
}).strict().refine(value => !value.ready || Boolean(value.content.title?.trim() && value.content.description?.trim()));
export type TranslationContent = z.infer<typeof translationContentSchema>;
export type TranslationMutation = z.infer<typeof translationMutationSchema>;
export type TranslationRecord = z.infer<typeof translationRecordSchema>;
