import Link from "next/link";
import { ArrowUpRight, ArrowDownRight } from "lucide-react";
import { StatCard } from "@/components/stat-card";
import { BatchSizeChart } from "@/components/charts/batch-size-chart";
import { getBatchSizes, getDataFreshness, getMovers } from "@/lib/data";

export const dynamic = "force-dynamic";

export default function OverviewPage() {
  const batchSizes = getBatchSizes();
  // Headline stat uses a min-size floor so a just-announced, barely-filled
  // batch (e.g. 1 company) doesn't get reported as "the latest batch."
  const substantialBatches = getBatchSizes({ minSize: 30 });
  const { companiesUpdatedAt, totalCompanies } = getDataFreshness();
  const movers = getMovers("keywords");
  const rising = movers.slice(0, 5);
  const falling = movers.slice(-5).reverse();
  const latestBatch = substantialBatches.at(-1);

  return (
    <div className="flex flex-col gap-6">
      <div>
        <p className="text-xs font-medium uppercase tracking-[0.18em] text-muted-foreground">
          Overview
        </p>
        <h1 className="text-2xl font-semibold tracking-tight text-foreground sm:text-3xl">
          YC funding trend explorer
        </h1>
        <p className="mt-1 max-w-2xl text-sm text-muted-foreground">
          Pulled from YC&apos;s public company directory. Re-run the Python pipeline to
          refresh — this page reads straight from disk, no rebuild needed.
        </p>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <StatCard label="Companies tracked" value={totalCompanies.toLocaleString()} />
        <StatCard
          label="Latest batch"
          value={latestBatch?.batch ?? "—"}
          hint={latestBatch ? `${latestBatch.count} companies` : undefined}
        />
        <StatCard
          label="Data last scraped"
          value={companiesUpdatedAt ? new Date(companiesUpdatedAt).toLocaleDateString() : "—"}
          hint={companiesUpdatedAt ? new Date(companiesUpdatedAt).toLocaleTimeString() : undefined}
        />
      </div>

      <div className="rounded-[1.75rem] border border-border/80 bg-card p-5 shadow-sm">
        <div className="mb-3 flex items-center justify-between">
          <h2 className="text-sm font-semibold text-foreground">Companies per batch</h2>
          <Link href="/companies" className="text-xs text-muted-foreground hover:text-foreground">
            View companies →
          </Link>
        </div>
        <BatchSizeChart data={batchSizes} />
      </div>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        <MoversPreview title="Rising themes" icon="up" items={rising} />
        <MoversPreview title="Falling themes" icon="down" items={falling} />
      </div>
    </div>
  );
}

function MoversPreview({
  title,
  icon,
  items,
}: {
  title: string;
  icon: "up" | "down";
  items: { theme: string; change: number; recentShare: number }[];
}) {
  const Icon = icon === "up" ? ArrowUpRight : ArrowDownRight;
  const color = icon === "up" ? "text-emerald-500" : "text-rose-500";

  return (
    <div className="rounded-[1.75rem] border border-border/80 bg-card p-5 shadow-sm">
      <div className="mb-3 flex items-center justify-between">
        <h2 className="text-sm font-semibold text-foreground">{title}</h2>
        <Link href="/trends" className="text-xs text-muted-foreground hover:text-foreground">
          Explore trends →
        </Link>
      </div>
      <ul className="flex flex-col gap-2">
        {items.map((item) => (
          <li
            key={item.theme}
            className="flex items-center justify-between rounded-[1.25rem] bg-secondary/60 px-3.5 py-2.5"
          >
            <span className="text-sm font-medium text-foreground">{item.theme}</span>
            <span className={`flex items-center gap-1 text-sm font-medium ${color}`}>
              <Icon className="size-3.5" />
              {(item.change * 100).toFixed(1)} pts
            </span>
          </li>
        ))}
      </ul>
    </div>
  );
}
