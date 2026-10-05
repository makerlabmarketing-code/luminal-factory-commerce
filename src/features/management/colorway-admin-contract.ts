import { z } from "zod";

export const colorwayDraftSchema = z.object({
  name: z.string().trim().min(1).max(160),
  slug: z.string().trim().regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/).max(120),
  description: z.string().trim().max(5000).nullable().optional(),
}).strict();
export const colorwayMutationSchema = z.object({
  operationId: z.uuid(), draft: colorwayDraftSchema,
}).strict();
export const colorwayRowSchema = z.object({
  id: z.uuid(), product_id: z.uuid(), name: z.string(),
  slug: z.string().nullable(), description: z.string().nullable(),
  is_active: z.boolean(), created_at: z.string(), updated_at: z.string(),
});
export type ColorwayMutation = z.infer<typeof colorwayMutationSchema>;
export type ColorwayRecord = z.infer<typeof colorwayRowSchema>;
