export type VerifiedRaffleIdentity = Readonly<{
  id: string;
  email: string | null | undefined;
  emailConfirmedAt: string | null | undefined;
}>;
export type LinkedRaffleCustomer = Readonly<{
  id: string;
  email: string;
  authUserId: string;
}>;

/**
 * Customer ID ownership follows the stable Supabase Auth user ID, not email.
 * A verified email is required at login, but changes to email must not erase
 * access to entries already bound to the same customer ID.
 *
 * Claiming *unlinked guest* entries uses a separate explicit verified-email
 * operation; it MUST NOT silently claim entries from a previous email.
 */
export function resolveRaffleCustomerOwner(
  identity: VerifiedRaffleIdentity | null,
  customer: LinkedRaffleCustomer | null,
): string | null {
  if (!identity || !customer || !identity.emailConfirmedAt) return null;
  const verifiedEmail = identity.email?.trim();
  if (!verifiedEmail || !identity.id || identity.id !== customer.authUserId || !customer.id) {
    return null;
  }
  return customer.id;
}
