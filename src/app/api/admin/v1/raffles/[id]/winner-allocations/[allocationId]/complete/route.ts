import { z } from "zod";
import { raffleWinnerCompleteSchema } from "@/features/management/raffle-ops-admin-contract";
import { completeRaffleWinnerFulfillment, RaffleOpsAdminServiceError } from "@/features/management/raffle-ops-admin-service";
import { authorizeCommerceAdminRoute, commerceAdminFailure, commerceAdminSuccess, parseCommerceAdminJson, recordCommerceAdminAudit } from "@/features/management/commerce-admin-route-runtime";

export const dynamic = "force-dynamic";
type Props = Readonly<{ params: Promise<{ id: string; allocationId: string }> }>;

export async function GET(request: Request, { params }: Props) {
  const context = await authorizeCommerceAdminRoute(request, ["commerce.raffle.fulfillment.manage"]);
  if (context instanceof Response) return context;
  const requestId = context.identity.requestId;
  const { id, allocationId } = await params;
  if (!z.uuid().safeParse(id).success || !z.uuid().safeParse(allocationId).success) {
    return commerceAdminFailure(requestId, 400, "REQUEST_INVALID", "Raffle/allocation id không hợp lệ.");
  }
  const { data, error } = await context.privilegedClient.from("raffle_winner_allocation_events")
    .select("note,created_at")
    .eq("allocation_id", allocationId)
    .eq("raffle_id", id)
    .eq("event_type", "completed")
    .order("created_at", { ascending: false })
    .order("id", { ascending: false })
    .limit(1)
    .maybeSingle();
  if (error) return commerceAdminFailure(requestId, 503, "REMOTE_UNAVAILABLE", "Không thể đọc lịch sử gửi hàng.", true);
  const tracking = data === null ? null : { note: data.note, completedAt: data.created_at };
  return commerceAdminSuccess({ tracking }, requestId);
}

export async function POST(request: Request, { params }: Props) {
  const context = await authorizeCommerceAdminRoute(request, ["commerce.raffle.fulfillment.manage"]);
  if (context instanceof Response) return context;
  const { id, allocationId } = await params;
  const raffleId = z.uuid().safeParse(id);
  const allocation = z.uuid().safeParse(allocationId);
  if (!raffleId.success || !allocation.success) return commerceAdminFailure(context.identity.requestId, 400, "REQUEST_INVALID", "Raffle/allocation id không hợp lệ.");
  let parsed: ReturnType<typeof raffleWinnerCompleteSchema.safeParse>;
  try { parsed = raffleWinnerCompleteSchema.safeParse(parseCommerceAdminJson(context.rawBodyText)); }
  catch { parsed = { success: false, error: null } as never; }
  if (!parsed.success) return commerceAdminFailure(context.identity.requestId, 400, "REQUEST_INVALID", "Completion payload không hợp lệ.");
  try {
    const result = await completeRaffleWinnerFulfillment(context.privilegedClient, raffleId.data, allocation.data, parsed.data, {
      clientId: context.identity.clientId, actorId: context.identity.actorId, requestFingerprint: context.requestFingerprint,
    });
    await recordCommerceAdminAudit(context, { operation: "raffle.winner.complete", targetType: "raffle_winner_allocation", targetId: allocation.data, outcome: "succeeded", httpStatus: 200 });
    return commerceAdminSuccess(result, context.identity.requestId);
  } catch (error) {
    const known = error instanceof RaffleOpsAdminServiceError;
    const status = known && error.code === "NOT_FOUND" ? 404 : known && error.code === "CONFLICT" ? 409 : 503;
    return commerceAdminFailure(context.identity.requestId, status, known ? error.code : "REMOTE_UNAVAILABLE", known ? error.message : "Không thể hoàn tất fulfillment.", status === 503);
  }
}
