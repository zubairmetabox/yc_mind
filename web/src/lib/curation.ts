import fs from "node:fs";
import path from "node:path";
import { list, put } from "@vercel/blob";

// Two storage backends, picked automatically:
//
// - Local dev: data/curation.json on disk (../data, alongside the Python
//   pipeline's output) — a Claude session reading the repo can see ratings
//   directly without needing network access.
// - Deployed (Vercel): Vercel Blob, via BLOB_READ_WRITE_TOKEN (auto-injected
//   once Blob storage is enabled on the project). Serverless functions can't
//   durably write to local disk, so this is required for ratings to persist
//   when used from a phone against the deployed app.
const BLOB_PATHNAME = "curation.json";
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

async function readState(): Promise<CurationState> {
  if (useBlob) {
    try {
      const { blobs } = await list({ prefix: BLOB_PATHNAME, limit: 1 });
      if (blobs.length === 0) return EMPTY_STATE;
      const res = await fetch(blobs[0].url, { cache: "no-store" });
      if (!res.ok) return EMPTY_STATE;
      const raw = await res.json();
      return {
        companies: raw.companies ?? {},
        ideas: raw.ideas ?? {},
        fundingNotes: raw.fundingNotes ?? {},
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

async function writeState(state: CurationState): Promise<void> {
  const json = JSON.stringify(state, null, 2);
  if (useBlob) {
    await put(BLOB_PATHNAME, json, {
      access: "public",
      addRandomSuffix: false,
      allowOverwrite: true,
      contentType: "application/json",
    });
    return;
  }

  fs.mkdirSync(DATA_DIR, { recursive: true });
  fs.writeFileSync(FILE_PATH, json + "\n", "utf-8");
}

export async function getCurationState(): Promise<CurationState> {
  return readState();
}

export async function setCuration(
  type: CurationType,
  id: string,
  action: CurationAction | "clear",
): Promise<CurationState> {
  const state = await readState();
  const bucket = type === "company" ? state.companies : state.ideas;

  if (action === "clear") {
    delete bucket[id];
  } else {
    bucket[id] = action;
  }

  await writeState(state);
  return state;
}

// Used for targeted funding lookups (e.g. a Claude session researching a
// liked company on request) — not bulk-populated.
export async function setFundingNote(
  companySlug: string,
  note: FundingNote,
): Promise<CurationState> {
  const state = await readState();
  state.fundingNotes[companySlug] = note;
  await writeState(state);
  return state;
}
