# YC_Mind

Mine Y Combinator's public company directory for **funding trends**, then
generate startup ideas aligned with what YC is funding more of.

This repo holds the Python data pipeline (this README) and a Next.js
exploration dashboard in [`web/`](web/README.md) — `cd web && pnpm dev` to
browse the current (and any future) data without touching Python.

> Planning / source-of-truth docs live in the parent `ZBrain/YC_Mind/`
> folder (`00_qa_log.md`, `01_planning.md`).

## How it works

The YC companies page (`ycombinator.com/companies`) is a React app backed by an
Algolia search index. We:

1. Scrape the current **public, restricted Algolia key** from the page (it
   rotates, so we read it at runtime rather than hardcoding).
2. Pull every company by **slicing on the `batch` facet** (Algolia caps offset
   pagination at 1,000 hits; each batch is well under that). ~6,000 companies.
3. Compute, per batch, the **share of companies** carrying each tag / industry,
   ordered chronologically — and the biggest risers/fallers ("movers").

No login, no paid API. Public data only.

## Setup

```bash
python -m venv .venv
.venv\Scripts\activate          # Windows (PowerShell: .venv\Scripts\Activate.ps1)
pip install -r requirements.txt
```

## Usage

```bash
# 1. Scrape the full directory -> data/companies.jsonl (+ companies.csv)
python scripts/scrape_companies.py

# 2. Build trend tables + print top movers
python scripts/build_trends.py --field tags     --recent 4 --baseline 8 --top 15
python scripts/build_trends.py --field industry --recent 4 --baseline 8 --top 10

# 3. Problem-space THEMES from descriptions (works on recent batches; tags don't)
python scripts/build_trends.py --field keywords --recent 4 --baseline 8 \
    --min-recent-share 0.01 --top 15
# add --use-description to mine long_description too (slower, broader vocab)

# 4. Stage 2: build the grounded idea-generation prompt (no API key needed)
python scripts/build_idea_context.py --recent 4 --baseline 8 --top-n 12 --num-ideas 8
# writes data/idea_prompt.md — paste into any Claude chat, or have Claude Code
# read it directly. See data/ideas.md for the first generated batch.
```

`--field keywords` extracts n-gram phrases (1–3 words) from company one-liners
(and optionally `long_description`), prunes rare ones (`--min-doc-freq`), and
trends each phrase's share-of-batch just like a tag. Because descriptions are
populated even for brand-new batches, this is the **reliable signal for what YC
is funding right now** — and it's the input the Stage 2 idea generator will use.

Outputs (in `data/`):

| File | Contents | Tracked in git? |
|---|---|---|
| `companies.jsonl` | Full raw Algolia hit per company (newline-delimited JSON) | No (regenerable) |
| `companies.csv` | Flattened scalar + list fields, one row per company | No (regenerable) |
| `trend_share_<field>.csv` | Batch × category, cells = share of batch (0–1) | No (regenerable) |
| `trend_counts_<field>.csv` | Batch × category, absolute counts | No (regenerable) |
| `trend_movers_<field>.csv` | baseline_share, recent_share, change per category | No (regenerable) |
| `idea_prompt.md` | Stage 2 grounded prompt (rising/falling themes + example companies) | **Yes** |
| `ideas.md` | Generated startup ideas from the prompt above | **Yes** |

The last two are tracked despite being in `data/` because they're not
deterministically regenerable — the prompt content depends on when it was
built, and the ideas are LLM output, not a deterministic scrape.

## Layout

```
src/yc_mind/
  algolia.py    # runtime credential scrape + Algolia query client
  models.py     # Company record + batch parsing (chronological sort key)
  scrape.py     # batch-sliced full fetch, save/load JSONL
  trends.py     # share-by-batch, counts-by-batch, movers
  keywords.py   # n-gram theme extraction from descriptions (--field keywords)
  idea_gen.py   # Stage 2: grounded context pack + prompt template
scripts/
  scrape_companies.py
  build_trends.py
  build_idea_context.py   # writes data/idea_prompt.md
data/          # scraped data + trend CSVs (gitignored, except idea_prompt.md / ideas.md)
```

## Data caveats (important)

- **Tag lag:** the `tags` field is applied to companies *after* a batch is
  announced. The two most recent batches average ~0.4–0.6 tags/company vs ~3
  historically, so raw `tags` shares are biased downward for recent batches and
  unreliable for trend conclusions on the newest 1–2 batches.
- **Prefer `industry` for recent batches:** the scalar `industry` field is
  100% populated across every batch, so it's the robust signal for "what's YC
  funding now." `tags`/`subindustry` are better for *finer* themes on older,
  fully-tagged batches.
- **Future batches:** the directory lists announced-but-unfilled future batches
  (only a handful of companies). `--min-size` (default 30) drops these.

## Roadmap

- **Stage 1 (done):** YC directory scrape + sector/tag/industry trend tables.
- **Stage 1.5 (done):** problem-space keyword/theme extraction from descriptions
  (`--field keywords`) — richer than raw tags, works on recent batches.
- **Stage 2 (done, v1):** Grounded prompt-building (`build_idea_context.py`)
  feeding idea generation by a Claude session — no API key, uses the Claude
  Code subscription rather than the API. First batch of 8 ideas in `data/ideas.md`.
- **Later sources:** YouTube transcripts, Twitter/X, LinkedIn.
- **Possible refinements:** semantic clustering of keyword n-grams (current
  approach counts e.g. "ai agents" / "agentic" / "autonomous" as separate
  phrases even though they're one theme); scheduled re-runs to track theme
  drift over time instead of a single snapshot.
