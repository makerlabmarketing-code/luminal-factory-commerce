import "server-only";

import { z } from "zod";
import type { Json } from "@/lib/supabase/database.types";
import type { CommerceAdminPrivilegedClient } from "./commerce-admin-route-runtime";
import type {
  RaffleResultPublishWire,
  RaffleWinnerCancelWire,
  RaffleWinnerCompleteWire,
  RaffleWinnerConfirmPaymentWire,
  RaffleWinnerConfirmWire,
  RaffleWinnerFulfillmentWire,
  RaffleWinnerReallocateWire,
  RaffleWinnerSelectWire,
} from "./raffle-ops-admin-contract";

const shippingSchema = z.object({
  recipient_name: z.string(),
  address_line_1: z.string(),
  address_line_2: z.string().nullable(),
  city: z.string(),
  state_province: z.string(),
  postal_code: z.string().nullable(),
  country_code: z.string(),
  phone: z.string().nullable(),
});

const entrySchema = z.object({
  id: z.uuid(),
  raffle_id: z.uuid(),
  contact_email: z.string().email(),
  display_name: z.string(),
  rules_version: z.string(),
  accepted_at: z.string(),
  created_at: z.string(),
  shipping: shippingSchema.nullable(),
});

const allocationSchema = z.object({
  id: z.uuid(),
  raffle_id: z.uuid(),
  raffle_entry_id: z.uuid(),
  allocation_sequence: z.number().int(),
  public_code: z.string(),
  status: z.string(),
  payment_deadline_at: z.string().nullable(),
  fulfillment_due_at: z.string().nullable(),
  order_id: z.uuid().nullable(),
  selected_at: z.string(),
  confirmed_at: z.string().nullable(),
  paid_at: z.string().nullable(),
  cancelled_at: z.string().nullable(),
  completed_at: z.string().nullable(),
  cancellation_reason: z.string().nullable(),
  created_at: z.string(),
  updated_at: z.string(),
});

const mutationResultSchema = z.record(z.string(), z.unknown());

export type RaffleAdminEntry = z.infer<typeof entrySchema>;
export type RaffleWinnerAllocation = z.infer<typeof allocationSchema>;

export class RaffleOpsAdminServiceError extends Error {
  constructor(
    public readonly code: "NOT_FOUND" | "CONFLICT" | "PERSISTENCE_FAILED",
    message: string,
  ) {
    super(message);
    this.name = "RaffleOpsAdminServiceError";
  }
}

function persistenceFailure(error: Readonly<{ code?: string; message?: string }> | null): never {
  if (error?.code === "P0002") throw new RaffleOpsAdminServiceError("NOT_FOUND", "Raffle operation record không tồn tại.");
  if (["23505", "23503", "23514", "22023", "55P03"].includes(error?.code ?? "")) {
    throw new RaffleOpsAdminServiceError("CONFLICT", "Raffle operation conflicts with current state.");
  }
  throw new RaffleOpsAdminServiceError("PERSISTENCE_FAILED", "Raffle Ops persistence failed.");
}

export async function listRaffleEntries(client: CommerceAdminPrivilegedClient, raffleId: string): Promise<RaffleAdminEntry[]> {
  const { data, error } = await client.rpc("read_raffle_entries_for_admin", { p_raffle_id: raffleId });
  if (error) persistenceFailure(error);
  return z.array(entrySchema).parse(data ?? []);
}

export async function listRaffleWinnerAllocations(client: CommerceAdminPrivilegedClient, raffleId: string): Promise<RaffleWinnerAllocation[]> {
  const { data, error } = await client
    .from("raffle_winner_allocations")
    .select("id,raffle_id,raffle_entry_id,allocation_sequence,public_code,status,payment_deadline_at,fulfillment_due_at,order_id,selected_at,confirmed_at,paid_at,cancelled_at,completed_at,cancellation_reason,created_at,updated_at")
    .eq("raffle_id", raffleId)
    .order("allocation_sequence", { ascending: true })
    .limit(200);
  if (error) persistenceFailure(error);
  return z.array(allocationSchema).parse(data ?? []);
}

type WinnerAction = "select" | "confirm" | "confirm_payment" | "start_fulfillment" | "complete" | "cancel" | "reallocate";

