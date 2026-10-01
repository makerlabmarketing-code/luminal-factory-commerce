import { z } from "zod";
import { revalidatePath, revalidateTag } from "next/cache";
import { homepageHeroApplyMutationSchema } from "@/features/management/commerce-admin-wire-contract";
import { normalizeDraft, toWire } from "@/features/management/homepage-hero-admin-service";
import {
  assertHomepageHeroInputAssetsPublishable,
  HomepageHeroAssetServiceError,
} from "@/features/management/homepage-hero-asset-service";
import {
  authorizeCommerceAdminRoute,
  commerceAdminFailure,
  commerceAdminSuccess,
  parseCommerceAdminJson,
  recordCommerceAdminAudit,
} from "@/features/management/commerce-admin-route-runtime";

export const dynamic = "force-dynamic";

// Applies changes to the active Hero in-place. No draft or new presentation is created.
// Conditional update guards against concurrent edits or a replacement publish.
export async function POST(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const context = await authorizeCommerceAdminRoute(request, ["commerce.hero.publish"]);
  if (context instanceof Response) return context;

  const id = z.uuid().safeParse((await params).id);
  let raw: unknown = null;
  try { raw = parseCommerceAdminJson(context.rawBodyText); } catch { raw = null; }
  const mutation = homepageHeroApplyMutationSchema.safeParse(raw);
  if (!id.success || !mutation.success) {
    return commerceAdminFailure(context.identity.requestId, 400, "REQUEST_INVALID", "Yêu cầu áp dụng Hero không hợp lệ.");
  }

  try {
    const draft = mutation.data.draft;
    await assertHomepageHeroInputAssetsPublishable(context.privilegedClient, {
      modelStoragePath: draft.modelStoragePath,
      posterStoragePath: draft.posterStoragePath ?? null,
    });

    const validated = normalizeDraft(draft);
    const { data, error } = await context.privilegedClient
      .from("homepage_hero_presentations")
      .update({ ...validated, updated_at: new Date().toISOString() })
      .eq("id", id.data)
      .eq("is_active", true)
      .eq("updated_at", mutation.data.expectedUpdatedAt)
      .select("*")
      .maybeSingle();
    if (error) throw error;
    if (!data) {
      await recordCommerceAdminAudit(context, {
        operation: "homepage_hero.apply_live",
        targetId: id.data,
        outcome: "failed",
        httpStatus: 409,
        failureCode: "HERO_CONFLICT",
      }).catch(() => undefined);
      return commerceAdminFailure(context.identity.requestId, 409, "OPERATION_CONFLICT",
        "Hero đã thay đổi hoặc không còn đang dùng. Hãy tải lại trước khi áp dụng.");
    }

    const hero = toWire(data);
    await recordCommerceAdminAudit(context, {
      operation: "homepage_hero.apply_live",
      targetId: id.data,
      outcome: "succeeded",
      httpStatus: 200,
    });

    try {
      revalidateTag("homepage-hero", { expire: 0 });
      revalidatePath("/");
    } catch (error) {
      console.error("Failed to invalidate Homepage Hero after direct apply.", error);
    }
    return commerceAdminSuccess(hero, context.identity.requestId);
  } catch (error) {
    const invalidAsset = error instanceof HomepageHeroAssetServiceError
      && ["ASSET_NOT_FOUND", "ASSET_INVALID"].includes(error.code);
    const status = invalidAsset ? 409 : 503;
    const code = invalidAsset ? "HERO_ASSET_INVALID" : "REMOTE_UNAVAILABLE";
    await recordCommerceAdminAudit(context, {
      operation: "homepage_hero.apply_live",
      targetId: id.data,
      outcome: "failed",
      httpStatus: status,
      failureCode: code,
    }).catch(() => undefined);
    return commerceAdminFailure(context.identity.requestId, status, code,
      invalidAsset ? "File 3D hoặc poster chưa sẵn sàng." : "Không thể áp dụng Hero.", status === 503);
  }
}
