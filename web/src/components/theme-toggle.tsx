"use client";

import { Laptop, Moon, Sun } from "lucide-react";
import { useEffect, useState } from "react";

import { useTheme } from "@/components/theme-provider";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

const themeOptions = [
  { value: "light", label: "Light", icon: Sun },
  { value: "dark", label: "Dark", icon: Moon },
  { value: "system", label: "Auto", icon: Laptop },
] as const;

export function ThemeToggle() {
  const { setTheme, theme } = useTheme();
  const [mounted, setMounted] = useState(false);

  useEffect(() => setMounted(true), []);

  return (
    <div className="flex gap-1 rounded-[1.25rem] border border-border bg-secondary/60 p-1">
      {themeOptions.map((option) => {
        const Icon = option.icon;
        const active = mounted && theme === option.value;
        return (
          <Button
            key={option.value}
            type="button"
            size="icon"
            variant={active ? "default" : "ghost"}
            className={cn("size-8 rounded-[1rem]", !mounted && "opacity-80")}
            aria-label={option.label}
            onClick={() => setTheme(option.value)}
          >
            <Icon className="size-4" />
          </Button>
        );
      })}
    </div>
  );
}
