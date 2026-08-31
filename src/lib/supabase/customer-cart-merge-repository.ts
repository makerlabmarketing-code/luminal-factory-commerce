import type { SupabaseClient } from "@supabase/supabase-js";
import type {
  CustomerCartMergePersistenceResult,
  CustomerCartMergeRepository,
} from "@/features/cart/customer-cart-merge";
import type { Database } from "@/lib/supabase/database.types";

type CustomerCartMergeClient = Pick<SupabaseClient<Database>, "rpc">;

function throwPersistenceFailure(errorCode?: string): never {
  throw new Error("Customer cart merge persistence failed.", {
    cause: errorCode ?? "invalid_result",
  });
}

function isNonNegativeInteger(value: unknown): value is number {
  return Number.isSafeInteger(value) && Number(value) >= 0;
}

export function createSupabaseCustomerCartMergeRepository(
  client: CustomerCartMergeClient,
): CustomerCartMergeRepository {
  return {
    async mergeGuestCart(input): Promise<CustomerCartMergePersistenceResult> {
      let response;
      try {
        response = await client.rpc("merge_verified_customer_guest_cart", {
          p_auth_user_id: input.authUserId,
          p_guest_token_hash: input.guestTokenHash,
          p_verified_email: input.verifiedEmail,
        });
      } catch {
        throwPersistenceFailure();
      }

      const { data, error } = response;
      if (error || !Array.isArray(data) || data.length !== 1) {
        throwPersistenceFailure(error?.code);
      }

      const result = data[0];
      if (result.merge_state === "cart_unavailable" || result.merge_state === "identity_conflict") {
        return { state: result.merge_state };
      }
      if (
        result.merge_state !== "merged" ||
        !isNonNegativeInteger(result.unavailable_line_count) ||
        !isNonNegativeInteger(result.capped_line_count)
      ) {
        throwPersistenceFailure();
      }

      return {
        state: "merged",
        unavailableLineCount: result.unavailable_line_count,
        cappedLineCount: result.capped_line_count,
      };
    },
  };
}
