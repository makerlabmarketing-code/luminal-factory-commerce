import { createHash, randomBytes } from "node:crypto";
import { z } from "zod";

export const GUEST_CART_COOKIE_NAME = "lf_guest_cart";
export const GUEST_CART_TOKEN_BYTES = 32;
export const GUEST_CART_MAX_AGE_SECONDS = 30 * 24 * 60 * 60;
const GUEST_CART_ACTIVITY_WRITE_INTERVAL_MS = 24 * 60 * 60 * 1000;

const guestCartLineInputSchema = z.object({
  productId: z.string().uuid(),
  variantId: z.string().uuid().nullable().optional().default(null),
  requestedQuantity: z.number().int().min(1).max(99),
});

const guestCartLineIdentitySchema = guestCartLineInputSchema.pick({
  productId: true,
  variantId: true,
});

export type GuestCartLineInput = z.input<typeof guestCartLineInputSchema>;
export type GuestCartLineIdentity = z.input<typeof guestCartLineIdentitySchema>;

export type GuestCartRecord = Readonly<{
  id: string;
  currency: "VND";
  expiresAt: Date;
  lastActivityAt: Date;
}>;

export type GuestCartLineRecord = Readonly<{
  productId: string;
  variantId: string | null;
  requestedQuantity: number;
  isAvailable: boolean;
}>;

export type GuestCartView = Readonly<{
  currency: "VND";
  expiresAt: string;
  lines: readonly Readonly<{
    productId: string;
    variantId: string | null;
    requestedQuantity: number;
  }>[];
  unavailableLineCount: number;
}>;

export interface GuestCartRepository {
  createGuestCart(input: Readonly<{
    guestTokenHash: string;
    now: Date;
    expiresAt: Date;
  }>): Promise<GuestCartRecord>;
  findActiveGuestCart(input: Readonly<{
    guestTokenHash: string;
    now: Date;
  }>): Promise<GuestCartRecord | null>;
  listGuestCartLines(cartId: string): Promise<readonly GuestCartLineRecord[]>;
  isPublishedCatalogSelection(input: Readonly<{
    productId: string;
    variantId: string | null;
  }>): Promise<boolean>;
  setGuestCartLine(input: Readonly<{
    cartId: string;
    productId: string;
    variantId: string | null;
    requestedQuantity: number;
    now: Date;
  }>): Promise<void>;
  removeGuestCartLine(input: Readonly<{
    cartId: string;
    productId: string;
    variantId: string | null;
  }>): Promise<void>;
  touchGuestCart(input: Readonly<{
    cartId: string;
    now: Date;
    expiresAt: Date;
  }>): Promise<void>;
}

export type GuestCartFailureCode =
  | "runtime_disabled"
  | "runtime_unavailable"
  | "cart_unavailable"
  | "invalid_input"
  | "catalog_selection_unavailable";

export type GuestCartResult =
  | Readonly<{ ok: true; cart: GuestCartView }>
  | Readonly<{ ok: false; code: GuestCartFailureCode }>;

export type GuestCartCreationResult =
  | Readonly<{ ok: true; guestToken: string; cart: GuestCartView }>
  | Readonly<{ ok: false; code: "runtime_disabled" | "runtime_unavailable" }>;

export type GuestCartCookie = Readonly<{
  name: typeof GUEST_CART_COOKIE_NAME;
  value: string;
  options: Readonly<{
    httpOnly: true;
    sameSite: "lax";
    secure: boolean;
    path: "/";
    maxAge: number;
  }>;
}>;

export type GuestCartCookieRemoval = Readonly<{
  name: typeof GUEST_CART_COOKIE_NAME;
  value: "";
  options: Readonly<{
    httpOnly: true;
    sameSite: "lax";
    secure: boolean;
    path: "/";
    maxAge: 0;
  }>;
}>;

type GuestCartServiceOptions = Readonly<{
  enabled: boolean;
  repository?: GuestCartRepository;
  now?: () => Date;
  tokenFactory?: () => string;
}>;

function decodeGuestCartToken(token: string): Buffer | null {
  if (!/^[A-Za-z0-9_-]{43}$/.test(token)) return null;

  try {
    const decoded = Buffer.from(token, "base64url");
    return decoded.length === GUEST_CART_TOKEN_BYTES && decoded.toString("base64url") === token
      ? decoded
      : null;
  } catch {
    return null;
  }
}

export function createGuestCartToken(): string {
  return randomBytes(GUEST_CART_TOKEN_BYTES).toString("base64url");
}

export function hashGuestCartToken(token: string): string | null {
  const decoded = decodeGuestCartToken(token);
  if (!decoded) return null;
  return `\\x${createHash("sha256").update(decoded).digest("hex")}`;
}

export function createGuestCartCookie(
  guestToken: string,
  environment: string | undefined = process.env.NODE_ENV,
): GuestCartCookie {
  if (!decodeGuestCartToken(guestToken)) {
    throw new Error("Cannot create a guest-cart cookie from an invalid token.");
  }

  return {
    name: GUEST_CART_COOKIE_NAME,
    value: guestToken,
    options: {
      httpOnly: true,
      sameSite: "lax",
      secure: environment === "production",
      path: "/",
      maxAge: GUEST_CART_MAX_AGE_SECONDS,
    },
  };
}

export function createGuestCartCookieRemoval(
  environment: string | undefined = process.env.NODE_ENV,
): GuestCartCookieRemoval {
  return {
    name: GUEST_CART_COOKIE_NAME,
    value: "",
    options: {
      httpOnly: true,
      sameSite: "lax",
      secure: environment === "production",
      path: "/",
      maxAge: 0,
    },
  };
}

