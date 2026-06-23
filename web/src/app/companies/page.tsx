import { CompaniesExplorer } from "@/components/companies-explorer";
import { getCompanies } from "@/lib/data";
import { getCurationState } from "@/lib/curation";

export const dynamic = "force-dynamic";

export default async function CompaniesPage() {
  const companies = getCompanies()
    .slice()
    .reverse() // newest batches first
    .map((c) => ({
      name: c.name,
      slug: c.slug,
      batch: c.batch,
      status: c.status,
      industry: c.industry,
      one_liner: c.one_liner,
      website: c.website,
      tags: c.tags,
    }));
  const { companies: initialCuration, fundingNotes } = await getCurationState();

  return (
    <div className="flex flex-col gap-6">
      <div>
        <p className="text-xs font-medium uppercase tracking-[0.18em] text-muted-foreground">
          Companies
        </p>
        <h1 className="text-2xl font-semibold tracking-tight text-foreground sm:text-3xl">
          {companies.length.toLocaleString()} YC companies
        </h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Full public directory — search by name, one-liner, or tag, and filter by
          industry or batch. Rate companies to build a curated list.
        </p>
      </div>
      <CompaniesExplorer
        companies={companies}
        initialCuration={initialCuration}
        fundingNotes={fundingNotes}
      />
    </div>
  );
}
