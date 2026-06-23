"use client";

import { useState } from "react";
import { Search } from "lucide-react";
import { Input } from "@/components/ui/input";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import type { Mover } from "@/lib/data";

export function MoversTable({ movers }: { movers: Mover[] }) {
  const [query, setQuery] = useState("");
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
      <div className="app-scrollbar max-h-[420px] overflow-y-auto rounded-[1.25rem] border border-border/70">
        <Table>
          <TableHeader className="sticky top-0 bg-card">
            <TableRow>
              <TableHead>Theme</TableHead>
              <TableHead className="text-right">Baseline</TableHead>
              <TableHead className="text-right">Recent</TableHead>
              <TableHead className="text-right">Change</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filtered.map((m) => (
              <TableRow key={m.theme}>
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
            ))}
            {filtered.length === 0 && (
              <TableRow>
                <TableCell colSpan={4} className="py-8 text-center text-sm text-muted-foreground">
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
