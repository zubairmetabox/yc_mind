"""CLI: scrape the full YC company directory to data/companies.jsonl + a flat CSV.

Usage (from repo root, venv active):
    python scripts/scrape_companies.py
    python scripts/scrape_companies.py --out data/companies.jsonl
"""

from __future__ import annotations

import argparse
import csv
import sys
from pathlib import Path

# Make `src/` importable when run as a plain script.
sys.path.insert(0, str(Path(__file__).resolve().parent.parent / "src"))

from yc_mind.models import SCALAR_FIELDS, LIST_FIELDS  # noqa: E402
from yc_mind.scrape import fetch_all_companies, save_companies  # noqa: E402


def _progress(batch: str, i: int, total: int) -> None:
    print(f"  [{i:>2}/{total}] {batch}", flush=True)


def write_csv(companies, path: Path) -> Path:
    path.parent.mkdir(parents=True, exist_ok=True)
    cols = list(SCALAR_FIELDS) + list(LIST_FIELDS)
    with path.open("w", encoding="utf-8", newline="") as fh:
        writer = csv.DictWriter(fh, fieldnames=cols)
        writer.writeheader()
        for c in companies:
            writer.writerow(c.to_flat())
    return path


def main() -> None:
    parser = argparse.ArgumentParser(description="Scrape the YC company directory.")
    parser.add_argument("--out", default="data/companies.jsonl",
                        help="Output JSONL path (raw hits). Default: data/companies.jsonl")
    parser.add_argument("--csv", default="data/companies.csv",
                        help="Flat CSV path. Default: data/companies.csv")
    args = parser.parse_args()

    print("Fetching YC company directory (batch by batch)...")
    companies = fetch_all_companies(progress=_progress)
    print(f"Fetched {len(companies)} companies.")

    jsonl_path = save_companies(companies, args.out)
    csv_path = write_csv(companies, Path(args.csv))
    print(f"Wrote {jsonl_path}")
    print(f"Wrote {csv_path}")


if __name__ == "__main__":
    main()
