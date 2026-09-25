import {
  authorizeCommerceAdminRoute,
  commerceAdminFailure,
  commerceAdminSuccess,
  recordCommerceAdminAudit,
} from "@/features/management/commerce-admin-route-runtime";
import {
  HomepageHeroAssetServiceError,
  listHomepageHeroAssets,
} from "@/features/management/homepage-hero-asset-service";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  const context = await authorizeCommerceAdminRoute(request, ["commerce.hero.read"]);
  if (context instanceof Response) return context;

  try {
    const assets = await listHomepageHeroAssets(context.privilegedClient);
    await recordCommerceAdminAudit(context, {
      operation: "homepage_hero.asset_list",
      targetId: null,
      outcome: "succeeded",
      httpStatus: 200,
    });
    return commerceAdminSuccess(assets, context.identity.requestId);
  } catch (error) {
    const unavailable = error instanceof HomepageHeroAssetServiceError;
    await recordCommerceAdminAudit(context, {
      operation: "homepage_hero.asset_list",
      targetId: null,
      outcome: "failed",
      httpStatus: 503,
      failureCode: "STORAGE_UNAVAILABLE",
    }).catch(() => undefined);
    return commerceAdminFailure(
      context.identity.requestId,
      503,
      "STORAGE_UNAVAILABLE",
      unavailable ? error.message : "Không thể đọc Homepage Hero assets.",
      true,
    );
  }
}
