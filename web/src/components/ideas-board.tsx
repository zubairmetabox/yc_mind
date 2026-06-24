"use client";

import { useMemo, useState } from "react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { Button } from "@/components/ui/button";
import { IdeaCard } from "@/components/idea-card";
import { useCuration } from "@/lib/use-curation";
import { useFavorites } from "@/lib/use-favorites";
import type { CurationAction } from "@/lib/curation";
import type { ParsedIdeas } from "@/lib/ideas-parser";

type Filter = "all" | "liked" | "disliked" | "neutral" | "favorites" | "unrated";

export function IdeasBoard({
  parsed,
  initialCuration,
  initialFavorites,
}: {
  parsed: ParsedIdeas;
  initialCuration: Record<string, CurationAction>;
  initialFavorites: string[];
}) {
  const [filter, setFilter] = useState<Filter>("all");
  const { map: curation, setAction } = useCuration("idea", initialCuration);
  const { favorites, toggle: toggleFavorite } = useFavorites("idea", initialFavorites);

  const visible = useMemo(() => {
    return parsed.ideas.filter((idea) => {
      const rating = curation[idea.id];
      if (filter === "liked") return rating === "like";
      if (filter === "disliked") return rating === "dislike";
      if (filter === "neutral") return rating === "neutral";
      if (filter === "favorites") return favorites.has(idea.id);
      if (filter === "unrated") return !rating;
      return true;
    });
  }, [parsed.ideas, curation, favorites, filter]);

  const likedCount = Object.values(curation).filter((v) => v === "like").length;
  const dislikedCount = Object.values(curation).filter((v) => v === "dislike").length;
  const neutralCount = Object.values(curation).filter((v) => v === "neutral").length;
  const favoritesCount = favorites.size;

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
            { value: "neutral", label: `Neutral (${neutralCount})` },
            { value: "disliked", label: `Disliked (${dislikedCount})` },
            { value: "favorites", label: `★ Favorites (${favoritesCount})` },
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
            starred={favorites.has(idea.id)}
            onToggleFavorite={(starred) => toggleFavorite(idea.id, starred)}
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
