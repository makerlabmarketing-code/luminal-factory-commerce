import type { CustomerCartRepository } from "@/features/cart/customer-cart-service";

type RpcResponse = Promise<Readonly<{
  data: unknown;
  error: Readonly<{ code?: string }> | null;
}>>;

export type CustomerCartRpcClient = Readonly<{
  rpc(name: string, args: Readonly<Record<string, unknown>>): RpcResponse;
}>;

function unwrap(response: Awaited<RpcResponse>): unknown {
  if (response.error || response.data === null || response.data === undefined) {
    throw new Error("Customer cart persistence failed.", {
      cause: response.error?.code ?? "invalid_result",
    });
  }
  return response.data;
}

export function createSupabaseCustomerCartRepository(client: CustomerCartRpcClient): CustomerCartRepository {
  return {
    async read(authUserId) {
      return unwrap(await client.rpc("read_verified_customer_cart", {
        p_auth_user_id: authUserId,
      }));
    },
    async setLine(input) {
      return unwrap(await client.rpc("set_verified_customer_cart_line", {
        p_auth_user_id: input.authUserId,
        p_verified_email: input.verifiedEmail,
        p_product_id: input.productId,
        p_variant_id: input.variantId,
        p_requested_quantity: input.requestedQuantity,
      }));
    },
    async removeLine(input) {
      return unwrap(await client.rpc("remove_verified_customer_cart_line", {
        p_auth_user_id: input.authUserId,
        p_product_id: input.productId,
        p_variant_id: input.variantId,
      }));
    },
  };
}
