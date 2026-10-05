import "server-only";
import { z } from "zod";
import { colorwayRowSchema, type ColorwayMutation } from "./colorway-admin-contract";
import { CatalogRaffleAdminServiceError } from "./catalog-raffle-admin-service";
import type { CommerceAdminPrivilegedClient } from "./commerce-admin-route-runtime";

function failure(code?: string): never {
  if (code === "P0002") throw new CatalogRaffleAdminServiceError("NOT_FOUND", "Không tìm thấy sản phẩm hoặc phối màu.");
  if (["23505", "23514", "22023", "55P03"].includes(code ?? "")) throw new CatalogRaffleAdminServiceError("CONFLICT", "Phối màu đã thay đổi, đường dẫn bị trùng hoặc sản phẩm không còn là bản nháp.");
  throw new CatalogRaffleAdminServiceError("PERSISTENCE_FAILED", "Không thể lưu phối màu.");
}
export async function listManagedColorways(client: CommerceAdminPrivilegedClient, productId: string) {
  const parent = await client.from("products").select("id").eq("id", productId).maybeSingle();
  if (parent.error) failure(parent.error.code);
  if (!parent.data) failure("P0002");
  const { data, error } = await client.from("product_variants")
    .select("id,product_id,name,attributes,is_active,created_at,updated_at")
    .eq("product_id", productId).order("created_at", { ascending: true }).limit(201);
  if (error) failure(error.code);
  if ((data?.length ?? 0) > 200) failure();
  return z.array(colorwayRowSchema).parse((data ?? []).map(row => {
    const attributes = row.attributes && typeof row.attributes === "object" && !Array.isArray(row.attributes) ? row.attributes : {};
    return { ...row, slug: attributes.colorway_slug ?? null, description: attributes.colorway_description ?? null };
  }));
}
export async function saveManagedColorway(client: CommerceAdminPrivilegedClient, productId: string,
  variantId: string | null, mutation: ColorwayMutation,
  context: Readonly<{ clientId: string; requestFingerprint: string }>) {
  const { data, error } = await client.rpc("manage_catalog_colorway", {
    p_operation_id: mutation.operationId, p_client_id: context.clientId,
    p_action: variantId ? "update_draft" : "create_draft", p_product_id: productId,
    p_target_id: variantId ?? "00000000-0000-0000-0000-000000000000",
    p_request_fingerprint: context.requestFingerprint,
    p_colorway: { ...mutation.draft, description: mutation.draft.description ?? null },
  });
  if (error || !data) failure(error?.code);
  return colorwayRowSchema.parse(data);
}
