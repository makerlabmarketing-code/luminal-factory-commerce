import { handleTranslationRoute, type TranslationRouteParams } from "@/features/management/translation-admin-route";
export const dynamic = "force-dynamic";
type Props = { params: Promise<TranslationRouteParams> };
export function GET(request: Request, { params }: Props) { return handleTranslationRoute(request, params, false); }
export function PATCH(request: Request, { params }: Props) { return handleTranslationRoute(request, params, true); }
