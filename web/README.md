# YC_Mind — web dashboard

A mini dashboard for exploring the data the Python pipeline produces — works
both as a local dev tool and deployed on Vercel for use from a phone.

Styled to match Metabox's Vaultocrypt design system (same colour tokens, large
border-radius scale, Geist font, light/dark/system theme toggle). Mobile-first:
a bottom tab bar replaces the sidebar below the `lg` breakpoint, the Companies
table becomes a card list, and pagination is infinite-scroll.

**Live:** https://yc-mind.vercel.app (Vercel project `yc-mind`, team
`zubair-1657s-projects`)

## Local setup

```bash
pnpm install
pnpm dev      # http://localhost:3000 (or next available port)
```

Run the Python pipeline first (`../scripts/scrape_companies.py`,
`../scripts/build_trends.py`, `../scripts/build_idea_context.py`) so `../data/`
has something to read — see the repo root README. In local dev, `lib/data.ts`
reads straight from `../data/` (live, no rebuild needed when you re-run those
scripts) since that directory exists alongside this one in the monorepo.

## Deploying (data + storage)

Vercel only deploys this `web/` directory — `../data/` (the Python pipeline's
live output) and local `data/curation.json` aren't reachable from a deployed
serverless function. Two separate fixes for that, already wired in:

**1. Data snapshot.** `lib/data.ts` falls back to a bundled snapshot in
`./data/` (committed to git) when `../data/` doesn't exist — i.e. automatically
in production. To refresh the deployed dashboard after re-scraping locally:

```bash
pnpm sync-data        # copies ../data/*.csv + ideas.md into ./data
git add data/ && git commit -m "Refresh data snapshot"
git push
vercel --prod          # or let the Vercel git integration redeploy
```

**2. Curation storage — Vercel Blob.** `lib/curation.ts` uses a **private**
Vercel Blob store in production instead of writing to disk (serverless
functions can't durably write local files). Already set up and verified
(store `yc-mind-curation-private`, linked to this project).

Two real bugs surfaced and got fixed while wiring this up — worth knowing if
you ever touch this file:
- **Store access level is fixed at creation, not per-object.** A public-access
  store can't hold private objects; learned this from a hard failure, not docs.
- **Public blob URLs sit behind a CDN that doesn't reliably invalidate on
  overwrite** — writes didn't show up on an immediate read even with
  cache-busting query params. Switched to a private store (no public CDN path)
  and authenticate reads with the read-write token instead.
- **The bigger one: a single shared `curation.json` blob has a read-modify-write
  race.** Rating several items in quick succession (exactly the "rate while
  scrolling on my phone" use case) silently dropped earlier ratings — request
  B reads a snapshot from before request A's write lands, then overwrites it.
  Fixed by storing **each rating as its own blob object**
  (`curation/companies/{slug}.json`, `curation/ideas/{id}.json`,
  `curation/funding/{slug}.json`) instead of one shared document — concurrent
  writes to *different* items can never collide this way. `getCurationState()`
  lists + fetches all of them in parallel to assemble the same shape the rest
  of the app expects.

If `/api/curate` ever returns a `503`, it means `BLOB_READ_WRITE_TOKEN` isn't
set (e.g. a fresh project, or the store got disconnected) — reconnect via
Vercel dashboard → Storage, or `vercel integration resource connect <store-name> --yes`.

### Redeploying from the CLI

```bash
cd web
vercel --prod --yes
```
(Already linked to the `yc-mind` Vercel project via `vercel link`.)

## Pages

| Route | What it shows |
|---|---|
| `/` | Headline stats, companies-per-batch chart, top rising/falling theme preview |
| `/trends` | Field selector (themes / industry / tags / subindustry), share-over-time chart for the biggest movers, full movers table — click a row with a chevron to expand a written "why might this be moving" note |
| `/companies` | Full YC directory — search by name/one-liner/tag, filter by industry/batch, like/dislike each row, filter by rating, paginated |
| `/ideas` | Each generated idea as its own card with like/dislike, filterable by rating |

## Curation (like/dislike)

Ratings persist so a Claude session can read what got liked/disliked and
build curated lists or do targeted follow-up research (e.g. funding-history
lookups on a liked company) — without needing browser access. Fetch
`GET https://yc-mind.vercel.app/api/curate` (or read `data/curation.json`
locally) to get the current state as JSON, regardless of which backend is
behind it. Storage is dual-mode: a single shared `data/curation.json` locally
(no concurrency to worry about — one dev server), per-item Blob objects in
production (see "Deploying" above for why). `lib/curation.ts` is the only file
that reads/writes it; `POST /api/curate` is the only way the UI touches it.

Note: `/api/curate` has no auth — anyone with the URL can read or write
ratings. Fine for a single-user internal tool; revisit if this is ever shared.

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
