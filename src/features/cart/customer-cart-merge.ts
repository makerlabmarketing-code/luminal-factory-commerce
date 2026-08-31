import { z } from "zod";

const verifiedCustomerIdentitySchema = z.object({
  authUserId: z.string().uuid(),
  email: z.email().max(254).transform((value) => value.trim().toLowerCase()),
}).strict();

export type VerifiedCustomerIdentity = z.input<typeof verifiedCustomerIdentitySchema>;

export type CustomerCartMergePersistenceResult =
  | Readonly<{
      state: "merged";
      unavailableLineCount: number;
      cappedLineCount: number;
    }>
  | Readonly<{ state: "cart_unavailable" | "identity_conflict" }>;

export interface CustomerCartMergeRepository {
  mergeGuestCart(input: Readonly<{
    authUserId: string;
    verifiedEmail: string;
    guestTokenHash: string;
  }>): Promise<CustomerCartMergePersistenceResult>;
}

export type CustomerCartMergeResult =
  | Readonly<{ ok: true; state: "no_guest_cart" }>
  | Readonly<{
      ok: true;
      state: "merged";
      unavailableLineCount: number;
      cappedLineCount: number;
    }>
  | Readonly<{
      ok: false;
      code:
        | "runtime_disabled"
        | "runtime_unavailable"
        | "cart_unavailable"
        | "identity_conflict";
    }>;

type CustomerCartMergeServiceOptions = Readonly<{
  enabled: boolean;
  repository?: CustomerCartMergeRepository;
  hashGuestToken?: (guestToken: string) => string | null;
}>;

export function createCustomerCartMergeService(options: CustomerCartMergeServiceOptions) {
  return {
    async merge(
      identity: VerifiedCustomerIdentity,
      guestToken: string | undefined,
    ): Promise<CustomerCartMergeResult> {
      if (!options.enabled) return { ok: false, code: "runtime_disabled" };
      if (!options.repository || !options.hashGuestToken) {
        return { ok: false, code: "runtime_unavailable" };
      }
      if (!guestToken) return { ok: true, state: "no_guest_cart" };

      const verifiedIdentity = verifiedCustomerIdentitySchema.safeParse(identity);
      if (!verifiedIdentity.success) return { ok: false, code: "runtime_unavailable" };

      const guestTokenHash = options.hashGuestToken(guestToken);
      if (!guestTokenHash) return { ok: false, code: "cart_unavailable" };

      try {
        const persistenceResult = await options.repository.mergeGuestCart({
          authUserId: verifiedIdentity.data.authUserId,
          verifiedEmail: verifiedIdentity.data.email,
          guestTokenHash,
        });
        if (persistenceResult.state !== "merged") {
          return { ok: false, code: persistenceResult.state };
        }
        if (
          !Number.isSafeInteger(persistenceResult.unavailableLineCount) ||
          persistenceResult.unavailableLineCount < 0 ||
          !Number.isSafeInteger(persistenceResult.cappedLineCount) ||
          persistenceResult.cappedLineCount < 0
        ) {
          return { ok: false, code: "runtime_unavailable" };
        }
        return { ok: true, ...persistenceResult };
      } catch {
        return { ok: false, code: "runtime_unavailable" };
      }
    },
  };
}
