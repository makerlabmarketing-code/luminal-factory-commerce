export const RAFFLE_ENTRY_REQUEST_HEADER = "x-luminal-raffle-entry";
export const RAFFLE_ENTRY_REQUEST_HEADER_VALUE = "1";

export type RaffleEntryClientResponse =
  | Readonly<{ ok: true; state: "submitted"; entryReference: string }>
  | Readonly<{ ok: true; state: "already_entered" }>
  | Readonly<{
    ok: false;
    code:
      | "entry_unavailable"
      | "invalid_request"
      | "rate_limited"
      | "raffle_not_open"
      | "ineligible";
  }>;
