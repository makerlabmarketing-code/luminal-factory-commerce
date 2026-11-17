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
 * Fail-closed ownership check. A matching email alone is not ownership;
 * the Supabase Auth subject must be bound to exactly this customer.
 */
export function resolveRaffleCustomerOwner(
  identity: VerifiedRaffleIdentity | null,
  customer: LinkedRaffleCustomer | null,
): string | null {
  if (!identity || !customer || !identity.emailConfirmedAt) return null;
  const verifiedEmail = identity.email?.trim().toLowerCase();
  const linkedEmail = customer.email.trim().toLowerCase();
  if (!verifiedEmail || !linkedEmail ||
      identity.id !== customer.authUserId || verifiedEmail !== linkedEmail) return null;
  return customer.id;
}
