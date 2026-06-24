"use client";

import { Star } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export function FavoriteStar({
  starred,
  onToggle,
  size = "sm",
}: {
  starred: boolean;
  onToggle: (starred: boolean) => void;
  size?: "sm" | "icon";
}) {
  return (
    <Button
      type="button"
      size="icon"
      variant="ghost"
      aria-label={starred ? "Remove from favorites" : "Add to favorites"}
      onClick={() => onToggle(!starred)}
      className={cn(
        size === "sm" ? "size-8" : "size-10",
        "rounded-[0.85rem]",
        starred && "text-amber-400",
      )}
    >
      <Star className={cn(size === "sm" ? "size-4" : "size-5", starred && "fill-amber-400")} />
    </Button>
  );
}
