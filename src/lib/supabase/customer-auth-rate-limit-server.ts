import "server-only";
import { createClient } from "@supabase/supabase-js";
import type { CustomerAuthRateLimiter } from "@/features/auth/customer-auth-request";

type CustomerAuthRateLimitDatabase = {
  public: {
    Tables: Record<never, never>;
    Views: Record<never, never>;
    Functions: {
      consume_customer_auth_rate_limit: {
        Args: { p_bucket: string; p_key_hash: string };
        Returns: boolean;
      };
    };
    Enums: Record<never, never>;
    CompositeTypes: Record<never, never>;
  };
};

export function getServerCustomerAuthRateLimiter(): CustomerAuthRateLimiter | undefined {
  if (process.env.COMMERCE_CUSTOMER_AUTH_ENABLED?.trim().toLowerCase() !== "true") return undefined;
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL?.trim();
  const secretKey = process.env.SUPABASE_SECRET_KEY?.trim();
  if (!url || !secretKey) return undefined;

  const client = createClient<CustomerAuthRateLimitDatabase>(url, secretKey, {
    auth: { autoRefreshToken: false, detectSessionInUrl: false, persistSession: false },
  });
  return {
    async consume({ key, bucket }) {
      try {
        const { data, error } = await client.rpc("consume_customer_auth_rate_limit", {
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
