import "server-only";
import { createServerClient } from "@supabase/ssr";
import { isAuthSessionMissingError } from "@supabase/supabase-js";
import { z } from "zod";
import type { CustomerCartIdentityResolver } from "@/features/cart/customer-cart-identity";
import type { Database } from "@/lib/supabase/database.types";

type AuthCookieStore = Readonly<{
  getAll(): Array<Readonly<{ name: string; value: string }>>;
}>;

const verifiedIdentitySchema = z.object({
  authUserId: z.string().uuid(),
  email: z.string().email().max(254).transform((value) => value.trim().toLowerCase()),
}).strict();

function isEnabled(value: string | undefined): boolean {
  return value?.trim().toLowerCase() === "true";
}

export function createServerCustomerCartIdentityResolver(
  cookieStore: AuthCookieStore,
): CustomerCartIdentityResolver {
  if (!isEnabled(process.env.COMMERCE_CUSTOMER_AUTH_ENABLED)) {
    return { async resolve() { return { state: "anonymous" }; } };
  }

  const url = process.env.NEXT_PUBLIC_SUPABASE_URL?.trim();
  const key = (
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY ?? process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
  )?.trim();
  if (!url || !key) {
    return { async resolve() { return { state: "identity_unavailable" }; } };
  }

  const client = createServerClient<Database>(url, key, {
    cookies: {
      getAll: () => cookieStore.getAll(),
      setAll: () => {
        // Proxy refreshes Cart/Auth cookies before Server Component and Route Handler reads.
      },
    },
  });

  return {
    async resolve() {
      const { data, error } = await client.auth.getUser();
      if (error) {
        return isAuthSessionMissingError(error)
          ? { state: "anonymous" } as const
          : { state: "identity_unavailable" } as const;
      }
      if (!data.user) return { state: "identity_unavailable" };
      const parsed = verifiedIdentitySchema.safeParse({
        authUserId: data.user.id,
        email: data.user.email,
      });
      return parsed.success
        ? { state: "verified_customer", identity: parsed.data }
        : { state: "identity_unavailable" };
    },
  };
}
