import { z } from "zod";

export const shippingCountrySchema = z.string().regex(/^[A-Z]{2}$/);
export const shippingMoneySchema = z.number().int().min(0).max(1_000_000);

export function getShippingEstimate(
  countryCode: string,
  rates: Readonly<Record<string, number>>,
): number | null {
  const country = countryCode.trim().toUpperCase();
  if (country === "VN") return 0;
  return Object.hasOwn(rates, country) ? rates[country] : null;
}

export function formatShippingUsd(minor: number) {
  return new Intl.NumberFormat("en-US", { style: "currency", currency: "USD" }).format(minor / 100);
}
