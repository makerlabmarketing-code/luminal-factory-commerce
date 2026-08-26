import "server-only";
import { createServerClient, type CookieOptions } from "@supabase/ssr";
import { cookies } from "next/headers";
import type { CustomerAuthService } from "@/features/auth/customer-auth-request";
import type { Database } from "@/lib/supabase/database.types";

type AuthCookieStore = Readonly<{
  getAll(): Array<Readonly<{ name: string; value: string }>>;
  set(name: string, value: string, options: CookieOptions): void;
}>;

export function createServerCustomerAuthService(cookieStore: AuthCookieStore): CustomerAuthService {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL?.trim();
  const supabaseKey = (
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY ?? process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
  )?.trim();
  if (!supabaseUrl || !supabaseKey) throw new Error("Customer Auth configuration is unavailable.");

  const client = createServerClient<Database>(supabaseUrl, supabaseKey, {
    cookies: {
      getAll: () => cookieStore.getAll(),
      setAll: (cookiesToSet) => {
        for (const cookie of cookiesToSet) cookieStore.set(cookie.name, cookie.value, cookie.options);
      },
    },
  });

  return {
    async requestOtp(input) {
      const { error } = await client.auth.signInWithOtp({
        email: input.email,
        options: { captchaToken: input.captchaToken, shouldCreateUser: true },
      });
      return error === null;
    },
    async verifyOtp(input) {
      const { data, error } = await client.auth.verifyOtp({
        email: input.email,
        token: input.token,
        type: "email",
      });
      if (error || !data.user) return false;

      const { data: confirmed, error: confirmationError } = await client.auth.getUser();
      return confirmationError === null && confirmed.user?.id === data.user.id;
    },
    async signOut() {
      const { error } = await client.auth.signOut({ scope: "local" });
      return error === null;
    },
  };
}

export async function getServerCustomerAuthEmail(): Promise<string | null> {
  const cookieStore = await cookies();
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL?.trim();
  const supabaseKey = (
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY ?? process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
  )?.trim();
  if (!supabaseUrl || !supabaseKey) return null;

  const client = createServerClient<Database>(supabaseUrl, supabaseKey, {
    cookies: {
      getAll: () => cookieStore.getAll(),
      setAll: () => {
        // The account Proxy owns refresh-cookie writes for Server Component reads.
      },
    },
  });
  const { data, error } = await client.auth.getUser();
  return error === null ? data.user?.email ?? null : null;
}
