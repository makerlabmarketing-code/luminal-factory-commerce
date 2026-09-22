import { z } from "zod";
import { listRaffleEntries } from "@/features/management/raffle-ops-admin-service";
import { authorizeCommerceAdminRoute, commerceAdminFailure, commerceAdminSuccess, recordCommerceAdminAudit } from "@/features/management/commerce-admin-route-runtime";

export const dynamic = "force-dynamic";
type Props = Readonly<{ params: Promise<{ id: string }> }>;

export async function GET(request: Request, { params }: Props) {
  const context = await authorizeCommerceAdminRoute(request, ["commerce.raffle.entry.read"]);
  if (context instanceof Response) return context;
  const { id } = await params;
  const raffleId = z.uuid().safeParse(id);
  if (!raffleId.success) return commerceAdminFailure(context.identity.requestId, 400, "REQUEST_INVALID", "Raffle id không hợp lệ.");
  try {
    const entries = await listRaffleEntries(context.privilegedClient, raffleId.data);
    await recordCommerceAdminAudit(context, { operation: "raffle.entries.list", targetType: "raffle", targetId: raffleId.data, outcome: "succeeded", httpStatus: 200 });
    return commerceAdminSuccess(entries, context.identity.requestId);
  } catch {
    return commerceAdminFailure(context.identity.requestId, 503, "REMOTE_UNAVAILABLE", "Không thể đọc Raffle Entries.", true);
  }
}
