import { z } from "zod";
import type { Database } from "@/lib/supabase/database.types";

export type CustomerAddressTable = Database["public"]["Tables"]["customer_addresses"];
export type AddressDatabase = Database;

const required = (max: number) => z.string().trim().min(1).max(max);
const optional = (max: number) => z.string().trim().max(max).transform((value) => value || null);

export const customerAddressSchema = z.object({
  label: required(40), recipient_name: required(120), phone: required(32).min(3),
  country_code: z.string().trim().transform((value) => value.toUpperCase()).pipe(z.string().regex(/^[A-Z]{2}$/)).default("VN"),
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
