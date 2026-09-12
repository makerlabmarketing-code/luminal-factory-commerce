import { homepageHeroDraftMutationSchema } from "@/features/management/commerce-admin-wire-contract";
import {
  authorizeCommerceAdminRoute,
  commerceAdminFailure,
  commerceAdminSuccess,
  parseCommerceAdminJson,
  recordCommerceAdminAudit,
} from "@/features/management/commerce-admin-route-runtime";
import {
  createHomepageHeroDraft,
  HomepageHeroAdminServiceError,
  listHomepageHeroPresentations,
} from "@/features/management/homepage-hero-admin-service";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  const context = await authorizeCommerceAdminRoute(request, ["commerce.hero.read"]);
  if (context instanceof Response) return context;
  try {
    const heroes = await listHomepageHeroPresentations(context.client);
    await recordCommerceAdminAudit(context, { operation: "homepage_hero.list", targetId: null, outcome: "succeeded", httpStatus: 200 });
    return commerceAdminSuccess(heroes, context.identity.requestId);
  } catch {
    return commerceAdminFailure(context.identity.requestId, 503, "REMOTE_UNAVAILABLE", "Không thể đọc Homepage Hero.", true);
  }
}

export async function POST(request: Request) {
  const context = await authorizeCommerceAdminRoute(request, ["commerce.hero.write"]);
  if (context instanceof Response) return context;
  let parsed: ReturnType<typeof homepageHeroDraftMutationSchema.safeParse>;
  try {
    parsed = homepageHeroDraftMutationSchema.safeParse(parseCommerceAdminJson(context.rawBodyText));
  } catch {
    parsed = { success: false, error: null } as never;
  }
  if (!parsed.success) {
    await recordCommerceAdminAudit(context, { operation: "homepage_hero.create_draft", targetId: null, outcome: "failed", httpStatus: 400, failureCode: "REQUEST_INVALID" }).catch(() => undefined);
    return commerceAdminFailure(context.identity.requestId, 400, "REQUEST_INVALID", "Homepage Hero payload không hợp lệ.");
  }
  try {
    const hero = await createHomepageHeroDraft(context.client, parsed.data, { clientId: context.identity.clientId, requestFingerprint: context.requestFingerprint });
    await recordCommerceAdminAudit(context, { operation: "homepage_hero.create_draft", targetId: hero.id, outcome: "succeeded", httpStatus: 201 });
    return commerceAdminSuccess(hero, context.identity.requestId, 201);
  } catch (error) {
    const conflict = error instanceof HomepageHeroAdminServiceError && error.code === "HERO_CONFLICT";
    const status = conflict ? 409 : 503;
    const code = conflict ? "OPERATION_CONFLICT" : "REMOTE_UNAVAILABLE";
    await recordCommerceAdminAudit(context, { operation: "homepage_hero.create_draft", targetId: null, outcome: "failed", httpStatus: status, failureCode: code }).catch(() => undefined);
    return commerceAdminFailure(context.identity.requestId, status, code, conflict ? "Homepage Hero operation conflicts with existing state." : "Không thể tạo Homepage Hero.", !conflict);
  }
}
