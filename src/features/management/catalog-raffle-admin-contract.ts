import { z } from "zod";

export const productDraftMutationSchema = z
  .object({
    operationId: z.uuid(),
    draft: z
      .object({
        slug: z.string().trim().regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/).max(120),
        name: z.string().trim().min(1).max(160),
        description: z.string().trim().max(5000).nullable().optional(),
        productType: z.enum(["artisan_keycap", "collectible_object", "custom_object", "other"]),
        releaseType: z.enum(["direct", "preorder", "informational"]),
      })
      .strict()
      .superRefine((value, context) => {
        if (value.productType === "artisan_keycap" && value.releaseType !== "informational") {
          context.addIssue({
            code: "custom",
            path: ["releaseType"],
            message: "Artisan keycaps must use informational product release type and sell through Raffle.",
          });
        }
      }),
  })
  .strict();

export const productStateMutationSchema = z.object({ operationId: z.uuid() }).strict();

const raffleStatusSchema = z.enum(["DRAFT", "SCHEDULED", "OPEN", "CLOSED"]);

export const raffleDraftMutationSchema = z
  .object({
    operationId: z.uuid(),
    draft: z
      .object({
        slug: z.string().trim().regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/).max(120),
        title: z.string().trim().min(1).max(180),
        summary: z.string().trim().max(5000).nullable().optional(),
        rulesSummary: z.string().trim().max(8000).nullable().optional(),
        rulesVersion: z.string().trim().min(1).max(64),
        productId: z.uuid().nullable().optional(),
        variantId: z.uuid().nullable().optional(),
        opensAt: z.string().datetime({ offset: true }).nullable().optional(),
        closesAt: z.string().datetime({ offset: true }).nullable().optional(),
        status: raffleStatusSchema.default("DRAFT"),
        isTest: z.boolean().default(false),
      })
      .strict()
      .superRefine((value, context) => {
        if (!value.isTest && !["DRAFT", "SCHEDULED"].includes(value.status)) {
          context.addIssue({
            code: "custom",
            path: ["status"],
            message: "Public raffle drafts may only be DRAFT or SCHEDULED.",
          });
        }

        if (value.opensAt && value.closesAt && Date.parse(value.closesAt) <= Date.parse(value.opensAt)) {
          context.addIssue({
            code: "custom",
            path: ["closesAt"],
            message: "Raffle close time must be later than open time.",
          });
        }
      }),
  })
  .strict();

export const raffleStateMutationSchema = z.object({ operationId: z.uuid() }).strict();

export type ProductDraftMutationWire = z.infer<typeof productDraftMutationSchema>;
export type ProductStateMutationWire = z.infer<typeof productStateMutationSchema>;
export type RaffleDraftMutationWire = z.infer<typeof raffleDraftMutationSchema>;
export type RaffleStateMutationWire = z.infer<typeof raffleStateMutationSchema>;
