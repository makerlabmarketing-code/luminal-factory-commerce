import { z } from "zod";
import { buildRafflePaymentQuote, paymentQuoteOrderSchema } from "@/features/raffle/raffle-payment-quote";
import { raffleWinnerConfirmSchema } from "@/features/management/raffle-ops-admin-contract";
import { confirmRaffleWinner, RaffleOpsAdminServiceError } from "@/features/management/raffle-ops-admin-service";
import { authorizeCommerceAdminRoute, commerceAdminFailure, commerceAdminSuccess, parseCommerceAdminJson, recordCommerceAdminAudit } from "@/features/management/commerce-admin-route-runtime";

export const dynamic = "force-dynamic";
type Props = Readonly<{ params: Promise<{ id: string; allocationId: string }> }>;

export async function GET(request: Request, { params }: Props) {
  const context = await authorizeCommerceAdminRoute(request, ["commerce.raffle.winner.manage"]);
  if (context instanceof Response) return context;
  const { id, allocationId } = await params;
  const requestId = context.identity.requestId;
  if (!z.uuid().safeParse(id).success || !z.uuid().safeParse(allocationId).success) {
    return commerceAdminFailure(requestId, 400, "REQUEST_INVALID", "Invalid raffle or allocation.");
  }
  const allocation = await context.privilegedClient.from("raffle_winner_allocations")
    .select("order_id,payment_deadline_at,status").eq("id", allocationId).eq("raffle_id", id).maybeSingle();
  if (allocation.error) return commerceAdminFailure(requestId, 503, "REMOTE_UNAVAILABLE", "Payment quote unavailable.");
  const winner = allocation.data;
  const deadline = z.iso.datetime({ offset: true }).safeParse(winner?.payment_deadline_at);
  if (!winner?.order_id || winner.status !== "PAYMENT_PENDING" || !deadline.success || Date.parse(deadline.data) <= Date.now()) {
    return commerceAdminFailure(requestId, 409, "CONFLICT", "The allocation has no current pending quote.");
  }
  const order = await context.privilegedClient.from("orders")
    .select("customer_email_snapshot,order_number,currency,subtotal_minor,shipping_minor,grand_total_minor")
    .eq("id", winner.order_id).eq("status", "pending").maybeSingle();
  const quote = paymentQuoteOrderSchema.safeParse(order.data);
  if (order.error || !quote.success) return commerceAdminFailure(requestId, 503, "REMOTE_UNAVAILABLE", "Payment quote unavailable.");
  return commerceAdminSuccess(buildRafflePaymentQuote(quote.data, deadline.data), requestId);
}

export async function POST(request: Request, { params }: Props) {
  const context = await authorizeCommerceAdminRoute(request, ["commerce.raffle.winner.manage"]);
  if (context instanceof Response) return context;
  const { id, allocationId } = await params;
  const raffleId = z.uuid().safeParse(id);
  const allocation = z.uuid().safeParse(allocationId);
  if (!raffleId.success || !allocation.success) return commerceAdminFailure(context.identity.requestId, 400, "REQUEST_INVALID", "Raffle/allocation id không hợp lệ.");
  let parsed: ReturnType<typeof raffleWinnerConfirmSchema.safeParse>;
  try { parsed = raffleWinnerConfirmSchema.safeParse(parseCommerceAdminJson(context.rawBodyText)); }
  catch { parsed = { success: false, error: null } as never; }
  if (!parsed.success) return commerceAdminFailure(context.identity.requestId, 400, "REQUEST_INVALID", "Winner confirmation payload không hợp lệ.");
  try {
    const result = await confirmRaffleWinner(context.privilegedClient, raffleId.data, allocation.data, parsed.data, {
      clientId: context.identity.clientId, actorId: context.identity.actorId, requestFingerprint: context.requestFingerprint,
    });
    await recordCommerceAdminAudit(context, { operation: "raffle.winner.confirm", targetType: "raffle_winner_allocation", targetId: allocation.data, outcome: "succeeded", httpStatus: 200 });
    return commerceAdminSuccess(result, context.identity.requestId);
  } catch (error) {
    const known = error instanceof RaffleOpsAdminServiceError;
    const status = known && error.code === "NOT_FOUND" ? 404 : known && error.code === "CONFLICT" ? 409 : 503;
    return commerceAdminFailure(context.identity.requestId, status, known ? error.code : "REMOTE_UNAVAILABLE", known ? error.message : "Không thể xác nhận winner.", status === 503);
  }
}
