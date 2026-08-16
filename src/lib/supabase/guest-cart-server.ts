import { createClient, type SupabaseClient } from "@supabase/supabase-js";
import {
  createGuestCartService,
  type GuestCartLineRecord,
  type GuestCartRecord,
  type GuestCartRepository,
} from "@/features/cart/guest-cart-service";
import type { Database } from "@/lib/supabase/database.types";

type CommerceClient = SupabaseClient<Database>;

const cartRecordSelect = "id,currency,expires_at,last_activity_at";

function toCartRecord(row: {
  id: string;
  currency: string;
  expires_at: string;
  last_activity_at: string;
}): GuestCartRecord {
  if (row.currency !== "VND") throw new Error("Guest cart returned an unsupported currency.");
  const expiresAt = new Date(row.expires_at);
  const lastActivityAt = new Date(row.last_activity_at);
  if (Number.isNaN(expiresAt.getTime()) || Number.isNaN(lastActivityAt.getTime())) {
    throw new Error("Guest cart returned invalid timestamps.");
  }
  return { id: row.id, currency: "VND", expiresAt, lastActivityAt };
}

function throwPersistenceFailure(operation: string, error: { code?: string } | null): never {
  throw new Error(`Guest cart persistence failed during ${operation}.`, {
    cause: error?.code ?? "unknown",
  });
}

async function findLogicalLine(
  client: CommerceClient,
  input: Readonly<{ cartId: string; productId: string; variantId: string | null }>,
): Promise<{ id: string } | null> {
  let query = client.from("cart_items").select("id").eq("cart_id", input.cartId);
  query = input.variantId
    ? query.eq("variant_id", input.variantId)
    : query.eq("product_id", input.productId).is("variant_id", null);
  const { data, error } = await query.maybeSingle();
  if (error) throwPersistenceFailure("line lookup", error);
  return data;
}

export function createSupabaseGuestCartRepository(client: CommerceClient): GuestCartRepository {
  const repository: GuestCartRepository = {
    async createGuestCart(input) {
      const { data, error } = await client
        .from("carts")
        .insert({
          customer_id: null,
          guest_token_hash: input.guestTokenHash,
          status: "active",
          currency: "VND",
          created_at: input.now.toISOString(),
          updated_at: input.now.toISOString(),
          last_activity_at: input.now.toISOString(),
          expires_at: input.expiresAt.toISOString(),
        })
        .select(cartRecordSelect)
        .single();
      if (error || !data) throwPersistenceFailure("cart creation", error);
      return toCartRecord(data);
    },

    async findActiveGuestCart(input) {
      const { data, error } = await client
        .from("carts")
        .select(cartRecordSelect)
        .eq("guest_token_hash", input.guestTokenHash)
        .eq("status", "active")
        .gt("expires_at", input.now.toISOString())
        .maybeSingle();
      if (error) throwPersistenceFailure("cart lookup", error);
      return data ? toCartRecord(data) : null;
    },

    async listGuestCartLines(cartId) {
      const { data, error } = await client
        .from("cart_items")
        .select("product_id,variant_id,requested_quantity")
        .eq("cart_id", cartId)
        .order("created_at", { ascending: true });
      if (error) throwPersistenceFailure("line listing", error);

      return Promise.all(
        (data ?? []).map(async (line): Promise<GuestCartLineRecord> => ({
          productId: line.product_id,
          variantId: line.variant_id,
          requestedQuantity: line.requested_quantity,
          isAvailable: await repository.isPublishedCatalogSelection({
            productId: line.product_id,
            variantId: line.variant_id,
          }),
        })),
      );
    },

    async isPublishedCatalogSelection(input) {
      const { data: product, error: productError } = await client
        .from("products")
        .select("id")
        .eq("id", input.productId)
        .eq("status", "published")
        .maybeSingle();
      if (productError) throwPersistenceFailure("product availability lookup", productError);
      if (!product) return false;
      if (!input.variantId) return true;

      const { data: variant, error: variantError } = await client
        .from("product_variants")
        .select("id")
        .eq("id", input.variantId)
        .eq("product_id", input.productId)
        .eq("is_active", true)
        .maybeSingle();
      if (variantError) throwPersistenceFailure("variant availability lookup", variantError);
      return Boolean(variant);
    },

    async setGuestCartLine(input) {
      const existingLine = await findLogicalLine(client, input);
      if (existingLine) {
        const { error } = await client
          .from("cart_items")
          .update({ requested_quantity: input.requestedQuantity, updated_at: input.now.toISOString() })
          .eq("id", existingLine.id);
        if (error) throwPersistenceFailure("line update", error);
        return;
      }

      const { error } = await client.from("cart_items").insert({
        cart_id: input.cartId,
        product_id: input.productId,
        variant_id: input.variantId,
        requested_quantity: input.requestedQuantity,
        created_at: input.now.toISOString(),
        updated_at: input.now.toISOString(),
      });
      if (!error) return;

      // A concurrent absolute-quantity write can win the partial unique index race.
      // Resolve that row once and apply the caller's final requested quantity.
      if (error.code === "23505") {
        const racedLine = await findLogicalLine(client, input);
        if (racedLine) {
          const { error: retryError } = await client
            .from("cart_items")
            .update({ requested_quantity: input.requestedQuantity, updated_at: input.now.toISOString() })
            .eq("id", racedLine.id);
          if (!retryError) return;
          throwPersistenceFailure("line conflict update", retryError);
        }
      }
      throwPersistenceFailure("line creation", error);
    },

    async removeGuestCartLine(input) {
      let query = client.from("cart_items").delete().eq("cart_id", input.cartId);
      query = input.variantId
        ? query.eq("variant_id", input.variantId)
        : query.eq("product_id", input.productId).is("variant_id", null);
      const { error } = await query;
      if (error) throwPersistenceFailure("line removal", error);
    },

    async touchGuestCart(input) {
      const { data, error } = await client
        .from("carts")
        .update({
          last_activity_at: input.now.toISOString(),
          expires_at: input.expiresAt.toISOString(),
          updated_at: input.now.toISOString(),
        })
        .eq("id", input.cartId)
        .eq("status", "active")
        .gt("expires_at", input.now.toISOString())
        .select("id")
        .maybeSingle();
      if (error || !data) throwPersistenceFailure("activity refresh", error);
    },
  };

  return repository;
}

export function getServerGuestCartService() {
  const enabled = process.env.COMMERCE_GUEST_CART_ENABLED?.trim().toLowerCase() === "true";
  if (!enabled) return createGuestCartService({ enabled: false });

  const url = process.env.NEXT_PUBLIC_SUPABASE_URL?.trim();
  const secretKey = process.env.SUPABASE_SECRET_KEY?.trim();
  if (!url || !secretKey) return createGuestCartService({ enabled: true });

  const client = createClient<Database>(url, secretKey, {
    auth: {
      autoRefreshToken: false,
      detectSessionInUrl: false,
      persistSession: false,
    },
  });
  return createGuestCartService({
    enabled: true,
    repository: createSupabaseGuestCartRepository(client),
  });
}
