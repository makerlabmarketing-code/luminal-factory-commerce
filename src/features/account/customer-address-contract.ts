import { z } from "zod";
import type { Database } from "@/lib/supabase/database.types";

// Generated from Production customer_addresses on 2026-09-09.
// Kept as a narrow extension until the full database.types.ts snapshot is refreshed.
export type CustomerAddressTable = {
  Row: {
    address_line1: string; address_line2: string | null; administrative_area: string;
    country_code: string; created_at: string; customer_id: string; id: string;
    is_default: boolean; label: string; locality: string; phone: string;
    postal_code: string | null; recipient_name: string; updated_at: string;
  };
  Insert: {
    address_line1: string; address_line2?: string | null; administrative_area: string;
    country_code?: string; created_at?: string; customer_id: string; id?: string;
    is_default?: boolean; label: string; locality: string; phone: string;
    postal_code?: string | null; recipient_name: string; updated_at?: string;
  };
  Update: Partial<CustomerAddressTable["Insert"]>;
  Relationships: [{ foreignKeyName: "customer_addresses_customer_id_fkey"; columns: ["customer_id"]; isOneToOne: false; referencedRelation: "customers"; referencedColumns: ["id"] }];
};

export type AddressDatabase = Omit<Database, "public"> & {
  public: Omit<Database["public"], "Tables"> & {
    Tables: Database["public"]["Tables"] & { customer_addresses: CustomerAddressTable };
  };
};

const required = (max: number) => z.string().trim().min(1).max(max);
const optional = (max: number) => z.string().trim().max(max).transform((value) => value || null);

export const customerAddressSchema = z.object({
  label: required(40), recipient_name: required(120), phone: required(32).min(3),
  country_code: z.string().regex(/^[A-Z]{2}$/).default("VN"),
  administrative_area: required(120), locality: required(120), address_line1: required(200),
  address_line2: optional(200), postal_code: optional(32), is_default: z.boolean().default(false),
}).strict();

export type CustomerAddressInput = z.input<typeof customerAddressSchema>;
export type CustomerAddress = CustomerAddressTable["Row"];
export const customerAddressMutationSchema = z.discriminatedUnion("action", [
  z.object({ action: z.literal("create"), address: customerAddressSchema }).strict(),
  z.object({ action: z.literal("update"), id: z.uuid(), address: customerAddressSchema }).strict(),
  z.object({ action: z.literal("delete"), id: z.uuid() }).strict(),
  z.object({ action: z.literal("set_default"), id: z.uuid() }).strict(),
]);
