import { raffleDraftMutationSchema } from "@/features/management/catalog-raffle-admin-contract";
import {
  createManagedRaffle,
  CatalogRaffleAdminServiceError,
  listManagedRaffles,
} from "@/features/management/catalog-raffle-admin-service";
import {
  authorizeCommerceAdminRoute,
  commerceAdminFailure,
  commerceAdminSuccess,
  parseCommerceAdminJson,
  recordCommerceAdminAudit,
} from "@/features/management/commerce-admin-route-runtime";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  const context = await authorizeCommerceAdminRoute(request, ["commerce.raffle.read"]);
  if (context instanceof Response) return context;

  try {
    const raffles = await listManagedRaffles(context.privilegedClient);
    await recordCommerceAdminAudit(context, {
      operation: "raffle.list",
      targetType: "raffle",
      targetId: null,
      outcome: "succeeded",
      httpStatus: 200,
    });
    return commerceAdminSuccess(raffles, context.identity.requestId);
  } catch {
    return commerceAdminFailure(context.identity.requestId, 503, "REMOTE_UNAVAILABLE", "Không thể đọc Raffle.", true);
  }
}

export async function POST(request: Request) {
  const context = await authorizeCommerceAdminRoute(request, ["commerce.raffle.write"]);
  if (context instanceof Response) return context;

  let parsed: ReturnType<typeof raffleDraftMutationSchema.safeParse>;
  try {
    parsed = raffleDraftMutationSchema.safeParse(parseCommerceAdminJson(context.rawBodyText));
  } catch {
    parsed = { success: false, error: null } as never;
  }
  if (!parsed.success) return commerceAdminFailure(context.identity.requestId, 400, "REQUEST_INVALID", "Raffle payload không hợp lệ.");

  try {
    const raffle = await createManagedRaffle(context.privilegedClient, parsed.data, {
      clientId: context.identity.clientId,
      requestFingerprint: context.requestFingerprint,
    });
    await recordCommerceAdminAudit(context, {
      operation: "raffle.create_draft",
      targetType: "raffle",
      targetId: raffle.id,
      outcome: "succeeded",
      httpStatus: 201,
    });
    return commerceAdminSuccess(raffle, context.identity.requestId, 201);
  } catch (error) {
    const conflict = error instanceof CatalogRaffleAdminServiceError && error.code === "CONFLICT";
    const status = conflict ? 409 : 503;
    return commerceAdminFailure(context.identity.requestId, status, conflict ? "OPERATION_CONFLICT" : "REMOTE_UNAVAILABLE", conflict ? error.message : "Không thể tạo Raffle.", !conflict);
  }
}
