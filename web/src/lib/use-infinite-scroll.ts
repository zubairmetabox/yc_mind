"use client";

import { useCallback, useEffect, useRef, useState } from "react";

/**
 * Reveals more of an already-loaded array as the user scrolls, instead of
 * paged Previous/Next buttons. All `items` are already in memory (this is a
 * client-side dataset, not server pagination) — this just limits how many
 * rows get mounted into the DOM at once and grows that limit when a sentinel
 * element at the bottom of the list scrolls into view.
 */
export function useInfiniteScroll(totalCount: number, pageSize: number) {
  const [visibleCount, setVisibleCount] = useState(pageSize);
  const sentinelRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    const el = sentinelRef.current;
    if (!el) return;
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0]?.isIntersecting) {
          setVisibleCount((v) => Math.min(v + pageSize, totalCount || v + pageSize));
        }
      },
      { rootMargin: "400px" },
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, [pageSize, totalCount]);

  const reset = useCallback(() => setVisibleCount(pageSize), [pageSize]);

  return {
    visibleCount: Math.min(visibleCount, totalCount),
    sentinelRef,
    reset,
    hasMore: visibleCount < totalCount,
  };
}
