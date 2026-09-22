import { z } from "zod";
import { productStateMutationSchema } from "@/features/management/catalog-raffle-admin-contract";
import {
  CatalogRaffleAdminServiceError,
  publishManagedProduct,
} from "@/features/management/catalog-raffle-admin-service";
import {
  authorizeCommerceAdminRoute,
  commerceAdminFailure,
  commerceAdminSuccess,
  parseCommerceAdminJson,
  recordCommerceAdminAudit,
} from "@/features/management/commerce-admin-route-runtime";

export const dynamic = "force-dynamic";

type ProductRouteProps = Readonly<{ params: Promise<{ id: string }> }>;

export async function POST(request: Request, { params }: ProductRouteProps) {
  const context = await authorizeCommerceAdminRoute(request, ["commerce.product.publish"]);
  if (context instanceof Response) return context;

  const { id } = await params;
  const productId = z.uuid().safeParse(id);
  if (!productId.success) return commerceAdminFailure(context.identity.requestId, 400, "REQUEST_INVALID", "Product id không hợp lệ.");

  let parsed: ReturnType<typeof productStateMutationSchema.safeParse>;
  try {
    parsed = productStateMutationSchema.safeParse(parseCommerceAdminJson(context.rawBodyText));
  } catch {
    parsed = { success: false, error: null } as never;
  }
  if (!parsed.success) return commerceAdminFailure(context.identity.requestId, 400, "REQUEST_INVALID", "Publish request không hợp lệ.");

  try {
    const product = await publishManagedProduct(context.privilegedClient, productId.data, parsed.data, {
      clientId: context.identity.clientId,
      requestFingerprint: context.requestFingerprint,
    });
    await recordCommerceAdminAudit(context, {
      operation: "product.publish",
      targetType: "product",
      targetId: product.id,
      outcome: "succeeded",
      httpStatus: 200,
    });
    return commerceAdminSuccess(product, context.identity.requestId);
  } catch (error) {
    const known = error instanceof CatalogRaffleAdminServiceError;
    const status = known && error.code === "NOT_FOUND" ? 404 : known && error.code === "CONFLICT" ? 409 : 503;
    return commerceAdminFailure(context.identity.requestId, status, known ? error.code : "REMOTE_UNAVAILABLE", known ? error.message : "Không thể publish Product.", status === 503);
  }
}
