import { z } from 'zod';
import { mediaTicketInputSchema, mediaAppendSchema, mediaUpdateSchema } from './catalog-media-contract';
import { createMediaTicket, presentMedia, readMediaManifest, saveMedia } from './catalog-media-service';
import { CatalogRaffleAdminServiceError } from './catalog-raffle-admin-service';
import { authorizeCommerceAdminRoute, commerceAdminFailure, commerceAdminSuccess, parseCommerceAdminJson, recordCommerceAdminAudit } from './commerce-admin-route-runtime';
export async function handleCatalogMedia(request: Request, params: Promise<{ id: string; variantId?: string }>, ticket = false) {
  const read = request.method === 'GET';
  const context = await authorizeCommerceAdminRoute(request, [read ? 'commerce.product.read' : 'commerce.product.write']);
  if (context instanceof Response) return context;
  const parsed = z.object({ id: z.uuid(), variantId: z.uuid().optional() }).safeParse(await params);
  if (!parsed.success) return commerceAdminFailure(context.identity.requestId, 400, 'REQUEST_INVALID', 'Sản phẩm/phối màu không hợp lệ.');
  const target = { productId: parsed.data.id, variantId: parsed.data.variantId ?? null };
  const operation = read ? 'product.media.read_draft' : ticket ? 'product.media.upload_ticket' : 'product.media.save_draft';
  try {
    const payload: unknown = read ? null : parseCommerceAdminJson(context.rawBodyText);
    let result;
    if (read) result = await presentMedia(context.privilegedClient, await readMediaManifest(context.privilegedClient, target));
    else if (ticket) {
      const input = mediaTicketInputSchema.safeParse(payload); if (!input.success) throw new SyntaxError();
      result = await createMediaTicket(context.privilegedClient, target, input.data);
    } else {
      const append = request.method === 'POST';
      const input = append ? mediaAppendSchema.safeParse(payload) : mediaUpdateSchema.safeParse(payload);
      if (!input.success) throw new SyntaxError();
      // Save response has no expiring URLs; a later read refreshes previews. Audit failure never changes an acknowledged save.
      result = await saveMedia(context.privilegedClient, target, append ? 'append' : 'update', input.data, { clientId: context.identity.clientId, requestFingerprint: context.requestFingerprint });
    }
    await recordCommerceAdminAudit(context, { operation, targetType: 'product', targetId: target.productId, outcome: 'succeeded', httpStatus: 200 }).catch(() => undefined);
    return commerceAdminSuccess(result, context.identity.requestId);
  } catch (error) {
    const known = error instanceof CatalogRaffleAdminServiceError;
    const status = error instanceof SyntaxError ? 400 : known && error.code === 'NOT_FOUND' ? 404 : known && error.code === 'CONFLICT' ? 409 : 503;
    await recordCommerceAdminAudit(context, { operation, targetType: 'product', targetId: target.productId, outcome: 'failed', httpStatus: status, failureCode: known ? error.code : 'REMOTE_UNAVAILABLE' }).catch(() => undefined);
    return commerceAdminFailure(context.identity.requestId, status, known ? error.code : 'REQUEST_FAILED', status === 400 ? 'Thông tin ảnh không hợp lệ.' : known ? error.message : 'Chưa thể truy cập bộ ảnh.', status === 503);
  }
}
