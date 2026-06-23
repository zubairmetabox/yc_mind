"use client";

import { Fragment, useState } from "react";
import { Search, ChevronDown, ChevronRight } from "lucide-react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import type { Mover } from "@/lib/data";
import { getThemeNote } from "@/lib/theme-notes";

export function MoversTable({ movers }: { movers: Mover[] }) {
  const [query, setQuery] = useState("");
  const [expanded, setExpanded] = useState<string | null>(null);
  const filtered = movers.filter((m) =>
    m.theme.toLowerCase().includes(query.toLowerCase()),
  );

  return (
    <div className="flex flex-col gap-3">
      <div className="flex items-center gap-2 rounded-[1.25rem] border border-border/70 bg-secondary/60 px-3 py-2">
        <Search className="size-4 text-muted-foreground" />
        <input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Filter themes…"
          className="flex-1 bg-transparent text-sm text-foreground outline-none placeholder:text-muted-foreground"
        />
      </div>
      <div className="app-scrollbar max-h-[480px] overflow-x-auto overflow-y-auto rounded-[1.25rem] border border-border/70">
        <Table className="min-w-[480px]">
          <TableHeader className="sticky top-0 bg-card">
            <TableRow>
              <TableHead className="w-6" />
              <TableHead>Theme</TableHead>
              <TableHead className="text-right">Baseline</TableHead>
              <TableHead className="text-right">Recent</TableHead>
              <TableHead className="text-right">Change</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filtered.map((m) => {
              const note = getThemeNote(m.theme);
              const isOpen = expanded === m.theme;
              return (
                <Fragment key={m.theme}>
                  <TableRow
                    className={note ? "cursor-pointer" : undefined}
                    onClick={() => note && setExpanded(isOpen ? null : m.theme)}
                  >
                    <TableCell className="text-muted-foreground">
                      {note ? (
                        isOpen ? (
                          <ChevronDown className="size-3.5" />
                        ) : (
                          <ChevronRight className="size-3.5" />
                        )
                      ) : null}
                    </TableCell>
                    <TableCell className="font-medium">{m.theme}</TableCell>
                    <TableCell className="text-right text-muted-foreground">
                      {(m.baselineShare * 100).toFixed(1)}%
                    </TableCell>
                    <TableCell className="text-right text-muted-foreground">
                      {(m.recentShare * 100).toFixed(1)}%
                    </TableCell>
                    <TableCell
                      className={`text-right font-medium ${
                        m.change >= 0 ? "text-emerald-500" : "text-rose-500"
                      }`}
                    >
                      {m.change >= 0 ? "+" : ""}
                      {(m.change * 100).toFixed(1)} pts
                    </TableCell>
                  </TableRow>
                  {isOpen && note && (
                    <TableRow>
                      <TableCell />
                      <TableCell colSpan={4} className="bg-secondary/40 text-sm text-muted-foreground">
                        <span className="mb-1 block text-xs font-medium uppercase tracking-wide text-muted-foreground/80">
                          Analysis, not data — why this might be moving
                        </span>
                        {note}
                      </TableCell>
                    </TableRow>
                  )}
                </Fragment>
              );
            })}
            {filtered.length === 0 && (
              <TableRow>
                <TableCell colSpan={5} className="py-8 text-center text-sm text-muted-foreground">
                  No themes match &ldquo;{query}&rdquo;.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
