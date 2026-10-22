"use client";

import { useSyncExternalStore } from "react";
import { Moon, Sun } from "lucide-react";

import { cn } from "@/lib/utils";
import { applyTheme, DEFAULT_THEME } from "@/lib/theme";

// Observa a classe "dark" do <html>, mantendo vários botões sincronizados
function subscribe(callback: () => void) {
  const observer = new MutationObserver(callback);
  observer.observe(document.documentElement, {
    attributes: true,
    attributeFilter: ["class"],
  });
  return () => observer.disconnect();
}

export default function ThemeToggle({ className }: { className?: string }) {
  const isDark = useSyncExternalStore(
    subscribe,
    () => document.documentElement.classList.contains("dark"),
    () => DEFAULT_THEME === "dark"
  );

  return (
    <button
      type="button"
      onClick={() => applyTheme(isDark ? "light" : "dark")}
      aria-label={isDark ? "Ativar tema claro" : "Ativar tema escuro"}
      title={isDark ? "Tema claro" : "Tema escuro"}
      className={cn(
        "grid size-10 shrink-0 place-items-center rounded-lg text-muted-foreground transition-colors hover:bg-accent hover:text-foreground",
        className
      )}
    >
      {isDark ? (
        <Sun aria-hidden className="size-[18px]" />
      ) : (
        <Moon aria-hidden className="size-[18px]" />
      )}
    </button>
  );
}
