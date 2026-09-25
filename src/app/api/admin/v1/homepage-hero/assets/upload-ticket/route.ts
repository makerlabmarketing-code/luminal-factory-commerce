import { homepageHeroAssetUploadTicketRequestSchema } from "@/features/management/commerce-admin-wire-contract";
import {
  authorizeCommerceAdminRoute,
  commerceAdminFailure,
  commerceAdminSuccess,
  parseCommerceAdminJson,
  recordCommerceAdminAudit,
} from "@/features/management/commerce-admin-route-runtime";
import {
  createHomepageHeroAssetUploadTicket,
  HomepageHeroAssetServiceError,
} from "@/features/management/homepage-hero-asset-service";

export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  const context = await authorizeCommerceAdminRoute(request, ["commerce.hero.write"]);
  if (context instanceof Response) return context;

  let body: unknown = null;
  try {
    body = parseCommerceAdminJson(context.rawBodyText);
  } catch {
    body = null;
  }

  const input = homepageHeroAssetUploadTicketRequestSchema.safeParse(body);
  if (!input.success) {
    await recordCommerceAdminAudit(context, {
      operation: "homepage_hero.asset_upload_ticket",
      targetId: null,
      outcome: "failed",
      httpStatus: 400,
      failureCode: "REQUEST_INVALID",
    }).catch(() => undefined);
    return commerceAdminFailure(
      context.identity.requestId,
      400,
      "REQUEST_INVALID",
      "Homepage Hero asset payload không hợp lệ.",
    );
  }

  try {
    const ticket = await createHomepageHeroAssetUploadTicket(context.privilegedClient, input.data);
    await recordCommerceAdminAudit(context, {
      operation: "homepage_hero.asset_upload_ticket",
      targetId: ticket.path,
      outcome: "succeeded",
      httpStatus: 201,
    });
    return commerceAdminSuccess(ticket, context.identity.requestId, 201);
  } catch (error) {
    const invalid = error instanceof HomepageHeroAssetServiceError && error.code === "ASSET_INVALID";
    const status = invalid ? 400 : 503;
    const code = invalid ? "ASSET_INVALID" : "STORAGE_UNAVAILABLE";
    await recordCommerceAdminAudit(context, {
      operation: "homepage_hero.asset_upload_ticket",
      targetId: null,
      outcome: "failed",
      httpStatus: status,
      failureCode: code,
    }).catch(() => undefined);
    return commerceAdminFailure(
      context.identity.requestId,
      status,
      code,
      error instanceof HomepageHeroAssetServiceError ? error.message : "Không thể cấp quyền upload Homepage Hero.",
      status === 503,
    );
  }
}
