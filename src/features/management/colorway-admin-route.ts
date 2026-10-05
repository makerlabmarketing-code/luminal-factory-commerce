import { z } from "zod";
import { colorwayMutationSchema } from "./colorway-admin-contract";
import { listManagedColorways, saveManagedColorway } from "./colorway-admin-service";
import { CatalogRaffleAdminServiceError } from "./catalog-raffle-admin-service";
import { authorizeCommerceAdminRoute, commerceAdminFailure, commerceAdminSuccess, parseCommerceAdminJson, recordCommerceAdminAudit } from "./commerce-admin-route-runtime";

export async function handleColorwayRequest(request: Request, productId: string, variantId?: string) {
  const read = request.method === "GET";
  const context = await authorizeCommerceAdminRoute(request, [read ? "commerce.product.read" : "commerce.product.write"]);
  if (context instanceof Response) return context;
  if (!z.uuid().safeParse(productId).success || (variantId !== undefined && !z.uuid().safeParse(variantId).success)) {
    return commerceAdminFailure(context.identity.requestId, 400, "REQUEST_INVALID", "Mã sản phẩm/phối màu không hợp lệ.");
  }
  try {
    if (read) {
      const rows = await listManagedColorways(context.privilegedClient, productId);
      await recordCommerceAdminAudit(context, { operation: "product.colorway.list", targetType: "product", targetId: productId, outcome: "succeeded", httpStatus: 200 });
      return commerceAdminSuccess(rows, context.identity.requestId);
    }
    const parsed = colorwayMutationSchema.safeParse(parseCommerceAdminJson(context.rawBodyText));
    if (!parsed.success) return commerceAdminFailure(context.identity.requestId, 400, "REQUEST_INVALID", "Thông tin phối màu không hợp lệ.");
    const row = await saveManagedColorway(context.privilegedClient, productId, variantId ?? null, parsed.data,
      { clientId: context.identity.clientId, requestFingerprint: context.requestFingerprint });
    const status = variantId ? 200 : 201;
    await recordCommerceAdminAudit(context, { operation: variantId ? "product.colorway.update_draft" : "product.colorway.create_draft", targetType: "product", targetId: productId, outcome: "succeeded", httpStatus: status });
    return commerceAdminSuccess(row, context.identity.requestId, status);
  } catch (error) {
    if (error instanceof SyntaxError) return commerceAdminFailure(context.identity.requestId, 400, "REQUEST_INVALID", "JSON không hợp lệ.");
    const known = error instanceof CatalogRaffleAdminServiceError;
    const status = known && error.code === "NOT_FOUND" ? 404 : known && error.code === "CONFLICT" ? 409 : 503;
    await recordCommerceAdminAudit(context, { operation: read ? "product.colorway.list" : "product.colorway.save_draft", targetType: "product", targetId: productId, outcome: "failed", httpStatus: status, failureCode: known ? error.code : "REMOTE_UNAVAILABLE" }).catch(() => undefined);
    return commerceAdminFailure(context.identity.requestId, status, known ? error.code : "REMOTE_UNAVAILABLE", known ? error.message : "Chưa thể truy cập phối màu.", status === 503);
  }
}
