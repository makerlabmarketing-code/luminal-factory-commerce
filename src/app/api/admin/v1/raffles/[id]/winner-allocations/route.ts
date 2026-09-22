import { z } from "zod";
import { raffleWinnerSelectSchema } from "@/features/management/raffle-ops-admin-contract";
import { listRaffleWinnerAllocations, RaffleOpsAdminServiceError, selectRaffleWinner } from "@/features/management/raffle-ops-admin-service";
import { authorizeCommerceAdminRoute, commerceAdminFailure, commerceAdminSuccess, parseCommerceAdminJson, recordCommerceAdminAudit } from "@/features/management/commerce-admin-route-runtime";

export const dynamic = "force-dynamic";
type Props = Readonly<{ params: Promise<{ id: string }> }>;

export async function GET(request: Request, { params }: Props) {
  const context = await authorizeCommerceAdminRoute(request, ["commerce.raffle.winner.manage"]);
  if (context instanceof Response) return context;
  const { id } = await params;
  const raffleId = z.uuid().safeParse(id);
  if (!raffleId.success) return commerceAdminFailure(context.identity.requestId, 400, "REQUEST_INVALID", "Raffle id không hợp lệ.");
  try {
    return commerceAdminSuccess(await listRaffleWinnerAllocations(context.privilegedClient, raffleId.data), context.identity.requestId);
  } catch {
    return commerceAdminFailure(context.identity.requestId, 503, "REMOTE_UNAVAILABLE", "Không thể đọc winner allocations.", true);
  }
}

export async function POST(request: Request, { params }: Props) {
  const context = await authorizeCommerceAdminRoute(request, ["commerce.raffle.winner.manage"]);
  if (context instanceof Response) return context;
  const { id } = await params;
  const raffleId = z.uuid().safeParse(id);
  if (!raffleId.success) return commerceAdminFailure(context.identity.requestId, 400, "REQUEST_INVALID", "Raffle id không hợp lệ.");
  let parsed: ReturnType<typeof raffleWinnerSelectSchema.safeParse>;
  try { parsed = raffleWinnerSelectSchema.safeParse(parseCommerceAdminJson(context.rawBodyText)); }
  catch { parsed = { success: false, error: null } as never; }
  if (!parsed.success) return commerceAdminFailure(context.identity.requestId, 400, "REQUEST_INVALID", "Winner selection payload không hợp lệ.");
  try {
    const result = await selectRaffleWinner(context.privilegedClient, raffleId.data, parsed.data, {
      clientId: context.identity.clientId, actorId: context.identity.actorId, requestFingerprint: context.requestFingerprint,
    });
    await recordCommerceAdminAudit(context, { operation: "raffle.winner.select", targetType: "raffle", targetId: raffleId.data, outcome: "succeeded", httpStatus: 201 });
    return commerceAdminSuccess(result, context.identity.requestId, 201);
  } catch (error) {
    const known = error instanceof RaffleOpsAdminServiceError;
    const status = known && error.code === "NOT_FOUND" ? 404 : known && error.code === "CONFLICT" ? 409 : 503;
    return commerceAdminFailure(context.identity.requestId, status, known ? error.code : "REMOTE_UNAVAILABLE", known ? error.message : "Không thể chọn winner.", status === 503);
  }
}
