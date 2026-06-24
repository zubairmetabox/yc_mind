import { UserButton } from "@clerk/nextjs";
import { BrandMark } from "@/components/brand-mark";
import { NavLinks } from "@/components/nav-links";
import { ThemeToggle } from "@/components/theme-toggle";
import { MobileTabBar } from "@/components/mobile-tab-bar";

export function AppShell({ children }: { children: React.ReactNode }) {
  return (
    <div className="h-dvh overflow-hidden" style={{ background: "var(--app-shell-bg)" }}>
      <div className="mx-auto grid h-full max-w-[1600px] gap-4 lg:p-4 lg:grid-cols-[260px_1fr]">
        {/* Sidebar — desktop only, mobile uses the bottom tab bar instead */}
        <div className="hidden h-full min-h-0 flex-col gap-4 lg:flex">
          <BrandMark />
          <div className="flex min-h-0 flex-1 flex-col rounded-[2rem] border border-border/80 bg-card/60 p-3 shadow-sm backdrop-blur">
            <NavLinks />
            <div className="mt-auto pt-3 text-xs text-muted-foreground">
              <p className="px-3.5">
                Mines YC&apos;s public company directory for funding trends — internal
                Metabox tool.
              </p>
            </div>
          </div>
        </div>

        {/* Main panel — full-bleed on mobile, floating card on desktop */}
        <div className="flex h-full min-h-0 flex-col overflow-hidden border-border/80 bg-background lg:rounded-[2rem] lg:border lg:shadow-[0_30px_100px_-50px_rgba(15,23,42,0.45)]">
          <header className="sticky top-0 z-20 flex items-center justify-between gap-3 border-b border-border/70 bg-background px-4 py-3 sm:px-6">
            <div className="lg:hidden">
              <BrandMark plain />
            </div>
            <div className="hidden text-sm text-muted-foreground lg:block">
              YC company directory + theme trends, refreshed from local data.
            </div>
            <div className="flex items-center gap-2">
              <ThemeToggle />
              <UserButton />
            </div>
          </header>
          <main className="app-scrollbar flex-1 overflow-y-auto p-3 sm:p-4 lg:p-6">{children}</main>
          <MobileTabBar />
        </div>
      </div>
    </div>
  );
}
