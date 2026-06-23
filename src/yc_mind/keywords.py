"""Problem-space keyword extraction from company descriptions.

`tags` lag batch announcement, but `one_liner` / `long_description` are populated
even for the newest batches (~95-100%), so free-text keywords are the reliable
signal for *current* themes. We extract n-grams (1-3 words) from the text, treat
each company's keyword set like a multi-value category field, and feed it into the
same share-by-batch / movers machinery used for tags.

Pure-Python (no embeddings / heavy deps): YC one-liners are dense with
standardized jargon ("ai agents", "automate", "infrastructure"), so n-gram
frequency captures the themes well and stays fully transparent.
"""

from __future__ import annotations

import re
from collections import Counter

from .models import Company

# Generic English stopwords + filler words common in startup blurbs that carry
# no theme signal on their own.
STOPWORDS: set[str] = {
    # articles / pronouns / conjunctions / prepositions
    "a", "an", "the", "and", "or", "but", "for", "to", "of", "in", "on", "at",
    "by", "with", "from", "as", "is", "are", "be", "being", "been", "was", "were",
    "it", "its", "this", "that", "these", "those", "you", "your", "we", "our",
    "they", "their", "them", "he", "she", "his", "her", "i", "us", "into", "out",
    "up", "down", "over", "under", "than", "then", "so", "such", "via", "per",
    "any", "all", "no", "not", "can", "will", "would", "could", "should", "may",
    "do", "does", "did", "has", "have", "had", "get", "gets", "getting",
    # startup-blurb filler
    "company", "companies", "startup", "startups", "business", "businesses",
    "product", "products", "service", "services", "solution", "solutions",
    "platform", "platforms", "software", "tool", "tools", "app", "apps",
    "help", "helps", "helping", "make", "makes", "making", "build", "builds",
    "building", "built", "use", "uses", "using", "used", "enable", "enables",
    "enabling", "provide", "provides", "providing", "allow", "allows", "let",
    "lets", "give", "gives", "world", "worlds", "people", "everyone", "anyone",
    "businesss", "way", "ways", "new", "first", "best", "easy", "easily",
    "simple", "simplest", "fast", "more", "most", "less", "without", "every",
    "across", "each", "one", "two", "based", "powered", "driven", "native",
    "like", "you're", "we're", "it's", "that's", "things", "thing", "everything",
}

_TOKEN_RE = re.compile(r"[a-z0-9][a-z0-9\+\#\.]*")


def tokenize(text: str) -> list[str]:
    """Lowercase, split on non-word chars, drop stopwords and 1-char tokens."""
    if not text:
        return []
    raw = _TOKEN_RE.findall(text.lower())
    return [t for t in raw if t not in STOPWORDS and len(t) > 1]


def ngrams(tokens: list[str], n_range: tuple[int, int] = (1, 3)) -> list[str]:
    """Contiguous n-grams over a token list. n-grams may not start/end on a
    stopword because stopwords are already removed from `tokens`."""
    lo, hi = n_range
    out: list[str] = []
    for n in range(lo, hi + 1):
        for i in range(len(tokens) - n + 1):
            out.append(" ".join(tokens[i : i + n]))
    return out


def company_keywords(
    company: Company,
    *,
    use_description: bool = True,
    n_range: tuple[int, int] = (1, 3),
) -> set[str]:
    """Distinct keyword phrases for a company (deduped per company so each
    company counts once toward a phrase's batch share)."""
    text = company.one_liner or ""
    if use_description:
        text = f"{text}. {company.raw.get('long_description') or ''}"
    return set(ngrams(tokenize(text), n_range))


def attach_keywords(
    companies: list[Company],
    *,
    use_description: bool = False,
    n_range: tuple[int, int] = (1, 3),
    min_doc_freq: int = 8,
) -> list[str]:
    """Compute keyword sets for every company and stash them on `company.tags`-
    style attribute `keywords` (so trend functions can read `field='keywords'`).

    Prunes rare phrases (appearing in < `min_doc_freq` companies) to cut noise.
    Returns the surviving vocabulary, sorted by document frequency desc.
    """
    per_company: list[set[str]] = []
    doc_freq: Counter = Counter()
    for c in companies:
        kws = company_keywords(c, use_description=use_description, n_range=n_range)
        per_company.append(kws)
        doc_freq.update(kws)

    vocab = {k for k, n in doc_freq.items() if n >= min_doc_freq}
    for c, kws in zip(companies, per_company):
        c.keywords = sorted(kws & vocab)
    return [k for k, _ in doc_freq.most_common() if k in vocab]
