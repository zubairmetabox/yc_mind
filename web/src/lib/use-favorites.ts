"use client";

import { useCallback, useState } from "react";
import { toast } from "sonner";
import type { CurationType } from "@/lib/curation";

export function useFavorites(type: CurationType, initial: string[]) {
  const [set, setSet] = useState<Set<string>>(new Set(initial));

  const toggle = useCallback(
    (id: string, starred: boolean) => {
      setSet((prev) => {
        const next = new Set(prev);
        if (starred) next.add(id);
        else next.delete(id);
        return next;
      });

      fetch("/api/favorite", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ type, id, starred }),
      })
        .then(async (res) => {
          if (res.ok) return;
          setSet((prev) => {
            const next = new Set(prev);
            if (starred) next.delete(id);
            else next.add(id);
            return next;
          });
          const body = await res.json().catch(() => null);
          toast.error(body?.error ?? "Couldn't save that favorite — please try again.");
        })
        .catch(() => {
          setSet((prev) => {
            const next = new Set(prev);
            if (starred) next.delete(id);
            else next.add(id);
            return next;
          });
          toast.error("Couldn't save that favorite — check your connection and try again.");
        });
    },
    [type],
  );

  return { favorites: set, toggle };
}
