"use client";

import { useMemo, useState } from "react";
import { Search, ExternalLink } from "lucide-react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

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

export function CompaniesExplorer({ companies }: { companies: SlimCompany[] }) {
  const [query, setQuery] = useState("");
  const [industry, setIndustry] = useState(ALL);
  const [batch, setBatch] = useState(ALL);
  const [page, setPage] = useState(0);

  const industries = useMemo(
    () => Array.from(new Set(companies.map((c) => c.industry).filter(Boolean))).sort(),
    [companies],
  );
  const batches = useMemo(
    () => Array.from(new Set(companies.map((c) => c.batch).filter(Boolean))),
    [companies],
  );

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return companies.filter((c) => {
      if (industry !== ALL && c.industry !== industry) return false;
      if (batch !== ALL && c.batch !== batch) return false;
      if (!q) return true;
      return (
        c.name.toLowerCase().includes(q) ||
        c.one_liner.toLowerCase().includes(q) ||
        c.tags.some((t) => t.toLowerCase().includes(q))
      );
    });
  }, [companies, query, industry, batch]);

  const pageCount = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const safePage = Math.min(page, pageCount - 1);
  const pageItems = filtered.slice(safePage * PAGE_SIZE, safePage * PAGE_SIZE + PAGE_SIZE);

  function updateFilter(setter: (v: string) => void) {
    return (v: string) => {
      setter(v);
      setPage(0);
    };
  }

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-col gap-3 sm:flex-row">
        <div className="flex flex-1 items-center gap-2 rounded-[1.25rem] border border-border/70 bg-secondary/60 px-3 py-2">
          <Search className="size-4 text-muted-foreground" />
          <input
            value={query}
            onChange={(e) => updateFilter(setQuery)(e.target.value)}
            placeholder="Search name, one-liner, or tag…"
            className="flex-1 bg-transparent text-sm text-foreground outline-none placeholder:text-muted-foreground"
          />
        </div>
        <Select value={industry} onValueChange={updateFilter(setIndustry)}>
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
        <Select value={batch} onValueChange={updateFilter(setBatch)}>
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
      </div>

      <p className="text-xs text-muted-foreground">
        {filtered.length.toLocaleString()} companies match
      </p>

      <div className="app-scrollbar overflow-y-auto rounded-[1.25rem] border border-border/70">
        <Table>
          <TableHeader className="sticky top-0 bg-card">
            <TableRow>
              <TableHead>Name</TableHead>
              <TableHead>One-liner</TableHead>
              <TableHead>Batch</TableHead>
              <TableHead>Industry</TableHead>
              <TableHead>Status</TableHead>
              <TableHead className="w-10" />
            </TableRow>
          </TableHeader>
          <TableBody>
            {pageItems.map((c) => (
              <TableRow key={c.slug}>
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
            ))}
            {pageItems.length === 0 && (
              <TableRow>
                <TableCell colSpan={6} className="py-10 text-center text-sm text-muted-foreground">
                  No companies match these filters.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>

      <div className="flex items-center justify-between text-sm text-muted-foreground">
        <span>
          Page {safePage + 1} of {pageCount}
        </span>
        <div className="flex gap-2">
          <Button
            variant="outline"
            size="sm"
            className="rounded-[1.25rem]"
            disabled={safePage === 0}
            onClick={() => setPage((p) => Math.max(0, p - 1))}
          >
            Previous
          </Button>
          <Button
            variant="outline"
            size="sm"
            className="rounded-[1.25rem]"
            disabled={safePage >= pageCount - 1}
            onClick={() => setPage((p) => Math.min(pageCount - 1, p + 1))}
          >
            Next
          </Button>
        </div>
      </div>
    </div>
  );
}
