"use client";

import { Fragment, useEffect, useMemo, useState } from "react";
import {
  Search,
  ExternalLink,
  DollarSign,
  ChevronDown,
  ChevronRight,
  ArrowUp,
  ArrowDown,
  ArrowUpDown,
  Loader2,
} from "lucide-react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { LikeDislike } from "@/components/like-dislike";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { useCuration } from "@/lib/use-curation";
import { useInfiniteScroll } from "@/lib/use-infinite-scroll";
import type { CurationAction, FundingNote } from "@/lib/curation";
import { batchSortKey } from "@/lib/batch-sort";
import { cn } from "@/lib/utils";

export type SlimCompany = {
  name: string;
  slug: string;
  batch: string;
  status: string;
  industry: string;
  one_liner: string;
  website: string;
  tags: string[];
};

const PAGE_SIZE = 50;
const ALL = "__all__";
type CurationFilter = "all" | "liked" | "disliked" | "unrated";
type SortKey = "name" | "batch" | "industry" | "status";
type SortDir = "asc" | "desc";

const SORT_GETTERS: Record<SortKey, (c: SlimCompany) => number | string> = {
  name: (c) => c.name.toLowerCase(),
  batch: (c) => batchSortKey(c.batch),
  industry: (c) => c.industry.toLowerCase(),
  status: (c) => c.status.toLowerCase(),
};

function SortableHead({
  label,
  sortKey,
  active,
  dir,
  onSort,
}: {
  label: string;
  sortKey: SortKey;
  active: SortKey | null;
  dir: SortDir;
  onSort: (key: SortKey) => void;
}) {
  const isActive = active === sortKey;
  const Icon = isActive ? (dir === "asc" ? ArrowUp : ArrowDown) : ArrowUpDown;
  return (
    <TableHead>
      <button
        type="button"
        onClick={() => onSort(sortKey)}
        className={cn(
          "flex items-center gap-1 text-left font-medium transition-colors hover:text-foreground",
          isActive ? "text-foreground" : "text-muted-foreground",
        )}
      >
        {label}
        <Icon className="size-3" />
      </button>
    </TableHead>
  );
}

function FundingButton({
  note,
  isOpen,
  onToggle,
}: {
  note?: FundingNote;
  isOpen: boolean;
  onToggle: () => void;
}) {
  if (!note) {
    return (
      <span title="Not researched yet — ask Claude to look this one up">
        <ChevronRight className="size-3.5 opacity-0" />
      </span>
    );
  }
  return (
    <Button
      type="button"
      size="icon"
      variant="ghost"
      aria-label="Toggle funding note"
      className="size-7 rounded-[0.85rem] text-emerald-500"
      onClick={onToggle}
    >
      {isOpen ? <ChevronDown className="size-3.5" /> : <DollarSign className="size-3.5" />}
    </Button>
  );
}

function FundingDetail({ note }: { note: FundingNote }) {
  return (
    <div className="text-sm">
      <p className="mb-1 text-xs font-medium uppercase tracking-wide text-muted-foreground/80">
        Funding research — {new Date(note.updatedAt).toLocaleDateString()}
      </p>
      <p className="text-foreground">{note.summary}</p>
      {note.source && (
        <a
          href={note.source}
          target="_blank"
          rel="noopener noreferrer"
          className="mt-1 inline-block text-xs text-primary underline"
        >
          Source
        </a>
      )}
    </div>
  );
}

