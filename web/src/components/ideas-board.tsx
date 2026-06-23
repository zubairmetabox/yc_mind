"use client";

import { useMemo, useState } from "react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { Button } from "@/components/ui/button";
import { IdeaCard } from "@/components/idea-card";
import { useCuration } from "@/lib/use-curation";
import type { CurationAction } from "@/lib/curation";
import type { ParsedIdeas } from "@/lib/ideas-parser";

type Filter = "all" | "liked" | "disliked" | "unrated";

export function IdeasBoard({
  parsed,
  initialCuration,
}: {
  parsed: ParsedIdeas;
  initialCuration: Record<string, CurationAction>;
}) {
  const [filter, setFilter] = useState<Filter>("all");
  const { map: curation, setAction } = useCuration("idea", initialCuration);

  const visible = useMemo(() => {
    return parsed.ideas.filter((idea) => {
      const rating = curation[idea.id];
      if (filter === "liked") return rating === "like";
      if (filter === "disliked") return rating === "dislike";
      if (filter === "unrated") return !rating;
      return true;
    });
  }, [parsed.ideas, curation, filter]);

  const likedCount = Object.values(curation).filter((v) => v === "like").length;
  const dislikedCount = Object.values(curation).filter((v) => v === "dislike").length;

  return (
    <div className="flex flex-col gap-6">
      {parsed.intro && (
        <article className="prose-yc rounded-[1.75rem] border border-border/80 bg-card p-5 shadow-sm sm:p-6">
          <ReactMarkdown remarkPlugins={[remarkGfm]}>{parsed.intro}</ReactMarkdown>
        </article>
      )}

      <div className="flex flex-wrap items-center gap-2">
        {(
          [
            { value: "all", label: "All" },
            { value: "liked", label: `Liked (${likedCount})` },
            { value: "disliked", label: `Disliked (${dislikedCount})` },
            { value: "unrated", label: "Unrated" },
          ] as { value: Filter; label: string }[]
        ).map((opt) => (
          <Button
            key={opt.value}
            type="button"
            size="sm"
            variant={filter === opt.value ? "default" : "outline"}
            className="rounded-[1.25rem]"
            onClick={() => setFilter(opt.value)}
          >
            {opt.label}
          </Button>
        ))}
      </div>

      <div className="flex flex-col gap-4">
        {visible.map((idea) => (
          <IdeaCard
            key={idea.id}
            idea={idea}
            value={curation[idea.id]}
            onChange={(action) => setAction(idea.id, action)}
          />
        ))}
        {visible.length === 0 && (
          <p className="py-8 text-center text-sm text-muted-foreground">
            No ideas match this filter yet.
          </p>
        )}
      </div>

      {parsed.notes && (
        <article className="prose-yc rounded-[1.75rem] border border-border/80 bg-card p-5 shadow-sm sm:p-6">
          <ReactMarkdown remarkPlugins={[remarkGfm]}>{parsed.notes}</ReactMarkdown>
        </article>
      )}
    </div>
  );
}
