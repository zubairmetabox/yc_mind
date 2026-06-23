"use client";

import { useCallback, useState } from "react";
import type { CurationAction, CurationType } from "@/lib/curation";

export function useCuration(type: CurationType, initial: Record<string, CurationAction>) {
  const [map, setMap] = useState<Record<string, CurationAction>>(initial);

  const setAction = useCallback(
    (id: string, action: CurationAction | "clear") => {
      setMap((prev) => {
        const next = { ...prev };
        if (action === "clear") delete next[id];
        else next[id] = action;
        return next;
      });
      fetch("/api/curate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ type, id, action }),
      }).catch(() => {
        // best-effort — optimistic update already applied; a failed write
        // just means the next full page load will reset it
      });
    },
    [type],
  );

  return { map, setAction };
}
