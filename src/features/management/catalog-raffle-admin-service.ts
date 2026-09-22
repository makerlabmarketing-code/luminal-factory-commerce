import "server-only";

import { z } from "zod";
import type { CommerceAdminPrivilegedClient } from "./commerce-admin-route-runtime";
import type {
  ProductDraftMutationWire,
  ProductStateMutationWire,
  RaffleDraftMutationWire,
  RaffleStateMutationWire,
} from "./catalog-raffle-admin-contract";

const productRowSchema = z.object({
  id: z.uuid(),
  slug: z.string(),
  name: z.string(),
  description: z.string().nullable(),
  product_type: z.string(),
  release_type: z.string(),
  status: z.string(),
  published_at: z.string().nullable(),
  created_at: z.string(),
  updated_at: z.string(),
});

const raffleRowSchema = z.object({
  id: z.uuid(),
  slug: z.string(),
  product_id: z.uuid().nullable(),
  variant_id: z.uuid().nullable(),
  title: z.string(),
  summary: z.string().nullable(),
  rules_summary: z.string().nullable(),
  status: z.string(),
  rules_version: z.string(),
  opens_at: z.string().nullable(),
  closes_at: z.string().nullable(),
  is_published: z.boolean(),
  published_at: z.string().nullable(),
  is_test: z.boolean(),
  results_published_at: z.string().nullable(),
  created_at: z.string(),
  updated_at: z.string(),
});

export type ProductAdminWire = z.infer<typeof productRowSchema>;
export type RaffleAdminWire = z.infer<typeof raffleRowSchema>;

export class CatalogRaffleAdminServiceError extends Error {
  constructor(
    public readonly code: "NOT_FOUND" | "CONFLICT" | "PERSISTENCE_FAILED",
    message: string,
  ) {
    super(message);
    this.name = "CatalogRaffleAdminServiceError";
  }
}

function persistenceFailure(error: Readonly<{ code?: string; message?: string }> | null): never {
  if (error?.code === "P0002") throw new CatalogRaffleAdminServiceError("NOT_FOUND", "Management record không tồn tại.");
  if (["23505", "23503", "23514", "22023", "55P03"].includes(error?.code ?? "")) {
    throw new CatalogRaffleAdminServiceError("CONFLICT", "Management operation conflicts with current state.");
  }
  throw new CatalogRaffleAdminServiceError("PERSISTENCE_FAILED", "Commerce management persistence failed.");
}

export async function listManagedProducts(client: CommerceAdminPrivilegedClient): Promise<ProductAdminWire[]> {
  const { data, error } = await client
    .from("products")
    .select("id,slug,name,description,product_type,release_type,status,published_at,created_at,updated_at")
    .order("updated_at", { ascending: false })
    .limit(200);

  if (error) persistenceFailure(error);
  return z.array(productRowSchema).parse(data ?? []);
}

export async function listManagedRaffles(client: CommerceAdminPrivilegedClient): Promise<RaffleAdminWire[]> {
  const { data, error } = await client
    .from("raffles")
    .select("id,slug,product_id,variant_id,title,summary,rules_summary,status,rules_version,opens_at,closes_at,is_published,published_at,is_test,results_published_at,created_at,updated_at")
    .order("updated_at", { ascending: false })
    .limit(200);

  if (error) persistenceFailure(error);
  return z.array(raffleRowSchema).parse(data ?? []);
}

async function executeProductMutation(
  client: CommerceAdminPrivilegedClient,
  input: Readonly<{
    operationId: string;
    clientId: string;
    action: "create_draft" | "update_draft" | "publish" | "archive";
    targetId: string | null;
    requestFingerprint: string;
    product: unknown;
  }>,
): Promise<ProductAdminWire> {
  const { data, error } = await client.rpc("manage_catalog_product", {
    p_operation_id: input.operationId,
    p_client_id: input.clientId,
    p_action: input.action,
    p_target_id: input.targetId,
    p_request_fingerprint: input.requestFingerprint,
    p_product: input.product,
  });
  if (error || !data) persistenceFailure(error);
  return productRowSchema.parse(data);
}

async function executeRaffleMutation(
  client: CommerceAdminPrivilegedClient,
  input: Readonly<{
    operationId: string;
    clientId: string;
    action: "create_draft" | "update_draft" | "publish" | "unpublish";
    targetId: string | null;
    requestFingerprint: string;
    raffle: unknown;
  }>,
): Promise<RaffleAdminWire> {
  const { data, error } = await client.rpc("manage_raffle", {
    p_operation_id: input.operationId,
    p_client_id: input.clientId,
    p_action: input.action,
    p_target_id: input.targetId,
    p_request_fingerprint: input.requestFingerprint,
    p_raffle: input.raffle,
  });
  if (error || !data) persistenceFailure(error);
  return raffleRowSchema.parse(data);
}

