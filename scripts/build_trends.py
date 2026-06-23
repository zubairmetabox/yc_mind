"""CLI: build Stage 1 trend tables from scraped companies.

Reads data/companies.jsonl, writes per-batch share tables (tags + industry) and
a "movers" summary, and prints the top risers/fallers to the console.

Usage (from repo root, venv active):
    python scripts/build_trends.py
    python scripts/build_trends.py --field tags --recent 4 --baseline 8 --top 20
"""

from __future__ import annotations

import argparse
import sys
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parent.parent / "src"))

from yc_mind.scrape import load_companies  # noqa: E402
from yc_mind import trends  # noqa: E402


def _print_movers(table, top: int, label: str) -> None:
    pct = lambda x: f"{x * 100:5.1f}%"
    print(f"\n=== Top {top} RISING {label} (recent vs. baseline share) ===")
    for name, row in table.head(top).iterrows():
        print(f"  {name:<28} {pct(row.baseline_share)} -> {pct(row.recent_share)}"
              f"  ({'+' if row.change >= 0 else ''}{row.change * 100:.1f} pts)")
    print(f"\n=== Top {top} FALLING {label} ===")
    for name, row in table.tail(top).iloc[::-1].iterrows():
        print(f"  {name:<28} {pct(row.baseline_share)} -> {pct(row.recent_share)}"
              f"  ({'+' if row.change >= 0 else ''}{row.change * 100:.1f} pts)")


def main() -> None:
    parser = argparse.ArgumentParser(description="Build YC trend tables.")
    parser.add_argument("--in", dest="infile", default="data/companies.jsonl")
    parser.add_argument("--field", default="tags",
                        help="Category field to trend: tags | industry | subindustry")
    parser.add_argument("--recent", type=int, default=4,
                        help="Number of most-recent batches in the recent window.")
    parser.add_argument("--baseline", type=int, default=8,
                        help="Number of batches before the recent window for baseline.")
    parser.add_argument("--top", type=int, default=15, help="How many movers to print.")
    parser.add_argument("--min-size", type=int, default=30, dest="min_size",
                        help="Exclude batches with fewer than N companies (drops "
                             "sparse/future batches). Default: 30")
    parser.add_argument("--outdir", default="data", help="Where to write trend CSVs.")
    args = parser.parse_args()

    companies = load_companies(args.infile)
    print(f"Loaded {len(companies)} companies from {args.infile}.")

    outdir = Path(args.outdir)
    outdir.mkdir(parents=True, exist_ok=True)

    share = trends.share_by_batch(companies, args.field, min_size=args.min_size)
    counts = trends.count_by_batch(companies, args.field, min_size=args.min_size)
    share_path = outdir / f"trend_share_{args.field}.csv"
    count_path = outdir / f"trend_counts_{args.field}.csv"
    share.to_csv(share_path)
    counts.to_csv(count_path)

    mv = trends.movers(share, recent=args.recent, baseline=args.baseline)
    movers_path = outdir / f"trend_movers_{args.field}.csv"
    mv.to_csv(movers_path)

    sizes = trends.batch_sizes(companies, min_size=args.min_size)
    recent_batches = list(sizes)[-args.recent:]
    print(f"Batches analysed: {len(sizes)} "
          f"({list(sizes)[0]} ... {list(sizes)[-1]})")
    print(f"Recent window = last {args.recent} batches: {', '.join(recent_batches)}")
    _print_movers(mv, args.top, args.field)

    print(f"\nWrote:\n  {share_path}\n  {count_path}\n  {movers_path}")


if __name__ == "__main__":
    main()
