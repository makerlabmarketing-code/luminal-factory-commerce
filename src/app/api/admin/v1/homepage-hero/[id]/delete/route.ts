import { z } from "zod";
import { homepageHeroPublishMutationSchema } from "@/features/management/commerce-admin-wire-contract";
import {
  authorizeCommerceAdminRoute,
  commerceAdminFailure,
  commerceAdminSuccess,
  parseCommerceAdminJson,
  recordCommerceAdminAudit,
} from "@/features/management/commerce-admin-route-runtime";

export const dynamic = "force-dynamic";

// Draft-only deletion. Published Hero and Storage files are never deleted.
export async function POST(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const context = await authorizeCommerceAdminRoute(request, ["commerce.hero.write"]);
  if (context instanceof Response) return context;

  const id = z.uuid().safeParse((await params).id);
  let body: unknown = null;
  try { body = parseCommerceAdminJson(context.rawBodyText); } catch { body = null; }
  const mutation = homepageHeroPublishMutationSchema.safeParse(body);
  if (!id.success || !mutation.success) {
    return commerceAdminFailure(context.identity.requestId, 400, "REQUEST_INVALID", "Yêu cầu xóa bản nháp không hợp lệ.");
  }

  try {
    // Atomically require the row to still be a draft when the delete executes.
    // A concurrent publish makes this filter match zero rows, protecting live Hero.
    const { data, error } = await context.privilegedClient
      .from("homepage_hero_presentations")
      .delete()
      .eq("id", id.data)
      .eq("is_active", false)
      .is("published_at", null)
      .select("id");
    if (error) throw error;
    if (!data?.length) {
      await recordCommerceAdminAudit(context, { operation: "homepage_hero.delete_draft", targetId: id.data, outcome: "failed", httpStatus: 409, failureCode: "HERO_CONFLICT" }).catch(() => undefined);
      return commerceAdminFailure(context.identity.requestId, 409, "OPERATION_CONFLICT", "Chỉ xóa được Hero chưa xuất bản.");
    }
    await recordCommerceAdminAudit(context, { operation: "homepage_hero.delete_draft", targetId: id.data, outcome: "succeeded", httpStatus: 200 });
    return commerceAdminSuccess({ deletedId: id.data }, context.identity.requestId);
  } catch {
    await recordCommerceAdminAudit(context, { operation: "homepage_hero.delete_draft", targetId: id.data, outcome: "failed", httpStatus: 503, failureCode: "REMOTE_UNAVAILABLE" }).catch(() => undefined);
    return commerceAdminFailure(context.identity.requestId, 503, "REMOTE_UNAVAILABLE", "Không thể xóa bản nháp.", true);
  }
}
