export type SupabaseVerifiedUser = Readonly<{
  id: string;
  email?: string | null;
  email_confirmed_at?: string | null;
}>;

/**
 * Server-only callers pass a user obtained from Supabase auth.getUser(),
 * never claims decoded from a client-controlled token or request payload.
 */
export function getVerifiedCustomerIdentity(
  user: SupabaseVerifiedUser | null | undefined,
  expectedEmail?: string,
): { authUserId: string; email: string } | null {
  if (!user?.id || !user.email_confirmed_at) return null;
  const email = user.email?.trim().toLowerCase();
  if (!email || (expectedEmail !== undefined && expectedEmail !== email)) return null;
  return { authUserId: user.id, email };
}
