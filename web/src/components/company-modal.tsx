"use client";

import { ExternalLink, MapPin, Users, Calendar, Star } from "lucide-react";
import {
  Dialog,
  DialogBody,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { LikeDislike } from "@/components/like-dislike";
import type { CurationAction, FundingNote } from "@/lib/curation";
import type { SlimCompany } from "@/components/companies-explorer";

export function CompanyModal({
  company,
  open,
  onOpenChange,
  rating,
  onRatingChange,
  fundingNote,
}: {
  company: SlimCompany | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  rating?: CurationAction;
  onRatingChange: (action: CurationAction | "clear") => void;
  fundingNote?: FundingNote;
}) {
  if (!company) return null;

  const launchedDate = company.launched_at
    ? new Date(company.launched_at * 1000).toLocaleDateString(undefined, {
        year: "numeric",
        month: "long",
      })
    : null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <div className="flex items-start justify-between gap-3 pr-8">
            <div className="min-w-0">
              <DialogTitle className="flex items-center gap-2 text-lg">
                {company.name}
                {company.top_company && (
                  <Star className="size-4 shrink-0 fill-amber-400 text-amber-400" />
                )}
              </DialogTitle>
              <DialogDescription className="mt-1">{company.one_liner}</DialogDescription>
            </div>
          </div>
        </DialogHeader>

        <DialogBody className="flex flex-col gap-4">
          <div className="flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
            <Badge variant="secondary">{company.batch}</Badge>
            {company.industry && <Badge variant="secondary">{company.industry}</Badge>}
            <span>{company.status}</span>
            {company.stage && <span>· {company.stage} stage</span>}
          </div>

          {company.long_description && (
            <p className="text-sm leading-relaxed text-foreground">
              {company.long_description}
            </p>
          )}

          <div className="grid grid-cols-2 gap-3 text-sm">
            {company.all_locations && (
              <div className="flex items-center gap-1.5 text-muted-foreground">
                <MapPin className="size-3.5 shrink-0" />
                <span className="truncate">{company.all_locations}</span>
              </div>
            )}
            {company.team_size != null && (
              <div className="flex items-center gap-1.5 text-muted-foreground">
                <Users className="size-3.5 shrink-0" />
                <span>{company.team_size} people</span>
              </div>
            )}
            {launchedDate && (
              <div className="flex items-center gap-1.5 text-muted-foreground">
                <Calendar className="size-3.5 shrink-0" />
                <span>Launched {launchedDate}</span>
              </div>
            )}
            {company.website && (
              <a
                href={company.website}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-1.5 text-primary hover:underline"
              >
                <ExternalLink className="size-3.5 shrink-0" />
                <span className="truncate">Website</span>
              </a>
            )}
          </div>

          {company.tags.length > 0 && (
            <div className="flex flex-wrap gap-1.5">
              {company.tags.map((t) => (
                <Badge key={t} variant="outline" className="text-xs">
                  {t}
                </Badge>
              ))}
            </div>
          )}

          {fundingNote && (
            <div className="rounded-[1rem] bg-secondary/40 p-3 text-sm">
              <p className="mb-1 text-xs font-medium uppercase tracking-wide text-muted-foreground/80">
                Funding research — {new Date(fundingNote.updatedAt).toLocaleDateString()}
              </p>
              <p className="text-foreground">{fundingNote.summary}</p>
              {fundingNote.source && (
                <a
                  href={fundingNote.source}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="mt-1 inline-block text-xs text-primary underline"
                >
                  Source
                </a>
              )}
            </div>
          )}

          <p className="text-xs text-muted-foreground/70">
            Founder names aren&apos;t in this data — YC&apos;s public directory
            doesn&apos;t expose them in bulk, only on each company&apos;s individual
            page. Ask Claude if you want that added as a separate scrape.
          </p>
        </DialogBody>

        <div className="flex shrink-0 items-center justify-between border-t border-border/70 pt-4">
          <span className="text-sm text-muted-foreground">Rate this company</span>
          <LikeDislike value={rating} onChange={onRatingChange} size="icon" />
        </div>
      </DialogContent>
    </Dialog>
  );
}
