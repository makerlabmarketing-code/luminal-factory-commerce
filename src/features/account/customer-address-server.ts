import "server-only";
import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import { getCustomerAuthEnvironment } from "@/features/auth/customer-auth-request";
import type { AddressDatabase, CustomerAddress, CustomerAddressInput } from "@/features/account/customer-address-contract";
import { customerAddressSchema } from "@/features/account/customer-address-contract";

function createClient(cookieStore: Awaited<ReturnType<typeof cookies>>) {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL?.trim();
  const key = (process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY ?? process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY)?.trim();
  if (!url || !key) throw new Error("Address service unavailable.");
  return createServerClient<AddressDatabase>(url, key, {
    cookies: { getAll: () => cookieStore.getAll(), setAll: () => {} },
  });
}

export async function getAddressContext() {
  if (!getCustomerAuthEnvironment().ready || process.env.COMMERCE_SAVED_ADDRESSES_ENABLED !== "true") return null;
  const client = createClient(await cookies());
  const { data, error } = await client.auth.getUser();
  if (error || !data.user) return null;
  const { data: customer, error: customerError } = await client.from("customers").select("id").eq("auth_user_id", data.user.id).maybeSingle();
  if (customerError) throw new Error("Address service unavailable.");
  return { client, customerId: customer?.id ?? null };
}

export async function listCustomerAddresses(): Promise<CustomerAddress[]> {
  const context = await getAddressContext();
  if (!context) throw new Error("Address service unavailable.");
  if (!context.customerId) return [];
  const { data, error } = await context.client.from("customer_addresses").select("id,customer_id,label,recipient_name,phone,country_code,administrative_area,locality,address_line1,address_line2,postal_code,is_default,created_at,updated_at").eq("customer_id", context.customerId).order("is_default", { ascending: false }).order("created_at", { ascending: true }).limit(20);
  if (error) throw new Error("Address service unavailable.");
  return data ?? [];
}

export async function saveCustomerAddress(input: CustomerAddressInput, id?: string): Promise<void> {
  const context = await getAddressContext();
  if (!context?.customerId) throw new Error("Address service unavailable.");
  const address = customerAddressSchema.parse(input);
  const payload = { ...address, customer_id: context.customerId };
  const query = id
    ? context.client.from("customer_addresses").update(payload).eq("id", id).eq("customer_id", context.customerId)
    : context.client.from("customer_addresses").insert(payload);
  const { data, error } = await query.select("id").single();
  if (error || !data) throw new Error("Address could not be saved.");
}

export async function deleteCustomerAddress(id: string): Promise<void> {
  const context = await getAddressContext();
  if (!context?.customerId) throw new Error("Address service unavailable.");
  const { data, error } = await context.client.from("customer_addresses").delete().eq("id", id).eq("customer_id", context.customerId).select("id").single();
  if (error || !data) throw new Error("Address could not be deleted.");
}
