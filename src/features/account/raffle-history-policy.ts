export type RaffleHistoryRecord = Readonly<{
  id: string;
  created_at: string;
  raffles: Readonly<{
    title: string;
    slug: string;
    is_test: boolean;
    is_published: boolean;
    results_published_at: string | null;
    status: string;
  }>;
}>;
export type RaffleAllocationSummary = Readonly<{
  raffle_entry_id: string;
  status: string;
}>;
export type RaffleHistoryItem = Readonly<{
  id: string;
  title: string;
  slug: string;
  enteredAt: string;
  outcome: "entered" | "selected" | "not_selected";
  fulfillmentStatus: string | null;
}>;

/**
 * Results are confidential until an explicit publication timestamp, and
 * neither test nor unpublished raffles may reach customer account history.
 * The caller must fetch records scoped to a separately verified identity.
 */
export function resolveRaffleHistory(
  records: readonly RaffleHistoryRecord[],
  allocations: readonly RaffleAllocationSummary[],
  now: number,
): RaffleHistoryItem[] {
  if (!Number.isFinite(now)) return [];
  const statuses = new Map(allocations.map((row) => [row.raffle_entry_id, row.status]));
  return records
    .filter((record) => record.raffles.is_published && !record.raffles.is_test)
    .map((record) => {
      const published = record.raffles.results_published_at;
      const hasPublishedResults = published !== null &&
        Number.isFinite(Date.parse(published)) &&
        Date.parse(published) <= now;
      const status = hasPublishedResults ? statuses.get(record.id) ?? null : null;
      return {
        id: record.id,
        title: record.raffles.title,
        slug: record.raffles.slug,
        enteredAt: record.created_at,
        outcome: hasPublishedResults ? status !== null ? "selected" as const : "not_selected" as const : "entered" as const,
        fulfillmentStatus: status,
      };
    });
}
