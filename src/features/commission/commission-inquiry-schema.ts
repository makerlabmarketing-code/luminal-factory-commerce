import { z } from "zod";

export const commissionCategories = [
  "artisan-keycap",
  "collectible-object",
  "branded-custom-object",
] as const;

export const commissionInquirySchema = z.object({
  requestId: z.string().uuid(),
  name: z.string().trim().min(2).max(120),
  email: z.string().trim().email().max(254),
  category: z.enum(commissionCategories),
  projectSummary: z.string().trim().min(40).max(2500),
  referenceUrl: z.union([z.literal(""), z.string().trim().url().max(500)]).optional().default(""),
  timingContext: z.string().trim().max(500).optional().default(""),
  budgetContext: z.string().trim().max(500).optional().default(""),
  privacyAccepted: z.literal(true),
  website: z.string().max(0).optional().default(""),
});

export type CommissionInquiryInput = z.infer<typeof commissionInquirySchema>;

export const commissionCategoryLabels: Record<(typeof commissionCategories)[number], string> = {
  "artisan-keycap": "Artisan keycap",
  "collectible-object": "Collectible object",
  "branded-custom-object": "Branded / custom object",
};
