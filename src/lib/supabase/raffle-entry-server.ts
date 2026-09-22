import "server-only";

import { createClient, type SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@/lib/supabase/database.types";
import type {
  RaffleEntryCaptchaVerifier,
  RaffleEntryRateLimiter,
  RaffleEntryService,
} from "@/features/raffle/raffle-entry-request";

type RaffleEntryClient = Pick<SupabaseClient<Database>, "rpc">;

function getClient(): RaffleEntryClient | undefined {
  if (process.env.COMMERCE_RAFFLE_ENTRY_ENABLED?.trim().toLowerCase() !== "true") return undefined;
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL?.trim();
  const secret = process.env.SUPABASE_SECRET_KEY?.trim();
  if (!url || !secret) return undefined;
  return createClient<Database>(url, secret, {
    auth: { autoRefreshToken: false, detectSessionInUrl: false, persistSession: false },
  });
}

export function getServerRaffleEntryService(): RaffleEntryService | undefined {
  const client = getClient();
  if (!client) return undefined;
  return {
    async submit(input) {
      const { data, error } = await client.rpc("submit_guest_raffle_entry_v2", {
        p_raffle_id: input.raffleId,
        p_email: input.email,
        p_display_name: input.displayName,
        p_rules_version: input.rulesVersion,
        p_request_token_hash: input.requestTokenHash,
        p_request_fingerprint_hash: input.requestFingerprintHash,
        p_recipient_name: input.recipientName,
        p_address_line_1: input.addressLine1,
        p_address_line_2: input.addressLine2,
        p_city: input.city,
        p_state_province: input.stateProvince,
        p_postal_code: input.postalCode,
        p_country_code: input.countryCode,
        p_phone: input.phone,
      });
      if (error || !Array.isArray(data) || data.length !== 1) return null;
      const row = data[0];
      if (row.entry_state === "submitted" && typeof row.entry_reference === "string") {
        return { state: "submitted", entryReference: row.entry_reference };
      }
      if (["already_entered", "raffle_not_open", "ineligible"].includes(row.entry_state)) {
        return { state: row.entry_state as "already_entered" | "raffle_not_open" | "ineligible" };
      }
      return null;
    },
  };
}

export function getServerRaffleEntryRateLimiter(): RaffleEntryRateLimiter | undefined {
  const client = getClient();
  if (!client) return undefined;
  return {
    async consume({ key, bucket }) {
      try {
        const { data, error } = await client.rpc("consume_raffle_entry_rate_limit", {
          p_key_hash: key,
          p_bucket: bucket,
        });
        if (error || typeof data !== "boolean") return "unavailable";
        return data ? "allowed" : "limited";
      } catch {
        return "unavailable";
      }
    },
  };
}

export function getServerRaffleEntryCaptchaVerifier(): RaffleEntryCaptchaVerifier | undefined {
  if (process.env.COMMERCE_RAFFLE_ENTRY_ENABLED?.trim().toLowerCase() !== "true") return undefined;
  const secret = process.env.COMMERCE_RAFFLE_ENTRY_TURNSTILE_SECRET?.trim();
  if (!secret) return undefined;

  return {
    async verify({ token, sourceIdentifier, expectedHostname }) {
      const body = new URLSearchParams({ secret, response: token, remoteip: sourceIdentifier });
      const response = await fetch("https://challenges.cloudflare.com/turnstile/v0/siteverify", {
        method: "POST",
        headers: { "Content-Type": "application/x-www-form-urlencoded" },
        body,
        cache: "no-store",
        signal: AbortSignal.timeout(5_000),
      });
      if (!response.ok) return false;
      const result = (await response.json()) as { success?: unknown; action?: unknown; hostname?: unknown };
      return (
        result.success === true &&
        result.action === "raffle_entry" &&
        result.hostname === expectedHostname
      );
    },
  };
}