export function CompaniesExplorer({
  companies,
  initialCuration,
  fundingNotes,
}: {
  companies: SlimCompany[];
  initialCuration: Record<string, CurationAction>;
  fundingNotes: Record<string, FundingNote>;
}) {
  const [query, setQuery] = useState("");
  const [industry, setIndustry] = useState(ALL);
  const [batch, setBatch] = useState(ALL);
  const [status, setStatus] = useState(ALL);
  const [curationFilter, setCurationFilter] = useState<CurationFilter>("all");
  const [sortKey, setSortKey] = useState<SortKey | null>(null);
  const [sortDir, setSortDir] = useState<SortDir>("asc");
  const [expandedFunding, setExpandedFunding] = useState<string | null>(null);
  const { map: curation, setAction } = useCuration("company", initialCuration);

  const industries = useMemo(
    () => Array.from(new Set(companies.map((c) => c.industry).filter(Boolean))).sort(),
    [companies],
  );
  const batches = useMemo(
    () =>
      Array.from(new Set(companies.map((c) => c.batch).filter(Boolean))).sort(
        (a, b) => batchSortKey(a) - batchSortKey(b),
      ),
    [companies],
  );
  const statuses = useMemo(
    () => Array.from(new Set(companies.map((c) => c.status).filter(Boolean))).sort(),
    [companies],
  );

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    const result = companies.filter((c) => {
      if (industry !== ALL && c.industry !== industry) return false;
      if (batch !== ALL && c.batch !== batch) return false;
      if (status !== ALL && c.status !== status) return false;
      const rating = curation[c.slug];
      if (curationFilter === "liked" && rating !== "like") return false;
      if (curationFilter === "disliked" && rating !== "dislike") return false;
      if (curationFilter === "unrated" && rating) return false;
      if (!q) return true;
      return (
        c.name.toLowerCase().includes(q) ||
        c.one_liner.toLowerCase().includes(q) ||
        c.tags.some((t) => t.toLowerCase().includes(q))
      );
    });

    if (sortKey) {
      const getter = SORT_GETTERS[sortKey];
      result.sort((a, b) => {
        const av = getter(a);
        const bv = getter(b);
        const cmp = typeof av === "number" && typeof bv === "number" ? av - bv : String(av).localeCompare(String(bv));
        return sortDir === "asc" ? cmp : -cmp;
      });
    }

    return result;
  }, [companies, query, industry, batch, status, curationFilter, curation, sortKey, sortDir]);

  const { visibleCount, sentinelRef, reset, hasMore } = useInfiniteScroll(filtered.length, PAGE_SIZE);
  const visibleItems = filtered.slice(0, visibleCount);

  // Re-show only the first page whenever the result set changes shape.
  useEffect(() => {
    reset();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [query, industry, batch, status, curationFilter, sortKey, sortDir]);

  const likedCount = Object.values(curation).filter((v) => v === "like").length;
  const dislikedCount = Object.values(curation).filter((v) => v === "dislike").length;

  function handleSort(key: SortKey) {
    if (sortKey === key) {
      setSortDir((d) => (d === "asc" ? "desc" : "asc"));
    } else {
      setSortKey(key);
      setSortDir("asc");
    }
  }

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-col gap-3 sm:flex-row">
        <div className="flex flex-1 items-center gap-2 rounded-[1.25rem] border border-border/70 bg-secondary/60 px-3 py-2">
          <Search className="size-4 text-muted-foreground" />
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search name, one-liner, or tag…"
            className="flex-1 bg-transparent text-sm text-foreground outline-none placeholder:text-muted-foreground"
          />
        </div>
        <Select value={industry} onValueChange={setIndustry}>
          <SelectTrigger className="w-full rounded-[1.25rem] sm:w-[200px]">
            <SelectValue placeholder="Industry" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value={ALL}>All industries</SelectItem>
            {industries.map((i) => (
              <SelectItem key={i} value={i}>
                {i}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Select value={batch} onValueChange={setBatch}>
          <SelectTrigger className="w-full rounded-[1.25rem] sm:w-[160px]">
            <SelectValue placeholder="Batch" />
          </SelectTrigger>
          <SelectContent className="app-scrollbar max-h-72">
            <SelectItem value={ALL}>All batches</SelectItem>
            {batches.map((b) => (
              <SelectItem key={b} value={b}>
                {b}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Select value={status} onValueChange={setStatus}>
          <SelectTrigger className="w-full rounded-[1.25rem] sm:w-[150px]">
            <SelectValue placeholder="Status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value={ALL}>All statuses</SelectItem>
            {statuses.map((s) => (
              <SelectItem key={s} value={s}>
                {s}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className="flex flex-wrap items-center gap-2">
        {(
          [
            { value: "all", label: "All" },
            { value: "liked", label: `Liked (${likedCount})` },
            { value: "disliked", label: `Disliked (${dislikedCount})` },
            { value: "unrated", label: "Unrated" },
          ] as { value: CurationFilter; label: string }[]
        ).map((opt) => (
          <Button
            key={opt.value}
            type="button"
            size="sm"
            variant={curationFilter === opt.value ? "default" : "outline"}
            className="rounded-[1.25rem]"
            onClick={() => setCurationFilter(opt.value)}
          >
            {opt.label}
          </Button>
        ))}
        <p className="ml-auto text-xs text-muted-foreground">
          {filtered.length.toLocaleString()} companies match
        </p>
      </div>

      {/* Mobile: card list */}
      <div className="flex flex-col gap-3 sm:hidden">
        {visibleItems.map((c) => {
          const note = fundingNotes[c.slug];
          const isOpen = expandedFunding === c.slug;
          return (
            <div
              key={c.slug}
              className="rounded-[1.5rem] border border-border/70 bg-card p-4 shadow-sm"
            >
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <p className="font-medium text-foreground">{c.name}</p>
                  <p className="mt-0.5 text-sm text-muted-foreground">{c.one_liner}</p>
                </div>
                <LikeDislike
                  value={curation[c.slug]}
                  onChange={(action) => setAction(c.slug, action)}
                />
              </div>
              <div className="mt-3 flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
                <span>{c.batch}</span>
                {c.industry && <Badge variant="secondary">{c.industry}</Badge>}
                <span>{c.status}</span>
                {c.website && (
                  <a
                    href={c.website}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="ml-auto text-muted-foreground hover:text-foreground"
                    aria-label={`Open ${c.name} website`}
                  >
                    <ExternalLink className="size-3.5" />
                  </a>
                )}
              </div>
              {note && (
                <button
                  type="button"
                  onClick={() => setExpandedFunding(isOpen ? null : c.slug)}
                  className="mt-3 flex items-center gap-1 text-xs font-medium text-emerald-500"
                >
                  <DollarSign className="size-3.5" />
                  Funding research
                  {isOpen ? <ChevronDown className="size-3.5" /> : <ChevronRight className="size-3.5" />}
                </button>
              )}
              {isOpen && note && (
                <div className="mt-2 rounded-[1rem] bg-secondary/40 p-3">
                  <FundingDetail note={note} />
                </div>
              )}
            </div>
          );
        })}
        {visibleItems.length === 0 && (
          <p className="py-10 text-center text-sm text-muted-foreground">
            No companies match these filters.
          </p>
        )}
      </div>

      {/* Desktop: table */}
      <div className="hidden rounded-[1.25rem] border border-border/70 sm:block">
        <Table>
          <TableHeader className="sticky top-0 z-10 bg-card">
            <TableRow>
              <TableHead className="w-20">Rate</TableHead>
              <SortableHead label="Name" sortKey="name" active={sortKey} dir={sortDir} onSort={handleSort} />
              <TableHead>One-liner</TableHead>
              <SortableHead label="Batch" sortKey="batch" active={sortKey} dir={sortDir} onSort={handleSort} />
              <SortableHead label="Industry" sortKey="industry" active={sortKey} dir={sortDir} onSort={handleSort} />
              <SortableHead label="Status" sortKey="status" active={sortKey} dir={sortDir} onSort={handleSort} />
              <TableHead className="w-10">Funding</TableHead>
              <TableHead className="w-10" />
            </TableRow>
          </TableHeader>
          <TableBody>
            {visibleItems.map((c) => {
              const note = fundingNotes[c.slug];
              const isOpen = expandedFunding === c.slug;
              return (
                <Fragment key={c.slug}>
                  <TableRow>
                    <TableCell>
                      <LikeDislike
                        value={curation[c.slug]}
                        onChange={(action) => setAction(c.slug, action)}
                      />
                    </TableCell>
                    <TableCell className="font-medium">{c.name}</TableCell>
                    <TableCell className="max-w-[320px] truncate text-muted-foreground">
                      {c.one_liner}
                    </TableCell>
                    <TableCell className="whitespace-nowrap text-muted-foreground">
                      {c.batch}
                    </TableCell>
                    <TableCell className="whitespace-nowrap">
                      {c.industry && <Badge variant="secondary">{c.industry}</Badge>}
                    </TableCell>
                    <TableCell className="whitespace-nowrap text-muted-foreground">
                      {c.status}
                    </TableCell>
                    <TableCell>
                      <FundingButton
                        note={note}
                        isOpen={isOpen}
                        onToggle={() => setExpandedFunding(isOpen ? null : c.slug)}
                      />
                    </TableCell>
                    <TableCell>
                      {c.website && (
                        <a
                          href={c.website}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-muted-foreground hover:text-foreground"
                          aria-label={`Open ${c.name} website`}
                        >
                          <ExternalLink className="size-3.5" />
                        </a>
                      )}
                    </TableCell>
                  </TableRow>
                  {isOpen && note && (
                    <TableRow>
                      <TableCell colSpan={8} className="bg-secondary/40 text-sm">
                        <FundingDetail note={note} />
                      </TableCell>
                    </TableRow>
                  )}
                </Fragment>
              );
            })}
            {visibleItems.length === 0 && (
              <TableRow>
                <TableCell colSpan={8} className="py-10 text-center text-sm text-muted-foreground">
                  No companies match these filters.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>

      {/* Infinite-scroll sentinel — grows visibleCount when it scrolls into view */}
      <div ref={sentinelRef} className="flex items-center justify-center py-4 text-xs text-muted-foreground">
        {hasMore ? (
          <span className="flex items-center gap-2">
            <Loader2 className="size-3.5 animate-spin" />
            Loading more…
          </span>
        ) : visibleItems.length > 0 ? (
          <span>All {filtered.length.toLocaleString()} companies shown</span>
        ) : null}
      </div>
    </div>
  );
}
