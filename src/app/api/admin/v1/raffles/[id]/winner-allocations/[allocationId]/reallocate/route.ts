import { z } from "zod";
import { raffleWinnerReallocateSchema } from "@/features/management/raffle-ops-admin-contract";
import { reallocateRaffleWinner, RaffleOpsAdminServiceError } from "@/features/management/raffle-ops-admin-service";
import { authorizeCommerceAdminRoute, commerceAdminFailure, commerceAdminSuccess, parseCommerceAdminJson, recordCommerceAdminAudit } from "@/features/management/commerce-admin-route-runtime";

export const dynamic = "force-dynamic";
type Props = Readonly<{ params: Promise<{ id: string; allocationId: string }> }>;

export async function POST(request: Request, { params }: Props) {
  const context = await authorizeCommerceAdminRoute(request, ["commerce.raffle.winner.manage"]);
  if (context instanceof Response) return context;
  const { id, allocationId } = await params;
  const raffleId = z.uuid().safeParse(id);
  const allocation = z.uuid().safeParse(allocationId);
  if (!raffleId.success || !allocation.success) return commerceAdminFailure(context.identity.requestId, 400, "REQUEST_INVALID", "Raffle/allocation id không hợp lệ.");
  let parsed: ReturnType<typeof raffleWinnerReallocateSchema.safeParse>;
  try { parsed = raffleWinnerReallocateSchema.safeParse(parseCommerceAdminJson(context.rawBodyText)); }
  catch { parsed = { success: false, error: null } as never; }
  if (!parsed.success) return commerceAdminFailure(context.identity.requestId, 400, "REQUEST_INVALID", "Reallocation payload không hợp lệ.");
  try {
    const result = await reallocateRaffleWinner(context.privilegedClient, raffleId.data, allocation.data, parsed.data, {
      clientId: context.identity.clientId, actorId: context.identity.actorId, requestFingerprint: context.requestFingerprint,
    });
    await recordCommerceAdminAudit(context, { operation: "raffle.winner.reallocate", targetType: "raffle_winner_allocation", targetId: allocation.data, outcome: "succeeded", httpStatus: 200 });
    return commerceAdminSuccess(result, context.identity.requestId);
  } catch (error) {
    const known = error instanceof RaffleOpsAdminServiceError;
    const status = known && error.code === "NOT_FOUND" ? 404 : known && error.code === "CONFLICT" ? 409 : 503;
    return commerceAdminFailure(context.identity.requestId, status, known ? error.code : "REMOTE_UNAVAILABLE", known ? error.message : "Không thể reallocate winner.", status === 503);
  }
}
