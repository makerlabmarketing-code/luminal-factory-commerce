import { z } from "zod";
import type { GuestCartView } from "./guest-cart-service";

const verifiedCustomerCartIdentitySchema = z.object({
  authUserId: z.string().uuid(),
  email: z.string().email().max(254).transform((value) => value.trim().toLowerCase()),
}).strict();

const customerCartLineSchema = z.object({
  productId: z.string().uuid(),
  variantId: z.string().uuid().nullable(),
  requestedQuantity: z.number().int().min(1).max(99),
}).strict();

const emptyDocumentSchema = z.object({
  state: z.literal("empty"),
  currency: z.literal("USD"),
  lines: z.array(z.never()).max(0),
  unavailableLineCount: z.literal(0),
}).strict();

const cartDocumentSchema = z.object({
  state: z.literal("cart"),
  currency: z.literal("USD"),
  expiresAt: z.string().datetime({ offset: true }),
  lines: z.array(customerCartLineSchema).max(50),
  unavailableLineCount: z.number().int().nonnegative(),
}).strict();

const failureDocumentSchema = z.object({
  state: z.enum(["catalog_selection_unavailable", "identity_conflict"]),
}).strict();

const customerCartPersistenceDocumentSchema = z.union([
  emptyDocumentSchema,
  cartDocumentSchema,
  failureDocumentSchema,
]);

export type VerifiedCustomerCartIdentity = z.input<typeof verifiedCustomerCartIdentitySchema>;
export type CustomerCartPersistenceDocument = z.output<typeof customerCartPersistenceDocumentSchema>;

export interface CustomerCartRepository {
  read(authUserId: string): Promise<unknown>;
  setLine(input: Readonly<{
    authUserId: string;
    verifiedEmail: string;
    productId: string;
    variantId: string | null;
    requestedQuantity: number;
  }>): Promise<unknown>;
  removeLine(input: Readonly<{
    authUserId: string;
    productId: string;
    variantId: string | null;
  }>): Promise<unknown>;
}

export type CustomerCartServiceResult =
  | Readonly<{ ok: true; cart: GuestCartView | null }>
  | Readonly<{
      ok: false;
      code:
        | "runtime_disabled"
        | "runtime_unavailable"
        | "catalog_selection_unavailable"
        | "identity_conflict";
    }>;

type CustomerCartServiceOptions = Readonly<{
  enabled: boolean;
  repository?: CustomerCartRepository;
}>;

function mapDocument(value: unknown): CustomerCartServiceResult {
  const parsed = customerCartPersistenceDocumentSchema.safeParse(value);
  if (!parsed.success) return { ok: false, code: "runtime_unavailable" };
  if (parsed.data.state === "empty") return { ok: true, cart: null };
  if (parsed.data.state !== "cart") return { ok: false, code: parsed.data.state };
  return {
    ok: true,
    cart: {
      currency: parsed.data.currency,
      expiresAt: parsed.data.expiresAt,
      lines: parsed.data.lines,
      unavailableLineCount: parsed.data.unavailableLineCount,
    },
  };
}

export function createCustomerCartService(options: CustomerCartServiceOptions) {
  function getContext(identity: VerifiedCustomerCartIdentity) {
    if (!options.enabled) return { ok: false, code: "runtime_disabled" } as const;
    if (!options.repository) return { ok: false, code: "runtime_unavailable" } as const;
    const parsed = verifiedCustomerCartIdentitySchema.safeParse(identity);
    if (!parsed.success) return { ok: false, code: "runtime_unavailable" } as const;
    return { ok: true, identity: parsed.data, repository: options.repository } as const;
  }

  return {
    async read(identity: VerifiedCustomerCartIdentity): Promise<CustomerCartServiceResult> {
      const context = getContext(identity);
      if (!context.ok) return context;
      try {
        return mapDocument(await context.repository.read(context.identity.authUserId));
      } catch {
        return { ok: false, code: "runtime_unavailable" };
      }
    },

    async setLine(
      identity: VerifiedCustomerCartIdentity,
      input: Readonly<{ productId: string; variantId: string | null; requestedQuantity: number }>,
    ): Promise<CustomerCartServiceResult> {
      const context = getContext(identity);
      if (!context.ok) return context;
      const parsedLine = customerCartLineSchema.safeParse(input);
      if (!parsedLine.success) return { ok: false, code: "runtime_unavailable" };
      try {
        return mapDocument(await context.repository.setLine({
          authUserId: context.identity.authUserId,
          verifiedEmail: context.identity.email,
          ...parsedLine.data,
        }));
      } catch {
        return { ok: false, code: "runtime_unavailable" };
      }
    },

    async removeLine(
      identity: VerifiedCustomerCartIdentity,
      input: Readonly<{ productId: string; variantId: string | null }>,
    ): Promise<CustomerCartServiceResult> {
      const context = getContext(identity);
      if (!context.ok) return context;
      const parsedLine = customerCartLineSchema
        .pick({ productId: true, variantId: true })
        .safeParse(input);
      if (!parsedLine.success) return { ok: false, code: "runtime_unavailable" };
      try {
        return mapDocument(await context.repository.removeLine({
          authUserId: context.identity.authUserId,
          ...parsedLine.data,
        }));
      } catch {
        return { ok: false, code: "runtime_unavailable" };
      }
    },
  };
}
