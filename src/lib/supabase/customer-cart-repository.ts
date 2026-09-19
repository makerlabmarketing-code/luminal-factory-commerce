import type { SupabaseClient } from "@supabase/supabase-js";
import type { CustomerCartRepository } from "@/features/cart/customer-cart-service";
import type { Database } from "@/lib/supabase/database.types";

type RpcResponse = Readonly<{
  data: unknown;
  error: Readonly<{ code?: string }> | null;
}>;

type CustomerCartRpcClient = Pick<SupabaseClient<Database>, "rpc">;
type GeneratedVariantId = Database["public"]["Functions"]["set_verified_customer_cart_line"]["Args"]["p_variant_id"];

// PostgreSQL function arguments accept NULL; Supabase type generation does not
// encode argument nullability for this fixed uuid signature.
function toGeneratedVariantId(value: string | null): GeneratedVariantId {
  return value as GeneratedVariantId;
}

function unwrap(response: RpcResponse): unknown {
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
        p_variant_id: toGeneratedVariantId(input.variantId),
        p_requested_quantity: input.requestedQuantity,
      }));
    },
    async removeLine(input) {
      return unwrap(await client.rpc("remove_verified_customer_cart_line", {
        p_auth_user_id: input.authUserId,
        p_product_id: input.productId,
        p_variant_id: toGeneratedVariantId(input.variantId),
      }));
    },
  };
}
