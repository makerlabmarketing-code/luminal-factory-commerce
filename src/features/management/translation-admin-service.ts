import "server-only";
import type { CommerceAdminPrivilegedClient } from "./commerce-admin-route-runtime";
import { CatalogRaffleAdminServiceError } from "./catalog-raffle-admin-service";
import { translationRecordSchema, type TranslationMutation } from "./translation-contract";

export type TranslationTarget = Readonly<{ productId: string; variantId: string | null; locale: "en" | "vi" }>;
// Proposed RPC signatures only; never pretend they are generated live database types.
type TranslationRpc = { rpc(name: "read_catalog_translation_draft" | "save_catalog_translation_draft", args: Record<string, unknown>): PromiseLike<{ data: unknown; error: { code?: string } | null }> };
function fail(code?: string): never {
  if (code === "P0002") throw new CatalogRaffleAdminServiceError("NOT_FOUND", "Không tìm thấy sản phẩm hoặc phối màu.");
  if (["23505", "23514", "22023", "40001"].includes(code ?? "")) throw new CatalogRaffleAdminServiceError("CONFLICT", "Bản dịch đã thay đổi hoặc chưa đủ thông tin. Tải lại trước khi lưu.");
  throw new CatalogRaffleAdminServiceError("PERSISTENCE_FAILED", "Không thể đọc hoặc lưu bản dịch.");
}
function parseRecord(data: unknown, target: TranslationTarget) {
  const row = translationRecordSchema.safeParse(data);
  if (!row.success || row.data.productId !== target.productId || row.data.variantId !== target.variantId || row.data.locale !== target.locale) fail();
  return row.data;
}
export async function readManagedTranslation(client: CommerceAdminPrivilegedClient, target: TranslationTarget) {
  const { data, error } = await (client as unknown as TranslationRpc).rpc("read_catalog_translation_draft", {
    p_product_id: target.productId, p_variant_id: target.variantId, p_locale: target.locale,
  });
  if (error) fail(error.code);
  return data === null ? null : parseRecord(data, target);
}
export async function saveManagedTranslation(client: CommerceAdminPrivilegedClient, target: TranslationTarget,
  mutation: TranslationMutation, context: Readonly<{ clientId: string; requestFingerprint: string }>) {
  const { data, error } = await (client as unknown as TranslationRpc).rpc("save_catalog_translation_draft", {
    p_product_id: target.productId, p_variant_id: target.variantId, p_locale: target.locale,
    p_operation_id: mutation.operationId, p_client_id: context.clientId, p_request_fingerprint: context.requestFingerprint,
    p_expected_revision: mutation.expectedRevision, p_content: mutation.draft.content, p_ready: mutation.draft.ready,
  });
  if (error || !data) fail(error?.code);
  return parseRecord(data, target);
}
