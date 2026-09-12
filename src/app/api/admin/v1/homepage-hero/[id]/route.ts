import { z } from "zod";
import { homepageHeroDraftMutationSchema } from "@/features/management/commerce-admin-wire-contract";
import {
  authorizeCommerceAdminRoute,
  commerceAdminFailure,
  commerceAdminSuccess,
  parseCommerceAdminJson,
  recordCommerceAdminAudit,
} from "@/features/management/commerce-admin-route-runtime";
import { HomepageHeroAdminServiceError, updateHomepageHeroDraft } from "@/features/management/homepage-hero-admin-service";

export const dynamic = "force-dynamic";
const idSchema = z.uuid();

export async function PATCH(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const context = await authorizeCommerceAdminRoute(request, ["commerce.hero.write"]);
  if (context instanceof Response) return context;
  const id = idSchema.safeParse((await params).id);
  let body: unknown = null;
  try { body = parseCommerceAdminJson(context.rawBodyText); } catch { body = null; }
  const mutation = homepageHeroDraftMutationSchema.safeParse(body);
  if (!id.success || !mutation.success) {
    await recordCommerceAdminAudit(context, { operation: "homepage_hero.update_draft", targetId: id.success ? id.data : null, outcome: "failed", httpStatus: 400, failureCode: "REQUEST_INVALID" }).catch(() => undefined);
    return commerceAdminFailure(context.identity.requestId, 400, "REQUEST_INVALID", "Homepage Hero request không hợp lệ.");
  }
  try {
    const hero = await updateHomepageHeroDraft(context.client, id.data, mutation.data, { clientId: context.identity.clientId, requestFingerprint: context.requestFingerprint });
    await recordCommerceAdminAudit(context, { operation: "homepage_hero.update_draft", targetId: id.data, outcome: "succeeded", httpStatus: 200 });
    return commerceAdminSuccess(hero, context.identity.requestId);
  } catch (error) {
    const notFound = error instanceof HomepageHeroAdminServiceError && error.code === "HERO_NOT_FOUND";
    const conflict = error instanceof HomepageHeroAdminServiceError && error.code === "HERO_CONFLICT";
    const status = notFound ? 404 : conflict ? 409 : 503;
    const code = notFound ? "HERO_NOT_FOUND" : conflict ? "OPERATION_CONFLICT" : "REMOTE_UNAVAILABLE";
    await recordCommerceAdminAudit(context, { operation: "homepage_hero.update_draft", targetId: id.data, outcome: "failed", httpStatus: status, failureCode: code }).catch(() => undefined);
    return commerceAdminFailure(context.identity.requestId, status, code, notFound ? "Homepage Hero không tồn tại." : conflict ? "Homepage Hero operation conflicts with existing state." : "Không thể cập nhật Homepage Hero.", status === 503);
  }
}
