import { z } from "zod";
import { shippingMoneySchema } from "@/features/raffle/raffle-shipping";

export const raffleWinnerSelectSchema = z.object({
  operationId: z.uuid(),
  entryId: z.uuid(),
}).strict();

const winnerPaymentTerms = {
  operationId: z.uuid(),
  paymentDeadlineAt: z.string().datetime({ offset: true }),
  fulfillmentDueAt: z.string().datetime({ offset: true }).nullable().optional(),
};

export const raffleWinnerConfirmSchema = z.union([
  z.object({ ...winnerPaymentTerms, shippingMinor: z.number().int().min(0) }).strict(),
  z.object({
    ...winnerPaymentTerms,
    useShippingRates: z.literal(true),
    override: z.object({ carrierMinor: shippingMoneySchema, coveredMinor: shippingMoneySchema }).strict().optional(),
  }).strict(),
]);

export const raffleWinnerConfirmPaymentSchema = z.object({
  operationId: z.uuid(),
  paymentReference: z.string().trim().min(1).max(160).nullable().optional(),
  note: z.string().trim().min(1).max(500).nullable().optional(),
}).strict();

export const raffleWinnerFulfillmentSchema = z.object({
  operationId: z.uuid(),
  fulfillmentDueAt: z.string().datetime({ offset: true }).nullable().optional(),
  note: z.string().trim().min(1).max(500).nullable().optional(),
}).strict();

export const raffleWinnerCompleteSchema = z.object({
  operationId: z.uuid(),
  note: z.string().trim().min(1).max(500).nullable().optional(),
}).strict();

export const raffleWinnerCancelSchema = z.object({
  operationId: z.uuid(),
  reason: z.string().trim().min(3).max(500),
}).strict();

export const raffleWinnerReallocateSchema = z.object({
  operationId: z.uuid(),
  replacementEntryId: z.uuid(),
}).strict();

export const raffleResultPublishSchema = z.object({
  operationId: z.uuid(),
}).strict();

export type RaffleWinnerSelectWire = z.infer<typeof raffleWinnerSelectSchema>;
export type RaffleWinnerConfirmWire = z.infer<typeof raffleWinnerConfirmSchema>;
export type RaffleWinnerConfirmPaymentWire = z.infer<typeof raffleWinnerConfirmPaymentSchema>;
export type RaffleWinnerFulfillmentWire = z.infer<typeof raffleWinnerFulfillmentSchema>;
export type RaffleWinnerCompleteWire = z.infer<typeof raffleWinnerCompleteSchema>;
export type RaffleWinnerCancelWire = z.infer<typeof raffleWinnerCancelSchema>;
export type RaffleWinnerReallocateWire = z.infer<typeof raffleWinnerReallocateSchema>;
export type RaffleResultPublishWire = z.infer<typeof raffleResultPublishSchema>;
