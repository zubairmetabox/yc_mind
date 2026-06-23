# YC_Mind — web dashboard

A mini dashboard for exploring the data the Python pipeline produces (and any
future re-runs of it) — no rebuild needed when the data changes, since every
page reads straight from `../data/*.csv` / `*.jsonl` / `.md` at request time.

Styled to match Metabox's Vaultocrypt design system (same colour tokens, large
border-radius scale, Geist font, light/dark/system theme toggle).

## Setup

```bash
pnpm install
pnpm dev      # http://localhost:3000 (or next available port)
```

Run the Python pipeline first (`../scripts/scrape_companies.py`,
`../scripts/build_trends.py`, `../scripts/build_idea_context.py`) so `../data/`
has something to read — see the repo root README.

## Pages

| Route | What it shows |
|---|---|
| `/` | Headline stats, companies-per-batch chart, top rising/falling theme preview |
| `/trends` | Field selector (themes / industry / tags / subindustry), share-over-time chart for the biggest movers, full movers table — click a row with a chevron to expand a written "why might this be moving" note |
| `/companies` | Full YC directory — search by name/one-liner/tag, filter by industry/batch, like/dislike each row, filter by rating, paginated |
| `/ideas` | Each generated idea as its own card with like/dislike, filterable by rating |

## Curation (like/dislike)

Ratings persist to `data/curation.json` (tracked in git, not gitignored like
the regenerable scrape/trend CSVs) so a Claude session can read what got
liked/disliked and build curated lists or do targeted follow-up research
(e.g. funding-history lookups on a liked company) without needing browser
access. `lib/curation.ts` is the only file that reads/writes it;
`POST /api/curate` is the only way the UI touches it.

## "Why is this rising" notes

`lib/theme-notes.ts` holds short qualitative write-ups for the most
significant themes — **this is analysis, not data**. The YC directory has no
causal information (no investor quotes, no check sizes), so any explanation of
*why* a theme is moving is reasoning about the AI/VC market, written by
whichever Claude session last touched it. Treat it as a starting argument, not
ground truth — update it as the market narrative changes.

## Notes

- All data pages are `force-dynamic` — they re-read the data files on every
  request, so re-running the Python scripts updates the dashboard live.
- `lib/data.ts` is the only place that touches scrape/trend files; `lib/curation.ts`
  is the only place that touches curation state. Everything else is presentation.
- `lib/trend-fields.ts` is split out from `lib/data.ts` purely so client
  components (the field selector) can import the field list without pulling
  `node:fs` into the browser bundle.
- **No bulk funding-data source is wired in** — YC's public directory has no
  money fields at all (checked: `stage` is just "Early"/"Growth", `status` is
  just Active/Inactive/Acquired/Public). Per Zubair's call, funding-history
  lookups happen one company at a time, on request, after it gets liked —
  not a bulk scrape/API integration. See `01_planning.md` in the parent folder
  for the reasoning.
