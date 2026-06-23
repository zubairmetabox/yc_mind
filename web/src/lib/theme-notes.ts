/**
 * Qualitative "why is this rising/falling" analysis for the most significant
 * keyword themes. This is Claude's reasoning about the AI/VC market, NOT
 * derived from the scraped data — the YC directory has no causal information
 * (no investor quotes, no check sizes). Treat as informed opinion to argue
 * with, not as ground truth. Written 2026-06-23; themes drift, revisit.
 */
export const THEME_NOTES: Record<string, string> = {
  agents:
    "The broadest container term for the agent wave below. Rising because LLM reasoning crossed a threshold (mid-2025-ish) where multi-step, tool-using task execution became reliable enough to sell — not just chat. Crowded: this is the single most competitive category in current YC batches, which cuts against \"easy to get funded here.\"",
  "ai agents":
    "Same wave as 'agents', more explicit framing. High share-of-batch means YC partners are pattern-matching hard on this pitch — good for proving market exists, bad for differentiation. The real opportunity is usually one layer down: which *specific* workflow does the agent replace, for whom.",
  agentic:
    "Adjective form, often paired with 'operating system' or a specific back-office function. Rising fast off a small base — suggests it's becoming the preferred way to describe agent-driven workflow automation as distinct from a chatbot wrapper. Less crowded than 'agents' itself.",
  autonomous:
    "Distinct from 'agentic' in degree — implies less human-in-the-loop, more end-to-end. Current examples lean toward generic 'autonomous research' labs rather than a vertical wedge; the gap is autonomous capability applied to one named, billable workflow (see idea_gen.py output for examples).",
  infrastructure:
    "Classic second-wave signal: once enough companies build agents, a market opens for the plumbing underneath them (reliability, billing, observability). Rising because the first wave of agent startups is now big enough to need this. Risk: infra plays are slower to monetize and easy to commoditize unless tied to a specific compliance/regulatory wedge.",
  layer:
    "Almost always paired with 'AI' or 'agent' — a positioning word for infra/middleware plays. Worth checking what's *underneath* the layer (whose problem does it actually solve) rather than treating the word itself as a signal.",
  drones:
    "Two distinct sub-trends bundled under one tag: (1) defense/dual-use, riding the broader 2025-26 defense-tech funding surge, and (2) novelty/agri use cases. The unclaimed middle is heavily-regulated industrial inspection (pipelines, towers, utilities) — boring, but budget-backed by compliance requirements rather than venture optimism.",
  firm:
    "The most interesting structural signal in this data: AI-native companies positioning themselves as the actual professional-services firm (accounting, appraisal, real estate) rather than software sold to one. This works because the regulated-services market has high fees and low software perception risk — the firm absorbs the AI failure risk instead of selling a tool the incumbent has to trust blindly.",
  law:
    "Tracks the broader legal-AI funding wave (contract review, compliance, IP) — legal services are billable-hour-heavy and structurally similar to the 'firm' pattern above. Less crowded than fintech/healthcare AI because compliance risk has kept incumbents slow to adopt internally.",
  real:
    "Mostly a fragment of 'real estate' and 'real-time' / 'real economy' — not a coherent theme on its own. Don't over-read this one; it's an artifact of the n-gram extraction, not a market signal.",
  open:
    "Falling — open-source AI tooling (open-source agent frameworks, open models) is cooling as a *pitch*, likely because open-source is increasingly table-stakes infrastructure rather than a fundable differentiator on its own. Doesn't mean open-source itself is dying — it means 'we're open source' stopped being enough of a story.",
  api:
    "Falling — 'give developers an API' as the core pitch is cooling in favor of agent-native or vertical-firm framing (see 'firm' above). Read this alongside 'agents' rising: the market is shifting from selling building blocks to selling outcomes.",
  code:
    "Falling — coding-agent/dev-tools pitches are likely saturated after the 2024-25 wave (Cursor-likes, Devin-likes); the remaining whitespace is narrow and already crowded with well-funded incumbents.",
  voice:
    "Falling slightly but not dying — voice AI is maturing into a known, somewhat-commoditized capability rather than a novel pitch. Still funded when paired with a specific vertical (debt collection, restaurant ordering) rather than 'voice AI' alone.",
};

export function getThemeNote(theme: string): string | undefined {
  return THEME_NOTES[theme.toLowerCase()];
}
