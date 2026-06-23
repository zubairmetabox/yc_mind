// Splits data/ideas.md into discrete idea sections so each can get its own
// like/dislike controls. Expects "### N. Title" headings per idea (the format
// idea_gen.py / a Claude session writes them in) and an optional trailing
// "## Notes on methodology" section.

export type ParsedIdea = {
  id: string;
  number: number;
  title: string;
  body: string;
};

export type ParsedIdeas = {
  intro: string;
  ideas: ParsedIdea[];
  notes: string;
};

const IDEA_HEADING = /^###\s+(\d+)\.\s+(.+)$/;

export function parseIdeasMarkdown(markdown: string): ParsedIdeas {
  const lines = markdown.split("\n");
  const introLines: string[] = [];
  const ideas: ParsedIdea[] = [];
  const notesLines: string[] = [];

  let mode: "intro" | "idea" | "notes" = "intro";
  let current: { number: number; title: string; lines: string[] } | null = null;

  function flushIdea() {
    if (current) {
      ideas.push({
        id: `idea-${current.number}`,
        number: current.number,
        title: current.title,
        body: current.lines.join("\n").trim(),
      });
      current = null;
    }
  }

  for (const line of lines) {
    const headingMatch = line.match(IDEA_HEADING);
    const isNotesHeading = /^##\s+Notes/.test(line);

    if (headingMatch) {
      flushIdea();
      mode = "idea";
      current = { number: Number(headingMatch[1]), title: headingMatch[2], lines: [] };
      continue;
    }
    if (isNotesHeading) {
      flushIdea();
      mode = "notes";
      notesLines.push(line);
      continue;
    }

    if (mode === "intro") introLines.push(line);
    else if (mode === "idea" && current) current.lines.push(line);
    else if (mode === "notes") notesLines.push(line);
  }
  flushIdea();

  return {
    intro: introLines.join("\n").trim(),
    ideas,
    notes: notesLines.join("\n").trim(),
  };
}
