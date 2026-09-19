import { createClient, type SupabaseClient } from "@supabase/supabase-js";
import type { GuestCartRateLimiter } from "@/features/cart/guest-cart-request";
import type { Database } from "@/lib/supabase/database.types";

type GuestCartRateLimitClient = Pick<SupabaseClient<Database>, "rpc">;

export function createSupabaseGuestCartRateLimiter(
  client: GuestCartRateLimitClient,
): GuestCartRateLimiter {
  return {
    async consume({ key, bucket }) {
      try {
        const { data, error } = await client.rpc("consume_guest_cart_rate_limit", {
          p_key_hash: key,
          p_bucket: bucket,
        });
        if (error || typeof data !== "boolean") return "unavailable";
        return data ? "allowed" : "limited";
      } catch {
        return "unavailable";
      }
    },
  };
}

export function getServerGuestCartRateLimiter(): GuestCartRateLimiter | undefined {
  const guestEnabled = process.env.COMMERCE_GUEST_CART_ENABLED?.trim().toLowerCase() === "true";
  const customerEnabled =
    process.env.COMMERCE_CUSTOMER_AUTH_ENABLED?.trim().toLowerCase() === "true" &&
    process.env.COMMERCE_CUSTOMER_CART_ENABLED?.trim().toLowerCase() === "true";
  if (!guestEnabled && !customerEnabled) return undefined;

  const url = process.env.NEXT_PUBLIC_SUPABASE_URL?.trim();
  const secretKey = process.env.SUPABASE_SECRET_KEY?.trim();
  if (!url || !secretKey) return undefined;

  const client = createClient<Database>(url, secretKey, {
    auth: {
      autoRefreshToken: false,
      detectSessionInUrl: false,
      persistSession: false,
    },
  });
  return createSupabaseGuestCartRateLimiter(client);
}
