import { productDraftMutationSchema } from "@/features/management/catalog-raffle-admin-contract";
import {
  createManagedProduct,
  CatalogRaffleAdminServiceError,
  listManagedProducts,
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
  const context = await authorizeCommerceAdminRoute(request, ["commerce.product.read"]);
  if (context instanceof Response) return context;

  try {
    const products = await listManagedProducts(context.privilegedClient);
    await recordCommerceAdminAudit(context, {
      operation: "product.list",
      targetType: "product",
      targetId: null,
      outcome: "succeeded",
      httpStatus: 200,
    });
    return commerceAdminSuccess(products, context.identity.requestId);
  } catch {
    return commerceAdminFailure(context.identity.requestId, 503, "REMOTE_UNAVAILABLE", "Không thể đọc Product catalog.", true);
  }
}

export async function POST(request: Request) {
  const context = await authorizeCommerceAdminRoute(request, ["commerce.product.write"]);
  if (context instanceof Response) return context;

  let parsed: ReturnType<typeof productDraftMutationSchema.safeParse>;
  try {
    parsed = productDraftMutationSchema.safeParse(parseCommerceAdminJson(context.rawBodyText));
  } catch {
    parsed = { success: false, error: null } as never;
  }

  if (!parsed.success) {
    await recordCommerceAdminAudit(context, {
      operation: "product.create_draft",
      targetType: "product",
      targetId: null,
      outcome: "failed",
      httpStatus: 400,
      failureCode: "REQUEST_INVALID",
    }).catch(() => undefined);
    return commerceAdminFailure(context.identity.requestId, 400, "REQUEST_INVALID", "Product payload không hợp lệ.");
  }

  try {
    const product = await createManagedProduct(context.privilegedClient, parsed.data, {
      clientId: context.identity.clientId,
      requestFingerprint: context.requestFingerprint,
    });
    await recordCommerceAdminAudit(context, {
      operation: "product.create_draft",
      targetType: "product",
      targetId: product.id,
      outcome: "succeeded",
      httpStatus: 201,
    });
    return commerceAdminSuccess(product, context.identity.requestId, 201);
  } catch (error) {
    const conflict = error instanceof CatalogRaffleAdminServiceError && error.code === "CONFLICT";
    const status = conflict ? 409 : 503;
    const code = conflict ? "OPERATION_CONFLICT" : "REMOTE_UNAVAILABLE";
    return commerceAdminFailure(context.identity.requestId, status, code, conflict ? "Product operation conflicts with current state." : "Không thể tạo Product.", !conflict);
  }
}
