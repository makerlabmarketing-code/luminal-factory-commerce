import { z } from "zod";
import { homepageHeroPublishMutationSchema } from "@/features/management/commerce-admin-wire-contract";
import {
  authorizeCommerceAdminRoute,
  commerceAdminFailure,
  commerceAdminSuccess,
  parseCommerceAdminJson,
  recordCommerceAdminAudit,
} from "@/features/management/commerce-admin-route-runtime";
import { HomepageHeroAdminServiceError, publishHomepageHero } from "@/features/management/homepage-hero-admin-service";
import {
  assertHomepageHeroAssetsPublishable,
  HomepageHeroAssetServiceError,
} from "@/features/management/homepage-hero-asset-service";

export const dynamic = "force-dynamic";
const idSchema = z.uuid();

export async function POST(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const context = await authorizeCommerceAdminRoute(request, ["commerce.hero.publish"]);
  if (context instanceof Response) return context;
  const id = idSchema.safeParse((await params).id);
  let body: unknown = null;
  try { body = parseCommerceAdminJson(context.rawBodyText); } catch { body = null; }
  const mutation = homepageHeroPublishMutationSchema.safeParse(body);
  if (!id.success || !mutation.success) return commerceAdminFailure(context.identity.requestId, 400, "REQUEST_INVALID", "Homepage Hero request không hợp lệ.");
  try {
    await assertHomepageHeroAssetsPublishable(context.privilegedClient, id.data);
    const hero = await publishHomepageHero(context.client, id.data, mutation.data, { clientId: context.identity.clientId, requestFingerprint: context.requestFingerprint });
    await recordCommerceAdminAudit(context, { operation: "homepage_hero.publish", targetId: id.data, outcome: "succeeded", httpStatus: 200 });
    return commerceAdminSuccess(hero, context.identity.requestId);
  } catch (error) {
    const adminNotFound = error instanceof HomepageHeroAdminServiceError && error.code === "HERO_NOT_FOUND";
    const assetNotFound = error instanceof HomepageHeroAssetServiceError && error.code === "HERO_NOT_FOUND";
    const assetInvalid = error instanceof HomepageHeroAssetServiceError && (error.code === "ASSET_NOT_FOUND" || error.code === "ASSET_INVALID");
    const conflict = error instanceof HomepageHeroAdminServiceError && error.code === "HERO_CONFLICT";
    const notFound = adminNotFound || assetNotFound;
    const status = notFound ? 404 : assetInvalid || conflict ? 409 : 503;
    const code = notFound ? "HERO_NOT_FOUND" : assetInvalid ? "HERO_ASSET_INVALID" : conflict ? "OPERATION_CONFLICT" : "REMOTE_UNAVAILABLE";
    const message = notFound
      ? "Homepage Hero không tồn tại."
      : assetInvalid
        ? "Homepage Hero asset chưa sẵn sàng để publish."
        : conflict
          ? "Homepage Hero operation conflicts with existing state."
          : "Không thể publish Homepage Hero.";
    await recordCommerceAdminAudit(context, { operation: "homepage_hero.publish", targetId: id.data, outcome: "failed", httpStatus: status, failureCode: code }).catch(() => undefined);
    return commerceAdminFailure(context.identity.requestId, status, code, message, status === 503);
  }
}
