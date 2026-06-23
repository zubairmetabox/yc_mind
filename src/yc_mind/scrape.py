"""Full company fetch from the YC directory.

Algolia caps offset pagination at 1,000 hits per query, but the directory has
~6k companies. We work around this by slicing on the `batch` facet: every batch
is well under 1,000 companies, so we fetch each batch's companies in full, then
concatenate. This yields the complete directory.
"""

from __future__ import annotations

import json
from pathlib import Path
from typing import Callable

from .algolia import AlgoliaClient
from .models import Company, parse_batch

_PAGE_SIZE = 1000


def fetch_all_companies(
    client: AlgoliaClient | None = None,
    *,
    progress: Callable[[str, int, int], None] | None = None,
) -> list[Company]:
    """Fetch every public YC company by iterating over batches.

    `progress(batch, index, total)` is called before each batch fetch, if given.
    """
    client = client or AlgoliaClient()
    batch_counts = client.facet_counts("batch")
    # Sort batches chronologically for tidy, resumable output.
    batches = sorted(batch_counts, key=parse_batch)

    companies: list[Company] = []
    seen: set[str] = set()
    for i, batch in enumerate(batches, 1):
        if progress:
            progress(batch, i, len(batches))
        for hit in _fetch_batch(client, batch):
            obj_id = hit.get("objectID")
            if obj_id in seen:
                continue
            seen.add(obj_id)
            companies.append(Company.from_hit(hit))
    return companies


def _fetch_batch(client: AlgoliaClient, batch: str) -> list[dict]:
    """Fetch all hits for a single batch, paging if needed."""
    hits: list[dict] = []
    page = 0
    while True:
        resp = client.query(
            page=page,
            hits_per_page=_PAGE_SIZE,
            facet_filters=[f"batch:{batch}"],
        )
        hits.extend(resp.get("hits", []))
        if page >= resp.get("nbPages", 1) - 1:
            break
        page += 1
    return hits


def save_companies(companies: list[Company], path: str | Path) -> Path:
    """Write companies to newline-delimited JSON (full raw hits preserved)."""
    path = Path(path)
    path.parent.mkdir(parents=True, exist_ok=True)
    with path.open("w", encoding="utf-8") as fh:
        for c in companies:
            fh.write(json.dumps(c.raw, ensure_ascii=False) + "\n")
    return path


def load_companies(path: str | Path) -> list[Company]:
    """Load companies previously written by `save_companies`."""
    path = Path(path)
    companies: list[Company] = []
    with path.open("r", encoding="utf-8") as fh:
        for line in fh:
            line = line.strip()
            if line:
                companies.append(Company.from_hit(json.loads(line)))
    return companies
