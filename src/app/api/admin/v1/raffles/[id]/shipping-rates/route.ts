import { z } from "zod";
import {
  authorizeCommerceAdminRoute, commerceAdminFailure, commerceAdminSuccess,
  parseCommerceAdminJson, recordCommerceAdminAudit,
} from "@/features/management/commerce-admin-route-runtime";
import { shippingCountrySchema, shippingMoneySchema } from "@/features/raffle/raffle-shipping";

export const dynamic = "force-dynamic";
type Props = { params: Promise<{ id: string }> };

const rateSchema = z.object({
  country_code: shippingCountrySchema,
  carrier_minor: shippingMoneySchema,
  covered_minor: shippingMoneySchema,
}).strict();

export async function GET(request: Request, { params }: Props) {
  const context = await authorizeCommerceAdminRoute(request, ["commerce.raffle.read"]);
  if (context instanceof Response) return context;
  const id = z.uuid().safeParse((await params).id);
  const requestId = context.identity.requestId;
  if (!id.success) return commerceAdminFailure(requestId, 400, "REQUEST_INVALID", "Invalid raffle.");
  const { data, error } = await context.privilegedClient.from("raffle_shipping_rates")
    .select("country_code,carrier_minor,covered_minor,customer_minor")
    .eq("raffle_id", id.data).order("country_code");
  if (error) return commerceAdminFailure(requestId, 503, "REMOTE_UNAVAILABLE", "Shipping rates unavailable.");
  return commerceAdminSuccess(data, requestId);
}

export async function PATCH(request: Request, { params }: Props) {
  const context = await authorizeCommerceAdminRoute(request, ["commerce.raffle.write"]);
  if (context instanceof Response) return context;
  const id = z.uuid().safeParse((await params).id);
  const requestId = context.identity.requestId;
  let body: unknown;
  try { body = parseCommerceAdminJson(context.rawBodyText); } catch { body = null; }
  const rate = rateSchema.safeParse(body);
  if (!id.success || !rate.success) return commerceAdminFailure(requestId, 400, "REQUEST_INVALID", "Invalid shipping rate.");
  const { data, error } = await context.privilegedClient.from("raffle_shipping_rates")
    .upsert({ raffle_id: id.data, ...rate.data }, { onConflict: "raffle_id,country_code" })
    .select("country_code,carrier_minor,covered_minor,customer_minor").single();
  if (error?.code === "23503") return commerceAdminFailure(requestId, 404, "NOT_FOUND", "Raffle not found.");
  if (error || !data) return commerceAdminFailure(requestId, 503, "REMOTE_UNAVAILABLE", "Shipping rate could not be saved.");
  await recordCommerceAdminAudit(context, {
    operation: "raffle.shipping_rate.save", targetType: "raffle", targetId: id.data,
    outcome: "succeeded", httpStatus: 200,
  });
  return commerceAdminSuccess(data, requestId);
}
