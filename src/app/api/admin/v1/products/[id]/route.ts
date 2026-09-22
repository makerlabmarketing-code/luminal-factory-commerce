import { z } from "zod";
import { productDraftMutationSchema, productStateMutationSchema } from "@/features/management/catalog-raffle-admin-contract";
import {
  archiveManagedProduct,
  CatalogRaffleAdminServiceError,
  updateManagedProduct,
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
const idSchema = z.uuid();

async function parseProductId(params: ProductRouteProps["params"]) {
  const { id } = await params;
  return idSchema.safeParse(id);
}

export async function PATCH(request: Request, { params }: ProductRouteProps) {
  const context = await authorizeCommerceAdminRoute(request, ["commerce.product.write"]);
  if (context instanceof Response) return context;

  const id = await parseProductId(params);
  if (!id.success) return commerceAdminFailure(context.identity.requestId, 400, "REQUEST_INVALID", "Product id không hợp lệ.");

  let parsed: ReturnType<typeof productDraftMutationSchema.safeParse>;
  try {
    parsed = productDraftMutationSchema.safeParse(parseCommerceAdminJson(context.rawBodyText));
  } catch {
    parsed = { success: false, error: null } as never;
  }
  if (!parsed.success) return commerceAdminFailure(context.identity.requestId, 400, "REQUEST_INVALID", "Product payload không hợp lệ.");

  try {
    const product = await updateManagedProduct(context.privilegedClient, id.data, parsed.data, {
      clientId: context.identity.clientId,
      requestFingerprint: context.requestFingerprint,
    });
    await recordCommerceAdminAudit(context, {
      operation: "product.update_draft",
      targetType: "product",
      targetId: product.id,
      outcome: "succeeded",
      httpStatus: 200,
    });
    return commerceAdminSuccess(product, context.identity.requestId);
  } catch (error) {
    const known = error instanceof CatalogRaffleAdminServiceError;
    const status = known && error.code === "NOT_FOUND" ? 404 : known && error.code === "CONFLICT" ? 409 : 503;
    return commerceAdminFailure(context.identity.requestId, status, known ? error.code : "REMOTE_UNAVAILABLE", known ? error.message : "Không thể cập nhật Product.", status === 503);
  }
}

export async function DELETE(request: Request, { params }: ProductRouteProps) {
  const context = await authorizeCommerceAdminRoute(request, ["commerce.product.write"]);
  if (context instanceof Response) return context;

  const id = await parseProductId(params);
  if (!id.success) return commerceAdminFailure(context.identity.requestId, 400, "REQUEST_INVALID", "Product id không hợp lệ.");

  let parsed: ReturnType<typeof productStateMutationSchema.safeParse>;
  try {
    parsed = productStateMutationSchema.safeParse(parseCommerceAdminJson(context.rawBodyText));
  } catch {
    parsed = { success: false, error: null } as never;
  }
  if (!parsed.success) return commerceAdminFailure(context.identity.requestId, 400, "REQUEST_INVALID", "Archive request không hợp lệ.");

  try {
    const product = await archiveManagedProduct(context.privilegedClient, id.data, parsed.data, {
      clientId: context.identity.clientId,
      requestFingerprint: context.requestFingerprint,
    });
    await recordCommerceAdminAudit(context, {
      operation: "product.archive",
      targetType: "product",
      targetId: product.id,
      outcome: "succeeded",
      httpStatus: 200,
    });
    return commerceAdminSuccess(product, context.identity.requestId);
  } catch (error) {
    const known = error instanceof CatalogRaffleAdminServiceError;
    const status = known && error.code === "NOT_FOUND" ? 404 : known && error.code === "CONFLICT" ? 409 : 503;
    return commerceAdminFailure(context.identity.requestId, status, known ? error.code : "REMOTE_UNAVAILABLE", known ? error.message : "Không thể archive Product.", status === 503);
  }
}