function addGuestCartLifetime(now: Date): Date {
  return new Date(now.getTime() + GUEST_CART_MAX_AGE_SECONDS * 1000);
}

function toGuestCartView(cart: GuestCartRecord, lines: readonly GuestCartLineRecord[]): GuestCartView {
  const availableLines = lines.filter((line) => line.isAvailable);
  return {
    currency: cart.currency,
    expiresAt: cart.expiresAt.toISOString(),
    lines: availableLines.map(({ productId, variantId, requestedQuantity }) => ({
      productId,
      variantId,
      requestedQuantity,
    })),
    unavailableLineCount: lines.length - availableLines.length,
  };
}

export function createGuestCartService(options: GuestCartServiceOptions) {
  const now = options.now ?? (() => new Date());
  const tokenFactory = options.tokenFactory ?? createGuestCartToken;

  function getRepository(): GuestCartRepository | "runtime_disabled" | "runtime_unavailable" {
    if (!options.enabled) return "runtime_disabled";
    return options.repository ?? "runtime_unavailable";
  }

  async function resolveCart(
    repository: GuestCartRepository,
    guestToken: string,
    currentTime: Date,
  ): Promise<GuestCartRecord | null> {
    const guestTokenHash = hashGuestCartToken(guestToken);
    if (!guestTokenHash) return null;

    const cart = await repository.findActiveGuestCart({ guestTokenHash, now: currentTime });
    if (!cart || cart.expiresAt.getTime() <= currentTime.getTime()) return null;
    return cart;
  }

  async function maybeRefreshActivity(
    repository: GuestCartRepository,
    cart: GuestCartRecord,
    currentTime: Date,
  ): Promise<GuestCartRecord> {
    const shouldRefresh = currentTime.getTime() - cart.lastActivityAt.getTime() >= GUEST_CART_ACTIVITY_WRITE_INTERVAL_MS;
    if (!shouldRefresh) return cart;

    const expiresAt = addGuestCartLifetime(currentTime);
    await repository.touchGuestCart({ cartId: cart.id, now: currentTime, expiresAt });
    return { ...cart, lastActivityAt: currentTime, expiresAt };
  }

  async function getCartView(repository: GuestCartRepository, cart: GuestCartRecord): Promise<GuestCartView> {
    const lines = await repository.listGuestCartLines(cart.id);
    return toGuestCartView(cart, lines);
  }

  return {
    async create(): Promise<GuestCartCreationResult> {
      const repository = getRepository();
      if (typeof repository === "string") return { ok: false, code: repository };

      const currentTime = now();
      const guestToken = tokenFactory();
      const guestTokenHash = hashGuestCartToken(guestToken);
      if (!guestTokenHash) return { ok: false, code: "runtime_unavailable" };

      try {
        const cart = await repository.createGuestCart({
          guestTokenHash,
          now: currentTime,
          expiresAt: addGuestCartLifetime(currentTime),
        });
        return { ok: true, guestToken, cart: toGuestCartView(cart, []) };
      } catch {
        return { ok: false, code: "runtime_unavailable" };
      }
    },

    async read(guestToken: string): Promise<GuestCartResult> {
      const repository = getRepository();
      if (typeof repository === "string") return { ok: false, code: repository };

      try {
        const currentTime = now();
        const resolvedCart = await resolveCart(repository, guestToken, currentTime);
        if (!resolvedCart) return { ok: false, code: "cart_unavailable" };
        const cart = await maybeRefreshActivity(repository, resolvedCart, currentTime);
        return { ok: true, cart: await getCartView(repository, cart) };
      } catch {
        return { ok: false, code: "runtime_unavailable" };
      }
    },

    async setLine(guestToken: string, input: GuestCartLineInput): Promise<GuestCartResult> {
      const repository = getRepository();
      if (typeof repository === "string") return { ok: false, code: repository };
      const parsed = guestCartLineInputSchema.safeParse(input);
      if (!parsed.success) return { ok: false, code: "invalid_input" };

      try {
        const currentTime = now();
        const cart = await resolveCart(repository, guestToken, currentTime);
        if (!cart) return { ok: false, code: "cart_unavailable" };
        const isAvailable = await repository.isPublishedCatalogSelection(parsed.data);
        if (!isAvailable) return { ok: false, code: "catalog_selection_unavailable" };

        const expiresAt = addGuestCartLifetime(currentTime);
        await repository.touchGuestCart({ cartId: cart.id, now: currentTime, expiresAt });
        await repository.setGuestCartLine({ cartId: cart.id, ...parsed.data, now: currentTime });
        return {
          ok: true,
          cart: await getCartView(repository, { ...cart, lastActivityAt: currentTime, expiresAt }),
        };
      } catch {
        return { ok: false, code: "runtime_unavailable" };
      }
    },

    async removeLine(guestToken: string, input: GuestCartLineIdentity): Promise<GuestCartResult> {
      const repository = getRepository();
      if (typeof repository === "string") return { ok: false, code: repository };
      const parsed = guestCartLineIdentitySchema.safeParse(input);
      if (!parsed.success) return { ok: false, code: "invalid_input" };

      try {
        const currentTime = now();
        const cart = await resolveCart(repository, guestToken, currentTime);
        if (!cart) return { ok: false, code: "cart_unavailable" };
        const expiresAt = addGuestCartLifetime(currentTime);
        await repository.touchGuestCart({ cartId: cart.id, now: currentTime, expiresAt });
        await repository.removeGuestCartLine({ cartId: cart.id, ...parsed.data });
        return {
          ok: true,
          cart: await getCartView(repository, { ...cart, lastActivityAt: currentTime, expiresAt }),
        };
      } catch {
        return { ok: false, code: "runtime_unavailable" };
      }
    },
  };
}
