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
| `/trends` | Field selector (themes / industry / tags / subindustry), share-over-time chart for the biggest movers, full sortable/filterable movers table |
| `/companies` | Full YC directory — search by name/one-liner/tag, filter by industry/batch, paginated |
| `/ideas` | Renders `data/ideas.md` (the Stage 2 generated startup ideas) |

## Notes

- All data pages are `force-dynamic` — they re-read the data files on every
  request, so re-running the Python scripts updates the dashboard live.
- `lib/data.ts` is the only place that touches the filesystem; everything else
  is presentation. If a new trend field or CSV shape gets added on the Python
  side, that's the file to extend.
- `lib/trend-fields.ts` is split out from `lib/data.ts` purely so client
  components (the field selector) can import the field list without pulling
  `node:fs` into the browser bundle.