function productDraftPayload(mutation: ProductDraftMutationWire) {
  return {
    slug: mutation.draft.slug,
    name: mutation.draft.name,
    description: mutation.draft.description ?? null,
    product_type: mutation.draft.productType,
    release_type: mutation.draft.releaseType,
  };
}

function raffleDraftPayload(mutation: RaffleDraftMutationWire) {
  return {
    slug: mutation.draft.slug,
    title: mutation.draft.title,
    summary: mutation.draft.summary ?? null,
    rules_summary: mutation.draft.rulesSummary ?? null,
    rules_version: mutation.draft.rulesVersion,
    product_id: mutation.draft.productId ?? null,
    variant_id: mutation.draft.variantId ?? null,
    opens_at: mutation.draft.opensAt ?? null,
    closes_at: mutation.draft.closesAt ?? null,
    status: mutation.draft.status,
    is_test: mutation.draft.isTest,
  };
}

export function createManagedProduct(
  client: CommerceAdminPrivilegedClient,
  mutation: ProductDraftMutationWire,
  context: Readonly<{ clientId: string; requestFingerprint: string }>,
) {
  return executeProductMutation(client, {
    operationId: mutation.operationId,
    clientId: context.clientId,
    action: "create_draft",
    targetId: null,
    requestFingerprint: context.requestFingerprint,
    product: productDraftPayload(mutation),
  });
}

export function updateManagedProduct(
  client: CommerceAdminPrivilegedClient,
  productId: string,
  mutation: ProductDraftMutationWire,
  context: Readonly<{ clientId: string; requestFingerprint: string }>,
) {
  return executeProductMutation(client, {
    operationId: mutation.operationId,
    clientId: context.clientId,
    action: "update_draft",
    targetId: productId,
    requestFingerprint: context.requestFingerprint,
    product: productDraftPayload(mutation),
  });
}

export function publishManagedProduct(
  client: CommerceAdminPrivilegedClient,
  productId: string,
  mutation: ProductStateMutationWire,
  context: Readonly<{ clientId: string; requestFingerprint: string }>,
) {
  return executeProductMutation(client, {
    operationId: mutation.operationId,
    clientId: context.clientId,
    action: "publish",
    targetId: productId,
    requestFingerprint: context.requestFingerprint,
    product: null,
  });
}

export function archiveManagedProduct(
  client: CommerceAdminPrivilegedClient,
  productId: string,
  mutation: ProductStateMutationWire,
  context: Readonly<{ clientId: string; requestFingerprint: string }>,
) {
  return executeProductMutation(client, {
    operationId: mutation.operationId,
    clientId: context.clientId,
    action: "archive",
    targetId: productId,
    requestFingerprint: context.requestFingerprint,
    product: null,
  });
}

export function createManagedRaffle(
  client: CommerceAdminPrivilegedClient,
  mutation: RaffleDraftMutationWire,
  context: Readonly<{ clientId: string; requestFingerprint: string }>,
) {
  return executeRaffleMutation(client, {
    operationId: mutation.operationId,
    clientId: context.clientId,
    action: "create_draft",
    targetId: null,
    requestFingerprint: context.requestFingerprint,
    raffle: raffleDraftPayload(mutation),
  });
}

export function updateManagedRaffle(
  client: CommerceAdminPrivilegedClient,
  raffleId: string,
  mutation: RaffleDraftMutationWire,
  context: Readonly<{ clientId: string; requestFingerprint: string }>,
) {
  return executeRaffleMutation(client, {
    operationId: mutation.operationId,
    clientId: context.clientId,
    action: "update_draft",
    targetId: raffleId,
    requestFingerprint: context.requestFingerprint,
    raffle: raffleDraftPayload(mutation),
  });
}

export function publishManagedRaffle(
  client: CommerceAdminPrivilegedClient,
  raffleId: string,
  mutation: RaffleStateMutationWire,
  context: Readonly<{ clientId: string; requestFingerprint: string }>,
) {
  return executeRaffleMutation(client, {
    operationId: mutation.operationId,
    clientId: context.clientId,
    action: "publish",
    targetId: raffleId,
    requestFingerprint: context.requestFingerprint,
    raffle: null,
  });
}

export function unpublishManagedRaffle(
  client: CommerceAdminPrivilegedClient,
  raffleId: string,
  mutation: RaffleStateMutationWire,
  context: Readonly<{ clientId: string; requestFingerprint: string }>,
) {
  return executeRaffleMutation(client, {
    operationId: mutation.operationId,
    clientId: context.clientId,
    action: "unpublish",
    targetId: raffleId,
    requestFingerprint: context.requestFingerprint,
    raffle: null,
  });
}
