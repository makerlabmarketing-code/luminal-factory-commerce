import { z } from "zod";
import { raffleDraftMutationSchema } from "@/features/management/catalog-raffle-admin-contract";
import {
  CatalogRaffleAdminServiceError,
  updateManagedRaffle,
} from "@/features/management/catalog-raffle-admin-service";
import {
  authorizeCommerceAdminRoute,
  commerceAdminFailure,
  commerceAdminSuccess,
  parseCommerceAdminJson,
  recordCommerceAdminAudit,
} from "@/features/management/commerce-admin-route-runtime";

export const dynamic = "force-dynamic";

type RaffleRouteProps = Readonly<{ params: Promise<{ id: string }> }>;

export async function PATCH(request: Request, { params }: RaffleRouteProps) {
  const context = await authorizeCommerceAdminRoute(request, ["commerce.raffle.write"]);
  if (context instanceof Response) return context;

  const { id } = await params;
  const raffleId = z.uuid().safeParse(id);
  if (!raffleId.success) return commerceAdminFailure(context.identity.requestId, 400, "REQUEST_INVALID", "Raffle id không hợp lệ.");

  let parsed: ReturnType<typeof raffleDraftMutationSchema.safeParse>;
  try {
    parsed = raffleDraftMutationSchema.safeParse(parseCommerceAdminJson(context.rawBodyText));
  } catch {
    parsed = { success: false, error: null } as never;
  }
  if (!parsed.success) return commerceAdminFailure(context.identity.requestId, 400, "REQUEST_INVALID", "Raffle payload không hợp lệ.");

  try {
    const raffle = await updateManagedRaffle(context.privilegedClient, raffleId.data, parsed.data, {
      clientId: context.identity.clientId,
      requestFingerprint: context.requestFingerprint,
    });
    await recordCommerceAdminAudit(context, {
      operation: "raffle.update_draft",
      targetType: "raffle",
      targetId: raffle.id,
      outcome: "succeeded",
      httpStatus: 200,
    });
    return commerceAdminSuccess(raffle, context.identity.requestId);
  } catch (error) {
    const known = error instanceof CatalogRaffleAdminServiceError;
    const status = known && error.code === "NOT_FOUND" ? 404 : known && error.code === "CONFLICT" ? 409 : 503;
    return commerceAdminFailure(context.identity.requestId, status, known ? error.code : "REMOTE_UNAVAILABLE", known ? error.message : "Không thể cập nhật Raffle.", status === 503);
  }
}
