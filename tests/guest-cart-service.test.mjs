import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";
import {
  createGuestCartCookie,
  createGuestCartCookieRemoval,
  createGuestCartService,
  createGuestCartToken,
  GUEST_CART_MAX_AGE_SECONDS,
  hashGuestCartToken,
} from "../src/features/cart/guest-cart-service.ts";

const PRODUCT_A = "11111111-1111-4111-8111-111111111111";
const PRODUCT_B = "22222222-2222-4222-8222-222222222222";
const VARIANT_A = "33333333-3333-4333-8333-333333333333";

class MemoryGuestCartRepository {
  constructor() {
    this.cartsByHash = new Map();
    this.hashByCartId = new Map();
    this.linesByCartId = new Map();
    this.availableSelections = new Set();
    this.nextCart = 1;
    this.touchCount = 0;
  }

  async createGuestCart(input) {
    const cart = {
      id: `cart-${this.nextCart++}`,
      currency: "VND",
      expiresAt: input.expiresAt,
      lastActivityAt: input.now,
    };
    this.cartsByHash.set(input.guestTokenHash, cart);
    this.hashByCartId.set(cart.id, input.guestTokenHash);
    this.linesByCartId.set(cart.id, []);
    return cart;
  }

  async findActiveGuestCart(input) {
    return this.cartsByHash.get(input.guestTokenHash) ?? null;
  }

  async listGuestCartLines(cartId) {
    return (this.linesByCartId.get(cartId) ?? []).map((line) => ({
      ...line,
      isAvailable: this.availableSelections.has(`${line.productId}:${line.variantId ?? "none"}`),
    }));
  }

  async isPublishedCatalogSelection(input) {
    return this.availableSelections.has(`${input.productId}:${input.variantId ?? "none"}`);
  }

  async setGuestCartLine(input) {
    const lines = this.linesByCartId.get(input.cartId) ?? [];
    const existing = lines.find(
      (line) => line.productId === input.productId && line.variantId === input.variantId,
    );
    if (existing) existing.requestedQuantity = input.requestedQuantity;
    else lines.push({
      productId: input.productId,
      variantId: input.variantId,
      requestedQuantity: input.requestedQuantity,
    });
    this.linesByCartId.set(input.cartId, lines);
  }

  async removeGuestCartLine(input) {
    const lines = this.linesByCartId.get(input.cartId) ?? [];
    this.linesByCartId.set(
      input.cartId,
      lines.filter((line) => !(line.productId === input.productId && line.variantId === input.variantId)),
    );
  }

  async touchGuestCart(input) {
    this.touchCount += 1;
    const hash = this.hashByCartId.get(input.cartId);
    const cart = hash ? this.cartsByHash.get(hash) : null;
    if (!hash || !cart) throw new Error("missing cart");
    this.cartsByHash.set(hash, {
      ...cart,
      lastActivityAt: input.now,
      expiresAt: input.expiresAt,
    });
  }
}

test("runtime flag fails closed before token generation or persistence", async () => {
  let tokenFactoryCalled = false;
  const service = createGuestCartService({
    enabled: false,
    tokenFactory: () => {
      tokenFactoryCalled = true;
      return createGuestCartToken();
    },
  });

  assert.deepEqual(await service.create(), { ok: false, code: "runtime_disabled" });
  assert.deepEqual(await service.read("invalid"), { ok: false, code: "runtime_disabled" });
  assert.equal(tokenFactoryCalled, false);
});

test("guest token has 256-bit entropy shape, deterministic hash and secure cookie contract", () => {
  const token = createGuestCartToken();
  const secondToken = createGuestCartToken();
  const hash = hashGuestCartToken(token);

  assert.equal(Buffer.from(token, "base64url").length, 32);
  assert.notEqual(token, secondToken);
  assert.match(hash, /^\\x[0-9a-f]{64}$/);
  assert.equal(hashGuestCartToken(token), hash);
  assert.equal(hashGuestCartToken(`${token}x`), null);
  assert.deepEqual(createGuestCartCookie(token, "production"), {
    name: "lf_guest_cart",
    value: token,
    options: {
      httpOnly: true,
      sameSite: "lax",
      secure: true,
      path: "/",
      maxAge: GUEST_CART_MAX_AGE_SECONDS,
    },
  });
  assert.deepEqual(createGuestCartCookieRemoval("production"), {
    name: "lf_guest_cart",
    value: "",
    options: {
      httpOnly: true,
      sameSite: "lax",
      secure: true,
      path: "/",
      maxAge: 0,
    },
  });
});

test("creation returns only the internal cookie token and public cart view", async () => {
  const repository = new MemoryGuestCartRepository();
  const service = createGuestCartService({
    enabled: true,
    repository,
    now: () => new Date("2026-08-14T04:00:00.000Z"),
  });
  const result = await service.create();

  assert.equal(result.ok, true);
  if (!result.ok) return;
  assert.equal(result.cart.currency, "VND");
  assert.deepEqual(result.cart.lines, []);
  assert.doesNotMatch(JSON.stringify(result.cart), /cart-|guestTokenHash|guest_token_hash/);
  assert.equal(hashGuestCartToken(result.guestToken)?.length, 66);
});