async function executeWinnerAction(
  client: CommerceAdminPrivilegedClient,
  input: Readonly<{
    operationId: string;
    clientId: string;
    action: WinnerAction;
    raffleId: string;
    allocationId?: string | null;
    entryId?: string | null;
    actorId: string;
    requestFingerprint: string;
    payload: Json;
  }>,
) {
  const { data, error } = await client.rpc("manage_raffle_winner_allocation", {
    p_operation_id: input.operationId,
    p_client_id: input.clientId,
    p_action: input.action,
    p_raffle_id: input.raffleId,
    p_allocation_id: input.allocationId ?? null,
    p_entry_id: input.entryId ?? null,
    p_actor_id: input.actorId,
    p_request_fingerprint: input.requestFingerprint,
    p_payload: input.payload,
  });
  if (error || !data) persistenceFailure(error);
  return mutationResultSchema.parse(data);
}

const contextPayload = (context: Readonly<{ clientId: string; actorId: string; requestFingerprint: string }>) => context;

export function selectRaffleWinner(client: CommerceAdminPrivilegedClient, raffleId: string, mutation: RaffleWinnerSelectWire, context: Readonly<{ clientId: string; actorId: string; requestFingerprint: string }>) {
  return executeWinnerAction(client, { operationId: mutation.operationId, action: "select", raffleId, entryId: mutation.entryId, payload: {}, ...contextPayload(context) });
}

export function confirmRaffleWinner(client: CommerceAdminPrivilegedClient, raffleId: string, allocationId: string, mutation: RaffleWinnerConfirmWire, context: Readonly<{ clientId: string; actorId: string; requestFingerprint: string }>) {
  return executeWinnerAction(client, {
    operationId: mutation.operationId, action: "confirm", raffleId, allocationId, ...contextPayload(context),
    payload: { shipping_minor: mutation.shippingMinor, payment_deadline_at: mutation.paymentDeadlineAt, fulfillment_due_at: mutation.fulfillmentDueAt ?? null },
  });
}

export function confirmRaffleWinnerPayment(client: CommerceAdminPrivilegedClient, raffleId: string, allocationId: string, mutation: RaffleWinnerConfirmPaymentWire, context: Readonly<{ clientId: string; actorId: string; requestFingerprint: string }>) {
  return executeWinnerAction(client, {
    operationId: mutation.operationId, action: "confirm_payment", raffleId, allocationId, ...contextPayload(context),
    payload: { payment_reference: mutation.paymentReference ?? null, note: mutation.note ?? null },
  });
}

export function startRaffleWinnerFulfillment(client: CommerceAdminPrivilegedClient, raffleId: string, allocationId: string, mutation: RaffleWinnerFulfillmentWire, context: Readonly<{ clientId: string; actorId: string; requestFingerprint: string }>) {
  return executeWinnerAction(client, {
    operationId: mutation.operationId, action: "start_fulfillment", raffleId, allocationId, ...contextPayload(context),
    payload: { fulfillment_due_at: mutation.fulfillmentDueAt ?? null, note: mutation.note ?? null },
  });
}

export function completeRaffleWinnerFulfillment(client: CommerceAdminPrivilegedClient, raffleId: string, allocationId: string, mutation: RaffleWinnerCompleteWire, context: Readonly<{ clientId: string; actorId: string; requestFingerprint: string }>) {
  return executeWinnerAction(client, {
    operationId: mutation.operationId, action: "complete", raffleId, allocationId, ...contextPayload(context),
    payload: { note: mutation.note ?? null },
  });
}

export function cancelRaffleWinnerAllocation(client: CommerceAdminPrivilegedClient, raffleId: string, allocationId: string, mutation: RaffleWinnerCancelWire, context: Readonly<{ clientId: string; actorId: string; requestFingerprint: string }>) {
  return executeWinnerAction(client, {
    operationId: mutation.operationId, action: "cancel", raffleId, allocationId, ...contextPayload(context),
    payload: { reason: mutation.reason },
  });
}

export function reallocateRaffleWinner(client: CommerceAdminPrivilegedClient, raffleId: string, allocationId: string, mutation: RaffleWinnerReallocateWire, context: Readonly<{ clientId: string; actorId: string; requestFingerprint: string }>) {
  return executeWinnerAction(client, {
    operationId: mutation.operationId, action: "reallocate", raffleId, allocationId, entryId: mutation.replacementEntryId, ...contextPayload(context),
    payload: {},
  });
}

export async function publishRaffleResult(client: CommerceAdminPrivilegedClient, raffleId: string, mutation: RaffleResultPublishWire, context: Readonly<{ clientId: string; actorId: string; requestFingerprint: string }>) {
  const { data, error } = await client.rpc("publish_raffle_result", {
    p_operation_id: mutation.operationId,
    p_client_id: context.clientId,
    p_raffle_id: raffleId,
    p_actor_id: context.actorId,
    p_request_fingerprint: context.requestFingerprint,
  });
  if (error || !data) persistenceFailure(error);
  return mutationResultSchema.parse(data);
}
