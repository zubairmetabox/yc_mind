"use client";

import { useCallback, useState } from "react";
import { toast } from "sonner";
import type { CurationAction, CurationType } from "@/lib/curation";

export function useCuration(type: CurationType, initial: Record<string, CurationAction>) {
  const [map, setMap] = useState<Record<string, CurationAction>>(initial);

  const setAction = useCallback(
    (id: string, action: CurationAction | "clear") => {
      const previous = map[id];

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
      })
        .then(async (res) => {
          if (res.ok) return;
          // Roll back the optimistic update — it didn't actually save.
          setMap((prev) => {
            const next = { ...prev };
            if (previous) next[id] = previous;
            else delete next[id];
            return next;
          });
          const body = await res.json().catch(() => null);
          toast.error(body?.error ?? "Couldn't save that rating — please try again.");
        })
        .catch(() => {
          setMap((prev) => {
            const next = { ...prev };
            if (previous) next[id] = previous;
            else delete next[id];
            return next;
          });
          toast.error("Couldn't save that rating — check your connection and try again.");
        });
    },
    [type, map],
  );

  return { map, setAction };
}
