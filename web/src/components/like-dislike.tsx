"use client";

import { ThumbsUp, ThumbsDown } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import type { CurationAction } from "@/lib/curation";

export function LikeDislike({
  value,
  onChange,
  size = "sm",
}: {
  value?: CurationAction;
  onChange: (action: CurationAction | "clear") => void;
  size?: "sm" | "icon";
}) {
  return (
    <div className="flex items-center gap-1.5">
      <Button
        type="button"
        size="icon"
        variant="ghost"
        aria-label="Like"
        onClick={() => onChange(value === "like" ? "clear" : "like")}
        className={cn(
          size === "sm" ? "size-8" : "size-10",
          "rounded-[0.85rem]",
          value === "like" && "bg-emerald-500/15 text-emerald-500",
        )}
      >
        <ThumbsUp className={size === "sm" ? "size-4" : "size-5"} />
      </Button>
      <Button
        type="button"
        size="icon"
        variant="ghost"
        aria-label="Dislike"
        onClick={() => onChange(value === "dislike" ? "clear" : "dislike")}
        className={cn(
          size === "sm" ? "size-8" : "size-10",
          "rounded-[0.85rem]",
          value === "dislike" && "bg-rose-500/15 text-rose-500",
        )}
      >
        <ThumbsDown className={size === "sm" ? "size-4" : "size-5"} />
      </Button>
    </div>
  );
}
