// Split from data.ts (which uses node:fs) so client components can import
// this without pulling a server-only module into the browser bundle.
export const TREND_FIELDS = ["keywords", "industry", "tags", "subindustry"] as const;
export type TrendField = (typeof TREND_FIELDS)[number];
