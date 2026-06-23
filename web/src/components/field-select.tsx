"use client";

import { useRouter } from "next/navigation";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { TREND_FIELDS, type TrendField } from "@/lib/trend-fields";

const LABELS: Record<TrendField, string> = {
  keywords: "Themes (from descriptions)",
  industry: "Industry",
  tags: "Tags",
  subindustry: "Subindustry",
};

export function FieldSelect({ value }: { value: TrendField }) {
  const router = useRouter();

  return (
    <Select value={value} onValueChange={(next) => router.push(`/trends?field=${next}`)}>
      <SelectTrigger className="w-[240px] rounded-[1.25rem]">
        <SelectValue />
      </SelectTrigger>
      <SelectContent>
        {TREND_FIELDS.map((f) => (
          <SelectItem key={f} value={f}>
            {LABELS[f]}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}
