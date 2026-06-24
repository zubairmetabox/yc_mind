import fs from "node:fs";
import path from "node:path";
import { del, list, put } from "@vercel/blob";

// Two storage backends, picked automatically:
//
// - Local dev: data/curation.json on disk (../data, alongside the Python
//   pipeline's output) — a single shared file is fine here (one dev server,
//   no concurrent writers), and a Claude session can read it directly.
// - Deployed (Vercel): Vercel Blob, via BLOB_READ_WRITE_TOKEN (auto-injected
//   once a private Blob store is connected). Each rating is its OWN object
//   (curation/companies/{slug}.json, not one shared curation.json) —
//   discovered the hard way that a single read-modify-write document loses
//   updates when ratings happen in quick succession (e.g. liking several
//   companies while scrolling on a phone): request B reads a snapshot from
//   before request A's write lands, then overwrites it, silently dropping
//   A's rating. Per-item objects mean concurrent ratings on different items
//   can never collide — only re-rating the exact same item twice in the same
//   instant races, which is an acceptable, harmless last-write-wins.
const useBlob = Boolean(process.env.BLOB_READ_WRITE_TOKEN);

const DATA_DIR = path.join(process.cwd(), "..", "data");
const FILE_PATH = path.join(DATA_DIR, "curation.json");

export type CurationAction = "like" | "dislike";
export type CurationType = "company" | "idea";

export type FundingNote = {
  // Filled in on demand (e.g. by a Claude session doing a targeted lookup
  // after a company gets liked) — not bulk-scraped. See web/README.md.
  summary: string;
  source?: string;
  updatedAt: string;
};

export type CurationState = {
  companies: Record<string, CurationAction>;
  ideas: Record<string, CurationAction>;
  fundingNotes: Record<string, FundingNote>;
};

const EMPTY_STATE: CurationState = { companies: {}, ideas: {}, fundingNotes: {} };

function blobAuthHeaders(): HeadersInit {
  return { Authorization: `Bearer ${process.env.BLOB_READ_WRITE_TOKEN}` };
}

function ratingPathname(type: CurationType, id: string): string {
  const bucket = type === "company" ? "companies" : "ideas";
  return `curation/${bucket}/${encodeURIComponent(id)}.json`;
}

function fundingPathname(companySlug: string): string {
  return `curation/funding/${encodeURIComponent(companySlug)}.json`;
}

async function fetchJson<T>(url: string): Promise<T | null> {
  try {
    const res = await fetch(url, { cache: "no-store", headers: blobAuthHeaders() });
    if (!res.ok) return null;
    return (await res.json()) as T;
  } catch {
    return null;
  }
}

async function listAndFetch<T>(prefix: string): Promise<Record<string, T>> {
  const out: Record<string, T> = {};
  const { blobs } = await list({ prefix, mode: "expanded" });
  const entries = await Promise.all(
    blobs.map(async (b) => {
      const id = decodeURIComponent(b.pathname.slice(prefix.length, -".json".length));
      const value = await fetchJson<T>(b.url);
      return value ? ([id, value] as const) : null;
    }),
  );
  for (const entry of entries) {
    if (entry) out[entry[0]] = entry[1];
  }
  return out;
}

async function readState(): Promise<CurationState> {
  if (useBlob) {
    try {
      const [companies, ideas, fundingNotes] = await Promise.all([
        listAndFetch<{ action: CurationAction }>("curation/companies/"),
        listAndFetch<{ action: CurationAction }>("curation/ideas/"),
        listAndFetch<FundingNote>("curation/funding/"),
      ]);
      return {
        companies: Object.fromEntries(
          Object.entries(companies).map(([id, v]) => [id, v.action]),
        ),
        ideas: Object.fromEntries(Object.entries(ideas).map(([id, v]) => [id, v.action])),
        fundingNotes,
      };
    } catch {
      return EMPTY_STATE;
    }
  }

  if (!fs.existsSync(FILE_PATH)) return EMPTY_STATE;
  try {
    const raw = JSON.parse(fs.readFileSync(FILE_PATH, "utf-8"));
    return {
      companies: raw.companies ?? {},
      ideas: raw.ideas ?? {},
      fundingNotes: raw.fundingNotes ?? {},
    };
  } catch {
    return EMPTY_STATE;
  }
}

function writeLocalState(mutate: (state: CurationState) => void): CurationState {
  const state = fs.existsSync(FILE_PATH)
    ? (() => {
        try {
          const raw = JSON.parse(fs.readFileSync(FILE_PATH, "utf-8"));
          return {
            companies: raw.companies ?? {},
            ideas: raw.ideas ?? {},
            fundingNotes: raw.fundingNotes ?? {},
          };
        } catch {
          return { companies: {}, ideas: {}, fundingNotes: {} };
        }
      })()
    : { companies: {}, ideas: {}, fundingNotes: {} };

  mutate(state);
  fs.mkdirSync(DATA_DIR, { recursive: true });
  fs.writeFileSync(FILE_PATH, JSON.stringify(state, null, 2) + "\n", "utf-8");
  return state;
}

export async function getCurationState(): Promise<CurationState> {
  return readState();
}

export async function setCuration(
  type: CurationType,
  id: string,
  action: CurationAction | "clear",
): Promise<CurationState> {
  if (useBlob) {
    const pathname = ratingPathname(type, id);
    if (action === "clear") {
      await del(pathname).catch(() => {});
    } else {
      await put(pathname, JSON.stringify({ action }), {
        access: "private",
        addRandomSuffix: false,
        allowOverwrite: true,
        contentType: "application/json",
      });
    }
    return readState();
  }

  return writeLocalState((state) => {
    const bucket = type === "company" ? state.companies : state.ideas;
    if (action === "clear") delete bucket[id];
    else bucket[id] = action;
  });
}

// Used for targeted funding lookups (e.g. a Claude session researching a
// liked company on request) — not bulk-populated.
export async function setFundingNote(
  companySlug: string,
  note: FundingNote,
): Promise<CurationState> {
  if (useBlob) {
    await put(fundingPathname(companySlug), JSON.stringify(note), {
      access: "private",
      addRandomSuffix: false,
      allowOverwrite: true,
      contentType: "application/json",
    });
    return readState();
  }

  return writeLocalState((state) => {
    state.fundingNotes[companySlug] = note;
  });
}
