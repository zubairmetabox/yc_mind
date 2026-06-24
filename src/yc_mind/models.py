"""Normalized company record + batch parsing.

We keep the full raw Algolia hit but also project a small, stable set of fields
that the trend analysis cares about. Batch strings ("Winter 2009", "Summer
2021", ...) are parsed into a sortable key so trend lines come out in
chronological order.
"""

from __future__ import annotations

from dataclasses import dataclass, field

# Season ordering within a year. YC has used Winter/Spring/Summer/Fall.
_SEASON_ORDER = {"winter": 0, "spring": 1, "summer": 2, "fall": 3}

# Fields we lift out of the raw hit for the flat record / CSV.
SCALAR_FIELDS = (
    "name",
    "slug",
    "batch",
    "status",
    "industry",
    "subindustry",
    "one_liner",
    "long_description",
    "team_size",
    "all_locations",
    "website",
    "stage",
    "launched_at",
    "top_company",
)
LIST_FIELDS = ("tags", "industries", "regions")


def parse_batch(batch: str | None) -> tuple[int, int]:
    """Return a sortable (year, season_rank) key for a batch string.

    Unparseable / special batches (e.g. "IK12", "Unspecified") sort to the end.
    """
    if not batch:
        return (9999, 9)
    parts = batch.strip().split()
    if len(parts) == 2 and parts[1].isdigit():
        season = _SEASON_ORDER.get(parts[0].lower())
        if season is not None:
            return (int(parts[1]), season)
    return (9999, 9)


@dataclass
class Company:
    """A flattened YC company record plus the original Algolia hit."""

    name: str
    slug: str
    batch: str
    status: str
    industry: str
    subindustry: str
    one_liner: str
    long_description: str
    team_size: object
    all_locations: str
    website: str
    stage: str
    launched_at: object
    top_company: bool
    tags: list[str] = field(default_factory=list)
    industries: list[str] = field(default_factory=list)
    regions: list[str] = field(default_factory=list)
    # Populated on demand by keywords.attach_keywords(); not part of the raw hit.
    keywords: list[str] = field(default_factory=list)
    raw: dict = field(default_factory=dict, repr=False)

    @classmethod
    def from_hit(cls, hit: dict) -> "Company":
        scalars = {f: hit.get(f) for f in SCALAR_FIELDS}
        lists = {f: list(hit.get(f) or []) for f in LIST_FIELDS}
        return cls(raw=hit, **scalars, **lists)

    @property
    def batch_key(self) -> tuple[int, int]:
        return parse_batch(self.batch)

    def to_flat(self) -> dict:
        """Flat dict suitable for CSV / DataFrame (lists joined with '|')."""
        out = {f: getattr(self, f) for f in SCALAR_FIELDS}
        for f in LIST_FIELDS:
            out[f] = "|".join(getattr(self, f))
        return out