test("altered, unknown and expired tokens return the same non-enumerating failure", async () => {
  const repository = new MemoryGuestCartRepository();
  let currentTime = new Date("2026-08-14T04:00:00.000Z");
  const service = createGuestCartService({ enabled: true, repository, now: () => currentTime });
  const created = await service.create();
  assert.equal(created.ok, true);
  if (!created.ok) return;

  const unknown = await service.read(createGuestCartToken());
  const altered = await service.read(`${created.guestToken.slice(0, -1)}!`);
  currentTime = new Date("2026-09-14T04:00:01.000Z");
  const expired = await service.read(created.guestToken);

  assert.deepEqual(unknown, { ok: false, code: "cart_unavailable" });
  assert.deepEqual(altered, unknown);
  assert.deepEqual(expired, unknown);
});

test("one guest token cannot read another cart", async () => {
  const repository = new MemoryGuestCartRepository();
  repository.availableSelections.add(`${PRODUCT_A}:none`);
  const service = createGuestCartService({ enabled: true, repository });
  const first = await service.create();
  const second = await service.create();
  assert.equal(first.ok && second.ok, true);
  if (!first.ok || !second.ok) return;

  await service.setLine(first.guestToken, { productId: PRODUCT_A, requestedQuantity: 2 });
  const firstCart = await service.read(first.guestToken);
  const secondCart = await service.read(second.guestToken);
  assert.equal(firstCart.ok && firstCart.cart.lines.length, 1);
  assert.equal(secondCart.ok && secondCart.cart.lines.length, 0);
});

test("line mutations validate quantity and published product/variant selection", async () => {
  const repository = new MemoryGuestCartRepository();
  repository.availableSelections.add(`${PRODUCT_A}:${VARIANT_A}`);
  const service = createGuestCartService({ enabled: true, repository });
  const created = await service.create();
  assert.equal(created.ok, true);
  if (!created.ok) return;

  assert.deepEqual(
    await service.setLine(created.guestToken, { productId: PRODUCT_A, requestedQuantity: 100 }),
    { ok: false, code: "invalid_input" },
  );
  assert.deepEqual(
    await service.setLine(created.guestToken, { productId: PRODUCT_B, requestedQuantity: 1 }),
    { ok: false, code: "catalog_selection_unavailable" },
  );

  const updated = await service.setLine(created.guestToken, {
    productId: PRODUCT_A,
    variantId: VARIANT_A,
    requestedQuantity: 3,
  });
  assert.equal(updated.ok, true);
  if (!updated.ok) return;
  assert.deepEqual(updated.cart.lines, [{
    productId: PRODUCT_A,
    variantId: VARIANT_A,
    requestedQuantity: 3,
  }]);

  const removed = await service.removeLine(created.guestToken, {
    productId: PRODUCT_A,
    variantId: VARIANT_A,
  });
  assert.equal(removed.ok && removed.cart.lines.length, 0);
});

test("reads refresh inactivity at most once per 24 hours and hide unpublished lines", async () => {
  const repository = new MemoryGuestCartRepository();
  repository.availableSelections.add(`${PRODUCT_A}:none`);
  let currentTime = new Date("2026-08-14T04:00:00.000Z");
  const service = createGuestCartService({ enabled: true, repository, now: () => currentTime });
  const created = await service.create();
  assert.equal(created.ok, true);
  if (!created.ok) return;
  await service.setLine(created.guestToken, { productId: PRODUCT_A, requestedQuantity: 1 });
  assert.equal(repository.touchCount, 1);

  currentTime = new Date("2026-08-15T03:59:59.000Z");
  await service.read(created.guestToken);
  assert.equal(repository.touchCount, 1);

  currentTime = new Date("2026-08-15T04:00:00.000Z");
  await service.read(created.guestToken);
  assert.equal(repository.touchCount, 2);

  repository.availableSelections.clear();
  const reconciled = await service.read(created.guestToken);
  assert.equal(reconciled.ok, true);
  if (!reconciled.ok) return;
  assert.deepEqual(reconciled.cart.lines, []);
  assert.equal(reconciled.cart.unavailableLineCount, 1);
});

test("server adapter remains server-only, flag-gated and outside inventory/order/payment authority", () => {
  const source = readFileSync("src/lib/supabase/guest-cart-server.ts", "utf8");
  assert.match(source, /COMMERCE_GUEST_CART_ENABLED/);
  assert.match(source, /SUPABASE_SECRET_KEY/);
  assert.doesNotMatch(source, /NEXT_PUBLIC_[A-Z0-9_]*(?:SECRET|SERVICE_ROLE)/);
  assert.doesNotMatch(source, /inventory_items|orders|payments|refunds|commerce_events/);
  assert.doesNotMatch(source, /console\.|guestTokenHash.*(?:log|JSON)/);
  assert.throws(() => createGuestCartCookie("invalid", "production"));
});
