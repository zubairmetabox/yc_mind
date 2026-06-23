import type { Metadata } from "next";
import Script from "next/script";
import NextTopLoader from "nextjs-toploader";
import { Geist, Geist_Mono } from "next/font/google";
import { Toaster } from "sonner";
import { ThemeProvider } from "@/components/theme-provider";
import { TooltipProvider } from "@/components/ui/tooltip";
import { AppShell } from "@/components/app-shell";
import "./globals.css";

const geistSans = Geist({ variable: "--font-geist-sans", subsets: ["latin"] });
const geistMono = Geist_Mono({ variable: "--font-geist-mono", subsets: ["latin"] });

const themeInitScript = `
(() => {
  const storageKey = "yc-mind-theme";
  const root = document.documentElement;
  const stored = localStorage.getItem(storageKey);
  const theme = stored === "light" || stored === "dark" || stored === "system" ? stored : "system";
  const sys = window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light";
  const resolved = theme === "system" ? sys : theme;
  root.classList.toggle("dark", resolved === "dark");
  root.style.colorScheme = resolved;
})();
`;

export const metadata: Metadata = {
  title: "YC_Mind",
  description: "YC funding trend explorer — Metabox internal.",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html
      lang="en"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
      suppressHydrationWarning
    >
      <head>
        <Script id="theme-init" strategy="beforeInteractive">
          {themeInitScript}
        </Script>
      </head>
      <body className="min-h-full font-sans text-foreground">
        <NextTopLoader color="#9edcff" height={2} showSpinner={false} shadow={false} />
        <ThemeProvider>
          <TooltipProvider>
            <AppShell>{children}</AppShell>
            <Toaster position="top-center" richColors />
          </TooltipProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
