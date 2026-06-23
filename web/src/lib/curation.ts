import fs from "node:fs";
import path from "node:path";

// Persisted to data/curation.json (tracked in git, not regenerable) so a
// Claude session reading the repo can see what Zubair liked/disliked and
// build curated lists from it — this can't live in browser localStorage.
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

export function getCurationState(): CurationState {
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

export function setCuration(
  type: CurationType,
  id: string,
  action: CurationAction | "clear",
): CurationState {
  const state = getCurationState();
  const bucket = type === "company" ? state.companies : state.ideas;

  if (action === "clear") {
    delete bucket[id];
  } else {
    bucket[id] = action;
  }

  fs.mkdirSync(DATA_DIR, { recursive: true });
  fs.writeFileSync(FILE_PATH, JSON.stringify(state, null, 2) + "\n", "utf-8");
  return state;
}

// Used for targeted funding lookups (e.g. a Claude session researching a
// liked company on request) — not bulk-populated.
export function setFundingNote(companySlug: string, note: FundingNote): CurationState {
  const state = getCurationState();
  state.fundingNotes[companySlug] = note;
  fs.mkdirSync(DATA_DIR, { recursive: true });
  fs.writeFileSync(FILE_PATH, JSON.stringify(state, null, 2) + "\n", "utf-8");
  return state;
}
