import "server-only";
import { createClient } from "@supabase/supabase-js";
import { createCustomerCartMergeService } from "@/features/cart/customer-cart-merge";
import { hashGuestCartToken } from "@/features/cart/guest-cart-service";
import { createSupabaseCustomerCartMergeRepository } from "@/lib/supabase/customer-cart-merge-repository";
import type { Database } from "@/lib/supabase/database.types";

function isEnabled(value: string | undefined): boolean {
  return value?.trim().toLowerCase() === "true";
}

export function getServerCustomerCartMergeService() {
  const enabled =
    isEnabled(process.env.COMMERCE_CUSTOMER_AUTH_ENABLED) &&
    isEnabled(process.env.COMMERCE_GUEST_CART_ENABLED) &&
    isEnabled(process.env.COMMERCE_CUSTOMER_CART_MERGE_ENABLED);
  if (!enabled) return createCustomerCartMergeService({ enabled: false });

  const url = process.env.NEXT_PUBLIC_SUPABASE_URL?.trim();
  const secretKey = process.env.SUPABASE_SECRET_KEY?.trim();
  if (!url || !secretKey) return createCustomerCartMergeService({ enabled: true });

  const client = createClient<Database>(url, secretKey, {
    auth: {
      autoRefreshToken: false,
      detectSessionInUrl: false,
      persistSession: false,
    },
  });
  return createCustomerCartMergeService({
    enabled: true,
    repository: createSupabaseCustomerCartMergeRepository(client),
    hashGuestToken: hashGuestCartToken,
  });
}
