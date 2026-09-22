import { z } from "zod";
import { raffleResultPublishSchema } from "@/features/management/raffle-ops-admin-contract";
import { publishRaffleResult, RaffleOpsAdminServiceError } from "@/features/management/raffle-ops-admin-service";
import { authorizeCommerceAdminRoute, commerceAdminFailure, commerceAdminSuccess, parseCommerceAdminJson, recordCommerceAdminAudit } from "@/features/management/commerce-admin-route-runtime";

export const dynamic = "force-dynamic";
type Props = Readonly<{ params: Promise<{ id: string }> }>;

export async function POST(request: Request, { params }: Props) {
  const context = await authorizeCommerceAdminRoute(request, ["commerce.raffle.result.publish"]);
  if (context instanceof Response) return context;
  const { id } = await params;
  const raffleId = z.uuid().safeParse(id);
  if (!raffleId.success) return commerceAdminFailure(context.identity.requestId, 400, "REQUEST_INVALID", "Raffle id không hợp lệ.");
  let parsed: ReturnType<typeof raffleResultPublishSchema.safeParse>;
  try { parsed = raffleResultPublishSchema.safeParse(parseCommerceAdminJson(context.rawBodyText)); }
  catch { parsed = { success: false, error: null } as never; }
  if (!parsed.success) return commerceAdminFailure(context.identity.requestId, 400, "REQUEST_INVALID", "Result publish payload không hợp lệ.");
  try {
    const result = await publishRaffleResult(context.privilegedClient, raffleId.data, parsed.data, {
      clientId: context.identity.clientId, actorId: context.identity.actorId, requestFingerprint: context.requestFingerprint,
    });
    await recordCommerceAdminAudit(context, { operation: "raffle.result.publish", targetType: "raffle", targetId: raffleId.data, outcome: "succeeded", httpStatus: 200 });
    return commerceAdminSuccess(result, context.identity.requestId);
  } catch (error) {
    const known = error instanceof RaffleOpsAdminServiceError;
    const status = known && error.code === "NOT_FOUND" ? 404 : known && error.code === "CONFLICT" ? 409 : 503;
    return commerceAdminFailure(context.identity.requestId, status, known ? error.code : "REMOTE_UNAVAILABLE", known ? error.message : "Không thể publish raffle result.", status === 503);
  }
}
