import { handleColorwayRequest } from "@/features/management/colorway-admin-route";
export const dynamic = "force-dynamic";
export async function PATCH(request: Request, { params }: { params: Promise<{ id: string; variantId: string }> }) {
  const { id, variantId } = await params;
  return handleColorwayRequest(request, id, variantId);
}
