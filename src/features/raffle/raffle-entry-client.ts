import {
  RAFFLE_ENTRY_REQUEST_HEADER,
  RAFFLE_ENTRY_REQUEST_HEADER_VALUE,
  type RaffleEntryClientResponse,
} from "./raffle-entry-contract";

export type { RaffleEntryClientResponse } from "./raffle-entry-contract";

export async function submitRaffleEntry(input: Readonly<{
  raffleId: string;
  requestId: string;
  email: string;
  displayName: string;
  rulesVersion: string;
  rulesAccepted: true;
  captchaToken: string;
}>): Promise<RaffleEntryClientResponse> {
  try {
    const response = await fetch("/api/raffle-entry", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        [RAFFLE_ENTRY_REQUEST_HEADER]: RAFFLE_ENTRY_REQUEST_HEADER_VALUE,
      },
      body: JSON.stringify(input),
    });
    const parsed: unknown = await response.json();
    if (!parsed || typeof parsed !== "object" || !("ok" in parsed)) {
      return { ok: false, code: "entry_unavailable" };
    }
    return parsed as RaffleEntryClientResponse;
  } catch {
    return { ok: false, code: "entry_unavailable" };
  }
}
