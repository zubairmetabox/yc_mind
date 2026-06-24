"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { LayoutDashboard, TrendingUp, Building2 } from "lucide-react";
import { cn } from "@/lib/utils";

// Ideas page is hidden — generated startup ideas aren't being shown for now.
// See src/app/ideas/page.tsx (redirects to /) if this needs reverting.
const NAV_ITEMS = [
  { href: "/", label: "Overview", icon: LayoutDashboard },
  { href: "/trends", label: "Trends", icon: TrendingUp },
  { href: "/companies", label: "Companies", icon: Building2 },
] as const;

export function NavLinks() {
  const pathname = usePathname();

  return (
    <nav className="flex flex-col gap-1">
      {NAV_ITEMS.map((item) => {
        const isActive = pathname === item.href;
        const Icon = item.icon;
        return (
          <Link
            key={item.href}
            href={item.href}
            className={cn(
              "flex items-center gap-2.5 rounded-[1.25rem] px-3.5 py-2.5 text-sm font-medium transition-colors duration-150",
              isActive
                ? "border border-border/80 bg-accent text-accent-foreground shadow-sm"
                : "text-muted-foreground hover:bg-secondary/70 hover:text-foreground",
            )}
          >
            <Icon className="size-4" />
            {item.label}
          </Link>
        );
      })}
    </nav>
  );
}
