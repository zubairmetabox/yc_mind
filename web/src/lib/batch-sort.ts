// Split out from data.ts (which uses node:fs) so client components — e.g.
// sorting the Companies table chronologically by batch — can import this
// without pulling a server-only module into the browser bundle.
const SEASON_ORDER: Record<string, number> = { winter: 0, spring: 1, summer: 2, fall: 3 };
export const UNPARSEABLE_BATCH = 999999;

export function batchSortKey(batch: string): number {
  const parts = batch.trim().split(" ");
  if (parts.length === 2 && /^\d+$/.test(parts[1])) {
    const season = SEASON_ORDER[parts[0].toLowerCase()];
    if (season !== undefined) return Number(parts[1]) * 10 + season;
  }
  return UNPARSEABLE_BATCH;
}
