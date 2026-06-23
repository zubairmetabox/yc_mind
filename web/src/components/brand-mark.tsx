import Link from "next/link";
import { Telescope } from "lucide-react";
import { cn } from "@/lib/utils";

export function BrandMark({ plain = false }: { plain?: boolean }) {
  return (
    <Link
      href="/"
      className={cn(
        "group inline-flex items-center gap-2.5",
        !plain && "rounded-[1.5rem] border border-border/80 bg-card/80 p-2.5 shadow-sm backdrop-blur",
      )}
    >
      <div
        className={cn(
          "flex items-center justify-center rounded-[1.25rem] text-primary-foreground shadow-lg shadow-cyan-950/15 transition-transform duration-200 group-hover:scale-[1.03]",
          plain ? "size-8 rounded-xl" : "size-11",
        )}
        style={{ background: "linear-gradient(135deg, var(--brand-from), var(--brand-to))" }}
      >
        <Telescope className={plain ? "size-4" : "size-5"} />
      </div>
      <p className="text-sm font-semibold tracking-tight text-foreground">YC_Mind</p>
    </Link>
  );
}
