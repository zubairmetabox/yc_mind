"use client";

import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { LikeDislike } from "@/components/like-dislike";
import { FavoriteStar } from "@/components/favorite-star";
import type { CurationAction } from "@/lib/curation";
import type { ParsedIdea } from "@/lib/ideas-parser";

export function IdeaCard({
  idea,
  value,
  onChange,
  starred,
  onToggleFavorite,
}: {
  idea: ParsedIdea;
  value?: CurationAction;
  onChange: (action: CurationAction | "clear") => void;
  starred: boolean;
  onToggleFavorite: (starred: boolean) => void;
}) {
  return (
    <div className="rounded-[1.75rem] border border-border/80 bg-card p-5 shadow-sm sm:p-6">
      <div className="mb-2 flex items-start justify-between gap-3">
        <h2 className="min-w-0 text-base font-semibold text-foreground">
          {idea.number}. {idea.title}
        </h2>
        <div className="flex shrink-0 items-center gap-1">
          <FavoriteStar starred={starred} onToggle={onToggleFavorite} size="icon" />
          <LikeDislike value={value} onChange={onChange} size="icon" />
        </div>
      </div>
      <article className="prose-yc">
        <ReactMarkdown remarkPlugins={[remarkGfm]}>{idea.body}</ReactMarkdown>
      </article>
    </div>
  );
}
