import { FieldSelect } from "@/components/field-select";
import { ThemeTrendChart } from "@/components/charts/theme-trend-chart";
import { MoversTable } from "@/components/movers-table";
import { getMovers, getShareTable } from "@/lib/data";
import { TREND_FIELDS, type TrendField } from "@/lib/trend-fields";

export const dynamic = "force-dynamic";

const TOP_CHART_THEMES = 6;

export default async function TrendsPage({
  searchParams,
}: {
  searchParams: Promise<{ field?: string }>;
}) {
  const { field: rawField } = await searchParams;
  const field: TrendField = TREND_FIELDS.includes(rawField as TrendField)
    ? (rawField as TrendField)
    : "keywords";

  const shareTable = getShareTable(field);
  const movers = getMovers(field).sort((a, b) => b.change - a.change);

  const topThemes = [...movers]
    .sort((a, b) => Math.abs(b.change) - Math.abs(a.change))
    .slice(0, TOP_CHART_THEMES)
    .map((m) => m.theme);

  const series = topThemes.map((theme) => ({
    name: theme,
    values: shareTable.batches.map((b) => shareTable.share[b]?.[theme] ?? 0),
  }));

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <p className="text-xs font-medium uppercase tracking-[0.18em] text-muted-foreground">
            Trends
          </p>
          <h1 className="text-2xl font-semibold tracking-tight text-foreground sm:text-3xl">
            Theme share over time
          </h1>
        </div>
        <FieldSelect value={field} />
      </div>

      <div className="rounded-[1.75rem] border border-border/80 bg-card p-5 shadow-sm">
        <h2 className="mb-3 text-sm font-semibold text-foreground">
          Top {TOP_CHART_THEMES} biggest movers — share of batch over time
        </h2>
        {series.length > 0 ? (
          <ThemeTrendChart batches={shareTable.batches} series={series} />
        ) : (
          <p className="py-8 text-center text-sm text-muted-foreground">
            No data for this field yet — run{" "}
            <code className="rounded bg-secondary px-1.5 py-0.5">
              build_trends.py --field {field}
            </code>
            .
          </p>
        )}
      </div>

      <div className="rounded-[1.75rem] border border-border/80 bg-card p-5 shadow-sm">
        <h2 className="mb-3 text-sm font-semibold text-foreground">
          All movers (recent batches vs. baseline)
        </h2>
        <MoversTable movers={movers} />
      </div>
    </div>
  );
}
