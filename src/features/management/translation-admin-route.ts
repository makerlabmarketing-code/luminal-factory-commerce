import { z } from "zod";
import { translationLocaleSchema, translationMutationSchema } from "./translation-contract";
import { readManagedTranslation, saveManagedTranslation } from "./translation-admin-service";
import { CatalogRaffleAdminServiceError } from "./catalog-raffle-admin-service";
import { authorizeCommerceAdminRoute, commerceAdminFailure, commerceAdminSuccess, parseCommerceAdminJson, recordCommerceAdminAudit } from "./commerce-admin-route-runtime";

export type TranslationRouteParams = { id: string; locale: string; variantId?: string };
export async function handleTranslationRoute(request: Request, params: Promise<TranslationRouteParams>, write: boolean) {
  const context = await authorizeCommerceAdminRoute(request, [write ? "commerce.product.write" : "commerce.product.read"]);
  if (context instanceof Response) return context;
  const parsed = z.object({ id: z.uuid(), locale: translationLocaleSchema, variantId: z.uuid().optional() }).safeParse(await params);
  if (!parsed.success) return commerceAdminFailure(context.identity.requestId, 400, "REQUEST_INVALID", "Mã sản phẩm hoặc ngôn ngữ không hợp lệ.");
  const target = { productId: parsed.data.id, variantId: parsed.data.variantId ?? null, locale: parsed.data.locale };
  let mutation;
  if (write) {
    let payload: unknown;
    try { payload = parseCommerceAdminJson(context.rawBodyText); } catch { payload = null; }
    const result = translationMutationSchema.safeParse(payload);
    if (!result.success) return commerceAdminFailure(context.identity.requestId, 400, "REQUEST_INVALID", "Nội dung bản dịch không hợp lệ.");
    mutation = result.data;
  }
  try {
    const translation = mutation ? await saveManagedTranslation(context.privilegedClient, target, mutation, {
      clientId: context.identity.clientId, requestFingerprint: context.requestFingerprint,
    }) : await readManagedTranslation(context.privilegedClient, target);
    if (write) await recordCommerceAdminAudit(context, { operation: "product.translation.save_draft", targetType: "product", targetId: target.productId, outcome: "succeeded", httpStatus: 200 });
    return commerceAdminSuccess(translation, context.identity.requestId);
  } catch (error) {
    const known = error instanceof CatalogRaffleAdminServiceError;
    const status = known && error.code === "NOT_FOUND" ? 404 : known && error.code === "CONFLICT" ? 409 : 503;
    return commerceAdminFailure(context.identity.requestId, status, known ? error.code : "REMOTE_UNAVAILABLE", "Không thể đọc hoặc lưu bản dịch.", status === 503);
  }
}
