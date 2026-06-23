"""Stage 1 trend analysis: sector / tag share batch-over-batch.

The core signal we decided on (see planning docs): for each batch, what share of
companies carry a given tag or industry. Tracking that share across batches in
chronological order shows what YC is funding *more* of over time. We also compute
"movers" — the biggest risers/fallers comparing recent batches to an earlier
baseline.
"""

from __future__ import annotations

from collections import Counter, defaultdict

import pandas as pd

from .models import Company, parse_batch

# Batches are seasonal; only keep "real" seasonal batches in trend lines so the
# x-axis is clean (drops "Unspecified", "IK12", etc. which sort to year 9999).
def _is_real_batch(batch: str) -> bool:
    return parse_batch(batch)[0] != 9999


def ordered_batches(
    companies: list[Company], *, real_only: bool = True, min_size: int = 0
) -> list[str]:
    """Batches in chronological order.

    `min_size` drops sparsely-filled batches — notably future/announced batches
    that have only a handful of companies and would otherwise produce wildly
    noisy shares (a single company => 100% of whatever tags it carries).
    """
    counts = Counter(c.batch for c in companies if c.batch)
    batches = set(counts)
    if real_only:
        batches = {b for b in batches if _is_real_batch(b)}
    if min_size:
        batches = {b for b in batches if counts[b] >= min_size}
    return sorted(batches, key=parse_batch)


def batch_sizes(companies: list[Company], *, min_size: int = 0) -> dict[str, int]:
    counts = Counter(c.batch for c in companies if c.batch)
    return {b: counts[b] for b in ordered_batches(companies, min_size=min_size)}


def _field_values(company: Company, field: str) -> list[str]:
    """Return the list of category values for a company on a given field.

    `tags` / `industries` / `regions` are lists; `industry` / `status` are scalars.
    """
    val = getattr(company, field, None)
    if isinstance(val, list):
        return [v for v in val if v]
    return [val] if val else []


def share_by_batch(
    companies: list[Company],
    field: str = "tags",
    *,
    min_size: int = 30,
) -> pd.DataFrame:
    """DataFrame indexed by batch (chronological), columns = category values,
    cells = share (0..1) of that batch's companies carrying the value.

    `min_size` excludes sparse/future batches (default 30) so shares are stable.
    """
    totals = batch_sizes(companies, min_size=min_size)
    batches = list(totals)
    counts: dict[str, Counter] = defaultdict(Counter)
    for c in companies:
        if c.batch not in totals:
            continue
        for v in _field_values(c, field):
            counts[c.batch][v] += 1

    rows = {b: {v: n / totals[b] for v, n in counts[b].items()} for b in batches}
    df = pd.DataFrame.from_dict(rows, orient="index").fillna(0.0)
    return df.reindex([b for b in batches if b in df.index])


def count_by_batch(
    companies: list[Company], field: str = "tags", *, min_size: int = 30
) -> pd.DataFrame:
    """Absolute counts per batch (same shape as `share_by_batch`)."""
    batches = ordered_batches(companies, min_size=min_size)
    keep = set(batches)
    counts: dict[str, Counter] = defaultdict(Counter)
    for c in companies:
        if c.batch not in keep:
            continue
        for v in _field_values(c, field):
            counts[c.batch][v] += 1
    df = pd.DataFrame.from_dict(
        {b: dict(counts[b]) for b in batches}, orient="index"
    ).fillna(0)
    return df.reindex([b for b in batches if b in df.index]).astype(int)


def movers(
    share: pd.DataFrame,
    *,
    recent: int = 4,
    baseline: int = 8,
    min_recent_share: float = 0.0,
) -> pd.DataFrame:
    """Compare the mean share over the last `recent` batches against the
    `baseline` batches before them. Returns a table sorted by absolute change.

    Columns: baseline_share, recent_share, change (recent - baseline).
    """
    if len(share) < recent + 1:
        raise ValueError("Not enough batches for the requested recent window.")

    recent_rows = share.iloc[-recent:]
    base_rows = share.iloc[-(recent + baseline) : -recent]
    if base_rows.empty:
        base_rows = share.iloc[:-recent]

    recent_mean = recent_rows.mean()
    base_mean = base_rows.mean()
    table = pd.DataFrame(
        {
            "baseline_share": base_mean,
            "recent_share": recent_mean,
            "change": recent_mean - base_mean,
        }
    )
    table = table[table["recent_share"] >= min_recent_share]
    return table.sort_values("change", ascending=False)
