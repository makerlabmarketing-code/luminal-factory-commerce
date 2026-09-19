import "server-only";
import { createClient } from "@supabase/supabase-js";
import { createCustomerCartService } from "@/features/cart/customer-cart-service";
import { createSupabaseCustomerCartRepository } from "@/lib/supabase/customer-cart-repository";
import type { Database } from "@/lib/supabase/database.types";

function isEnabled(value: string | undefined): boolean {
  return value?.trim().toLowerCase() === "true";
}

export function getServerCustomerCartService() {
  const enabled =
    isEnabled(process.env.COMMERCE_CUSTOMER_AUTH_ENABLED) &&
    isEnabled(process.env.COMMERCE_CUSTOMER_CART_ENABLED);
  if (!enabled) return createCustomerCartService({ enabled: false });

  const url = process.env.NEXT_PUBLIC_SUPABASE_URL?.trim();
  const secretKey = process.env.SUPABASE_SECRET_KEY?.trim();
  if (!url || !secretKey) return createCustomerCartService({ enabled: true });

  const client = createClient<Database>(url, secretKey, {
    auth: {
      autoRefreshToken: false,
      detectSessionInUrl: false,
      persistSession: false,
    },
  });
  return createCustomerCartService({
    enabled: true,
    repository: createSupabaseCustomerCartRepository(client),
  });
}
